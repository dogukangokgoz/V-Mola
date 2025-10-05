const express = require('express');
const moment = require('moment');
const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateDateRange } = require('../middleware/validation');

const router = express.Router();

// Anlık mola durumları (tüm çalışanlar)
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Aktif molalar
    const activeBreaksResult = await query(
      `SELECT b.*, u.first_name, u.last_name, u.department, bt.name as break_type_name
       FROM breaks b
       JOIN users u ON b.user_id = u.id
       LEFT JOIN break_types bt ON b.break_type_id = bt.id
       WHERE b.end_time IS NULL
       ORDER BY b.start_time DESC`
    );

    // Günlük istatistikler
    const todayStart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const todayEnd = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');

    const dailyStatsResult = await query(
      `SELECT 
        COUNT(DISTINCT b.user_id) as active_users,
        COUNT(b.id) as total_breaks,
        COALESCE(SUM(b.duration_minutes), 0) as total_minutes,
        AVG(b.duration_minutes) as avg_duration
       FROM breaks b
       WHERE b.start_time >= $1 AND b.start_time <= $2 AND b.end_time IS NOT NULL`,
      [todayStart, todayEnd]
    );

    // Departman bazlı istatistikler
    const departmentStatsResult = await query(
      `SELECT 
        u.department,
        COUNT(DISTINCT b.user_id) as user_count,
        COUNT(b.id) as break_count,
        COALESCE(SUM(b.duration_minutes), 0) as total_minutes
       FROM breaks b
       JOIN users u ON b.user_id = u.id
       WHERE b.start_time >= $1 AND b.start_time <= $2 AND b.end_time IS NOT NULL
       GROUP BY u.department
       ORDER BY total_minutes DESC`,
      [todayStart, todayEnd]
    );

    // Toplam kullanıcı sayısı
    const totalUsersResult = await query('SELECT COUNT(*) as total FROM users WHERE is_active = true');

    res.json({
      success: true,
      data: {
        activeBreaks: activeBreaksResult.rows,
        dailyStats: {
          totalUsers: parseInt(totalUsersResult.rows[0].total),
          activeUsers: parseInt(dailyStatsResult.rows[0].active_users),
          totalBreaks: parseInt(dailyStatsResult.rows[0].total_breaks),
          totalMinutes: parseInt(dailyStatsResult.rows[0].total_minutes),
          avgDuration: parseFloat(dailyStatsResult.rows[0].avg_duration || 0)
        },
        departmentStats: departmentStatsResult.rows
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Detaylı raporlar
router.get('/reports', authenticateToken, requireAdmin, validateDateRange, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      department, 
      userId, 
      breakTypeId,
      page = 1, 
      limit = 50 
    } = req.query;

    let whereClause = 'WHERE b.end_time IS NOT NULL';
    let queryParams = [];
    let paramIndex = 1;

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

    if (department) {
      whereClause += ` AND u.department = $${paramIndex}`;
      queryParams.push(department);
      paramIndex++;
    }

    if (userId) {
      whereClause += ` AND b.user_id = $${paramIndex}`;
      queryParams.push(userId);
      paramIndex++;
    }

    if (breakTypeId) {
      whereClause += ` AND b.break_type_id = $${paramIndex}`;
      queryParams.push(breakTypeId);
      paramIndex++;
    }

    const offset = (page - 1) * limit;

    const reportsResult = await query(
      `SELECT 
        b.*,
        u.first_name,
        u.last_name,
        u.department,
        bt.name as break_type_name
       FROM breaks b
       JOIN users u ON b.user_id = u.id
       LEFT JOIN break_types bt ON b.break_type_id = bt.id
       ${whereClause}
       ORDER BY b.start_time DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    // Toplam sayı
    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM breaks b
       JOIN users u ON b.user_id = u.id
       ${whereClause}`,
      queryParams
    );

    const totalBreaks = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalBreaks / limit);

    // Özet istatistikler
    const summaryResult = await query(
      `SELECT 
        COUNT(DISTINCT b.user_id) as unique_users,
        COUNT(b.id) as total_breaks,
        COALESCE(SUM(b.duration_minutes), 0) as total_minutes,
        AVG(b.duration_minutes) as avg_duration,
        MIN(b.duration_minutes) as min_duration,
        MAX(b.duration_minutes) as max_duration
       FROM breaks b
       JOIN users u ON b.user_id = u.id
       ${whereClause}`,
      queryParams
    );

    res.json({
      success: true,
      data: {
        breaks: reportsResult.rows,
        summary: summaryResult.rows[0],
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
    console.error('Admin reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Excel raporu oluştur
router.get('/reports/excel', authenticateToken, requireAdmin, validateDateRange, async (req, res) => {
  try {
    const { startDate, endDate, department, userId } = req.query;

    let whereClause = 'WHERE b.end_time IS NOT NULL';
    let queryParams = [];
    let paramIndex = 1;

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

    if (department) {
      whereClause += ` AND u.department = $${paramIndex}`;
      queryParams.push(department);
      paramIndex++;
    }

    if (userId) {
      whereClause += ` AND b.user_id = $${paramIndex}`;
      queryParams.push(userId);
      paramIndex++;
    }

    const reportsResult = await query(
      `SELECT 
        b.*,
        u.first_name,
        u.last_name,
        u.department,
        bt.name as break_type_name
       FROM breaks b
       JOIN users u ON b.user_id = u.id
       LEFT JOIN break_types bt ON b.break_type_id = bt.id
       ${whereClause}
       ORDER BY b.start_time DESC`,
      queryParams
    );

    // Excel dosyası oluştur
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Mola Raporu');

    // Başlıklar
    worksheet.columns = [
      { header: 'Kullanıcı Adı', key: 'user_name', width: 20 },
      { header: 'Departman', key: 'department', width: 15 },
      { header: 'Mola Tipi', key: 'break_type', width: 15 },
      { header: 'Başlangıç Zamanı', key: 'start_time', width: 20 },
      { header: 'Bitiş Zamanı', key: 'end_time', width: 20 },
      { header: 'Süre (Dakika)', key: 'duration', width: 15 },
      { header: 'Notlar', key: 'notes', width: 30 }
    ];

    // Verileri ekle
    reportsResult.rows.forEach(breakRecord => {
      worksheet.addRow({
        user_name: `${breakRecord.first_name} ${breakRecord.last_name}`,
        department: breakRecord.department,
        break_type: breakRecord.break_type_name || 'Belirtilmemiş',
        start_time: moment(breakRecord.start_time).format('DD.MM.YYYY HH:mm'),
        end_time: moment(breakRecord.end_time).format('DD.MM.YYYY HH:mm'),
        duration: breakRecord.duration_minutes,
        notes: breakRecord.notes || ''
      });
    });

    // Stil uygula
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    // Response ayarla
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="mola_raporu.xlsx"');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Excel report error:', error);
    res.status(500).json({
      success: false,
      message: 'Excel raporu oluşturulurken hata oluştu'
    });
  }
});

// PDF raporu oluştur
router.get('/reports/pdf', authenticateToken, requireAdmin, validateDateRange, async (req, res) => {
  try {
    const { startDate, endDate, department, userId } = req.query;

    let whereClause = 'WHERE b.end_time IS NOT NULL';
    let queryParams = [];
    let paramIndex = 1;

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

    if (department) {
      whereClause += ` AND u.department = $${paramIndex}`;
      queryParams.push(department);
      paramIndex++;
    }

    if (userId) {
      whereClause += ` AND b.user_id = $${paramIndex}`;
      queryParams.push(userId);
      paramIndex++;
    }

    const reportsResult = await query(
      `SELECT 
        b.*,
        u.first_name,
        u.last_name,
        u.department,
        bt.name as break_type_name
       FROM breaks b
       JOIN users u ON b.user_id = u.id
       LEFT JOIN break_types bt ON b.break_type_id = bt.id
       ${whereClause}
       ORDER BY b.start_time DESC`,
      queryParams
    );

    // HTML template oluştur
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Mola Raporu</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .summary { margin-bottom: 20px; }
          .summary-item { display: inline-block; margin-right: 20px; }
        </style>
      </head>
      <body>
        <h1>Mola Raporu</h1>
        <div class="summary">
          <div class="summary-item"><strong>Toplam Mola:</strong> ${reportsResult.rows.length}</div>
          <div class="summary-item"><strong>Toplam Süre:</strong> ${reportsResult.rows.reduce((sum, row) => sum + row.duration_minutes, 0)} dakika</div>
          <div class="summary-item"><strong>Tarih Aralığı:</strong> ${startDate ? moment(startDate).format('DD.MM.YYYY') : 'Başlangıç'} - ${endDate ? moment(endDate).format('DD.MM.YYYY') : 'Son'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>Departman</th>
              <th>Mola Tipi</th>
              <th>Başlangıç</th>
              <th>Bitiş</th>
              <th>Süre (dk)</th>
              <th>Notlar</th>
            </tr>
          </thead>
          <tbody>
            ${reportsResult.rows.map(row => `
              <tr>
                <td>${row.first_name} ${row.last_name}</td>
                <td>${row.department}</td>
                <td>${row.break_type_name || 'Belirtilmemiş'}</td>
                <td>${moment(row.start_time).format('DD.MM.YYYY HH:mm')}</td>
                <td>${moment(row.end_time).format('DD.MM.YYYY HH:mm')}</td>
                <td>${row.duration_minutes}</td>
                <td>${row.notes || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // PDF oluştur
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf({ 
      format: 'A4',
      printBackground: true 
    });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="mola_raporu.pdf"');
    res.send(pdf);

  } catch (error) {
    console.error('PDF report error:', error);
    res.status(500).json({
      success: false,
      message: 'PDF raporu oluşturulurken hata oluştu'
    });
  }
});

// Grafik verileri
router.get('/charts/data', authenticateToken, requireAdmin, validateDateRange, async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    let whereClause = 'WHERE b.end_time IS NOT NULL';
    let queryParams = [];
    let paramIndex = 1;

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

    if (department) {
      whereClause += ` AND u.department = $${paramIndex}`;
      queryParams.push(department);
      paramIndex++;
    }

    // Günlük mola dağılımı
    const dailyBreakdownResult = await query(
      `SELECT 
        DATE(b.start_time) as date,
        COUNT(*) as break_count,
        COALESCE(SUM(b.duration_minutes), 0) as total_minutes
       FROM breaks b
       JOIN users u ON b.user_id = u.id
       ${whereClause}
       GROUP BY DATE(b.start_time)
       ORDER BY DATE(b.start_time)`,
      queryParams
    );

    // Saatlik dağılım
    const hourlyBreakdownResult = await query(
      `SELECT 
        EXTRACT(hour FROM b.start_time) as hour,
        COUNT(*) as break_count,
        COALESCE(SUM(b.duration_minutes), 0) as total_minutes
       FROM breaks b
       JOIN users u ON b.user_id = u.id
       ${whereClause}
       GROUP BY EXTRACT(hour FROM b.start_time)
       ORDER BY hour`,
      queryParams
    );

    // Mola tipi dağılımı
    const breakTypeBreakdownResult = await query(
      `SELECT 
        COALESCE(bt.name, 'Belirtilmemiş') as break_type,
        COUNT(*) as break_count,
        COALESCE(SUM(b.duration_minutes), 0) as total_minutes
       FROM breaks b
       JOIN users u ON b.user_id = u.id
       LEFT JOIN break_types bt ON b.break_type_id = bt.id
       ${whereClause}
       GROUP BY bt.name
       ORDER BY break_count DESC`,
      queryParams
    );

    res.json({
      success: true,
      data: {
        dailyBreakdown: dailyBreakdownResult.rows,
        hourlyBreakdown: hourlyBreakdownResult.rows,
        breakTypeBreakdown: breakTypeBreakdownResult.rows
      }
    });

  } catch (error) {
    console.error('Charts data error:', error);
    res.status(500).json({
      success: false,
      message: 'Grafik verileri alınırken hata oluştu'
    });
  }
});

module.exports = router;

