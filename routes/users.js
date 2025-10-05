const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validateUserId, validateRegister } = require('../middleware/validation');

const router = express.Router();

// Tüm kullanıcıları getir (sadece admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, department, role, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    let paramIndex = 1;

    if (department) {
      whereClause += ` AND department = $${paramIndex}`;
      queryParams.push(department);
      paramIndex++;
    }

    if (role) {
      whereClause += ` AND role = $${paramIndex}`;
      queryParams.push(role);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const usersResult = await query(
      `SELECT id, first_name, last_name, email, department, role, is_active, created_at
       FROM users 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    // Toplam sayı
    const countResult = await query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );

    const totalUsers = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı detayını getir
router.get('/:userId', authenticateToken, requireOwnershipOrAdmin, validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;

    const userResult = await query(
      `SELECT id, first_name, last_name, email, department, role, is_active, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Kullanıcının mola istatistikleri
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_breaks,
        COALESCE(SUM(duration_minutes), 0) as total_minutes,
        AVG(duration_minutes) as avg_duration
       FROM breaks 
       WHERE user_id = $1 AND end_time IS NOT NULL`,
      [userId]
    );

    const todayStatsResult = await query(
      `SELECT 
        COUNT(*) as today_breaks,
        COALESCE(SUM(duration_minutes), 0) as today_minutes
       FROM breaks 
       WHERE user_id = $1 
       AND start_time >= $2 
       AND end_time IS NOT NULL`,
      [userId, todayStart]
    );

    res.json({
      success: true,
      data: {
        user: userResult.rows[0],
        stats: {
          totalBreaks: parseInt(statsResult.rows[0].total_breaks),
          totalMinutes: parseInt(statsResult.rows[0].total_minutes),
          avgDuration: parseFloat(statsResult.rows[0].avg_duration || 0),
          todayBreaks: parseInt(todayStatsResult.rows[0].today_breaks),
          todayMinutes: parseInt(todayStatsResult.rows[0].today_minutes)
        }
      }
    });

  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı oluştur (sadece admin)
router.post('/', authenticateToken, requireAdmin, validateRegister, async (req, res) => {
  try {
    const { firstName, lastName, email, password, department, role = 'employee' } = req.body;

    // Email zaten var mı kontrol et
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi zaten kullanılıyor'
      });
    }

    // Şifreyi hash'le
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Kullanıcıyı kaydet
    const newUser = await query(
      'INSERT INTO users (first_name, last_name, email, password_hash, department, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, role, department, created_at',
      [firstName, lastName, email, passwordHash, department, role]
    );

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      data: {
        user: newUser.rows[0]
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı güncelle (sadece admin veya kendi kaydı)
router.put('/:userId', authenticateToken, requireOwnershipOrAdmin, validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, department, role, isActive } = req.body;

    // Email değişikliği kontrolü
    if (email) {
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu email adresi zaten kullanılıyor'
        });
      }
    }

    // Güncelleme verilerini hazırla
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (firstName) {
      updates.push(`first_name = $${paramIndex}`);
      values.push(firstName);
      paramIndex++;
    }

    if (lastName) {
      updates.push(`last_name = $${paramIndex}`);
      values.push(lastName);
      paramIndex++;
    }

    if (email) {
      updates.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }

    if (department) {
      updates.push(`department = $${paramIndex}`);
      values.push(department);
      paramIndex++;
    }

    // Rol ve aktiflik durumu sadece admin değiştirebilir
    if (req.user.role === 'admin') {
      if (role) {
        updates.push(`role = $${paramIndex}`);
        values.push(role);
        paramIndex++;
      }

      if (typeof isActive === 'boolean') {
        updates.push(`is_active = $${paramIndex}`);
        values.push(isActive);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek veri bulunamadı'
      });
    }

    values.push(userId);

    const updatedUser = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, first_name, last_name, role, department, is_active`,
      values
    );

    res.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      data: {
        user: updatedUser.rows[0]
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı şifresini değiştir
router.put('/:userId/password', authenticateToken, requireOwnershipOrAdmin, validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Yeni şifre en az 6 karakter olmalıdır'
      });
    }

    // Mevcut şifreyi kontrol et (kendi şifresi için)
    if (req.user.id === parseInt(userId)) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mevcut şifre gereklidir'
        });
      }

      const userResult = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mevcut şifre yanlış'
        });
      }
    }

    // Yeni şifreyi hash'le
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId]
    );

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Departmanları getir
router.get('/departments/list', authenticateToken, async (req, res) => {
  try {
    const departmentsResult = await query(
      'SELECT DISTINCT department FROM users WHERE department IS NOT NULL AND department != \'\' ORDER BY department'
    );

    res.json({
      success: true,
      data: {
        departments: departmentsResult.rows.map(row => row.department)
      }
    });

  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;

