const express = require('express');
const moment = require('moment');
const { query } = require('../config/database');
const { authenticateToken, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validateStartBreak, validateEndBreak, validateUserId, validateDateRange } = require('../middleware/validation');
const { getIO } = require('../config/socket');

const router = express.Router();

// Aktif mola durumunu getir
router.get('/status/:userId', authenticateToken, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Kullanıcının aktif molası var mı kontrol et
    const activeBreakResult = await query(
      `SELECT b.*, bt.name as break_type_name 
       FROM breaks b 
       LEFT JOIN break_types bt ON b.break_type_id = bt.id 
       WHERE b.user_id = $1 AND b.end_time IS NULL 
       ORDER BY b.start_time DESC LIMIT 1`,
      [userId]
    );

    // Günlük mola istatistikleri
    const todayStart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const todayEnd = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');

    const dailyStatsResult = await query(
      `SELECT 
        COUNT(*) as break_count,
        COALESCE(SUM(duration_minutes), 0) as total_minutes
       FROM breaks 
       WHERE user_id = $1 
       AND start_time >= $2 
       AND start_time <= $3 
       AND end_time IS NOT NULL`,
      [userId, todayStart, todayEnd]
    );

    // Sistem ayarlarından günlük limit
    const settingsResult = await query(
      'SELECT setting_value FROM system_settings WHERE setting_key = $1',
      ['max_daily_break_minutes']
    );

    const maxDailyMinutes = parseInt(settingsResult.rows[0]?.setting_value || '60');
    const dailyStats = dailyStatsResult.rows[0];

    res.json({
      success: true,
      data: {
        activeBreak: activeBreakResult.rows[0] || null,
        dailyStats: {
          breakCount: parseInt(dailyStats.break_count),
          totalMinutes: parseInt(dailyStats.total_minutes),
          remainingMinutes: Math.max(0, maxDailyMinutes - parseInt(dailyStats.total_minutes)),
          maxDailyMinutes
        }
      }
    });

  } catch (error) {
    console.error('Get break status error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Mola başlat
router.post('/start', authenticateToken, validateStartBreak, async (req, res) => {
  try {
    const { breakTypeId } = req.body;
    const userId = req.user.id;

    // Kullanıcının zaten aktif molası var mı kontrol et
    const existingBreakResult = await query(
      'SELECT id FROM breaks WHERE user_id = $1 AND end_time IS NULL',
      [userId]
    );

    if (existingBreakResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Zaten aktif bir molanız bulunuyor'
      });
    }

    // Günlük mola limiti kontrolü
    const todayStart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const todayEnd = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');

    const dailyStatsResult = await query(
      `SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes
       FROM breaks 
       WHERE user_id = $1 
       AND start_time >= $2 
       AND start_time <= $3 
       AND end_time IS NOT NULL`,
      [userId, todayStart, todayEnd]
    );

    const settingsResult = await query(
      'SELECT setting_value FROM system_settings WHERE setting_key = $1',
      ['max_daily_break_minutes']
    );

    const maxDailyMinutes = parseInt(settingsResult.rows[0]?.setting_value || '60');
    const usedMinutes = parseInt(dailyStatsResult.rows[0].total_minutes);

    if (usedMinutes >= maxDailyMinutes) {
      return res.status(400).json({
        success: false,
        message: `Günlük mola limitinize ulaştınız (${maxDailyMinutes} dakika)`
      });
    }

    // Mola başlat
    const startTime = new Date();
    const newBreak = await query(
      'INSERT INTO breaks (user_id, break_type_id, start_time) VALUES ($1, $2, $3) RETURNING *',
      [userId, breakTypeId, startTime]
    );

    // Kullanıcı bilgilerini al
    const userResult = await query(
      'SELECT first_name, last_name, department FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    // Socket.IO ile bildirim gönder
    const io = getIO();
    io.emit('break_started', {
      userId,
      userName: `${user.first_name} ${user.last_name}`,
      department: user.department,
      startTime,
      breakTypeId
    });

    res.json({
      success: true,
      message: 'Mola başlatıldı',
      data: {
        break: newBreak.rows[0]
      }
    });

  } catch (error) {
    console.error('Start break error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Mola bitir
router.post('/end/:breakId', authenticateToken, validateEndBreak, async (req, res) => {
  try {
    const { breakId } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    // Molayı bul ve kontrol et
    const breakResult = await query(
      'SELECT * FROM breaks WHERE id = $1 AND user_id = $2 AND end_time IS NULL',
      [breakId, userId]
    );

    if (breakResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aktif mola bulunamadı'
      });
    }

    const currentBreak = breakResult.rows[0];
    const endTime = new Date();
    const durationMinutes = Math.round((endTime - new Date(currentBreak.start_time)) / (1000 * 60));

    // Minimum mola süresi kontrolü
    const settingsResult = await query(
      'SELECT setting_value FROM system_settings WHERE setting_key = $1',
      ['min_break_duration']
    );

    const minBreakDuration = parseInt(settingsResult.rows[0]?.setting_value || '5');

    if (durationMinutes < minBreakDuration) {
      return res.status(400).json({
        success: false,
        message: `Minimum mola süresi ${minBreakDuration} dakikadır`
      });
    }

    // Molayı bitir
    const updatedBreak = await query(
      'UPDATE breaks SET end_time = $1, duration_minutes = $2, notes = $3 WHERE id = $4 RETURNING *',
      [endTime, durationMinutes, notes, breakId]
    );

    // Kullanıcı bilgilerini al
    const userResult = await query(
      'SELECT first_name, last_name, department FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    // Socket.IO ile bildirim gönder
    const io = getIO();
    io.emit('break_ended', {
      userId,
      userName: `${user.first_name} ${user.last_name}`,
      department: user.department,
      endTime,
      durationMinutes
    });

    res.json({
      success: true,
      message: 'Mola tamamlandı',
      data: {
        break: updatedBreak.rows[0]
      }
    });

  } catch (error) {
    console.error('End break error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Mola geçmişi
router.get('/history/:userId', authenticateToken, requireOwnershipOrAdmin, validateDateRange, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    let whereClause = 'WHERE b.user_id = $1';
    let queryParams = [userId];
    let paramIndex = 2;

    if (startDate) {
      whereClause += ` AND b.start_time >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND b.start_time <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }

    const offset = (page - 1) * limit;

    const breaksResult = await query(
      `SELECT b.*, bt.name as break_type_name,
              EXTRACT(EPOCH FROM (b.end_time - b.start_time))/60 as duration_minutes_calculated
       FROM breaks b
       LEFT JOIN break_types bt ON b.break_type_id = bt.id
       ${whereClause}
       ORDER BY b.start_time DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    // Toplam sayı
    const countResult = await query(
      `SELECT COUNT(*) as total FROM breaks b ${whereClause}`,
      queryParams
    );

    const totalBreaks = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalBreaks / limit);

    res.json({
      success: true,
      data: {
        breaks: breaksResult.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalBreaks,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get break history error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Mola tiplerini getir
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const breakTypesResult = await query(
      'SELECT * FROM break_types WHERE is_active = true ORDER BY name'
    );

    res.json({
      success: true,
      data: {
        breakTypes: breakTypesResult.rows
      }
    });

  } catch (error) {
    console.error('Get break types error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Unutulan molaları otomatik bitir (sadece admin)
router.post('/auto-end-forgotten', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gereklidir'
      });
    }

    const settingsResult = await query(
      'SELECT setting_value FROM system_settings WHERE setting_key = $1',
      ['auto_end_break_minutes']
    );

    const autoEndMinutes = parseInt(settingsResult.rows[0]?.setting_value || '120');
    const cutoffTime = moment().subtract(autoEndMinutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');

    // Uzun süredir devam eden molaları bul
    const forgottenBreaksResult = await query(
      `SELECT b.*, u.first_name, u.last_name 
       FROM breaks b
       JOIN users u ON b.user_id = u.id
       WHERE b.end_time IS NULL 
       AND b.start_time <= $1`,
      [cutoffTime]
    );

    const autoEndTime = new Date();
    let endedCount = 0;

    for (const breakRecord of forgottenBreaksResult.rows) {
      const durationMinutes = Math.round((autoEndTime - new Date(breakRecord.start_time)) / (1000 * 60));
      
      await query(
        'UPDATE breaks SET end_time = $1, duration_minutes = $2, is_auto_ended = true, notes = COALESCE(notes, \'\') || \' (Otomatik bitirildi)\' WHERE id = $3',
        [autoEndTime, durationMinutes, breakRecord.id]
      );

      endedCount++;
    }

    res.json({
      success: true,
      message: `${endedCount} adet unutulan mola otomatik olarak bitirildi`,
      data: {
        endedCount
      }
    });

  } catch (error) {
    console.error('Auto-end forgotten breaks error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;

