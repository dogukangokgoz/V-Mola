const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateBreakSettings } = require('../middleware/validation');

const router = express.Router();

// Sistem ayarlarını getir
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settingsResult = await query(
      'SELECT setting_key, setting_value, description FROM system_settings ORDER BY setting_key'
    );

    // Ayarları obje formatına çevir
    const settings = {};
    settingsResult.rows.forEach(row => {
      settings[row.setting_key] = {
        value: row.setting_value,
        description: row.description
      };
    });

    res.json({
      success: true,
      data: {
        settings
      }
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Sistem ayarlarını güncelle (sadece admin)
router.put('/', authenticateToken, requireAdmin, validateBreakSettings, async (req, res) => {
  try {
    const { maxDailyMinutes, minBreakDuration, maxBreakDuration, autoEndAfterMinutes, timezone } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (maxDailyMinutes !== undefined) {
      updates.push(`(setting_key, setting_value) = ($${paramIndex}, $${paramIndex + 1})`);
      values.push('max_daily_break_minutes', maxDailyMinutes.toString());
      paramIndex += 2;
    }

    if (minBreakDuration !== undefined) {
      updates.push(`(setting_key, setting_value) = ($${paramIndex}, $${paramIndex + 1})`);
      values.push('min_break_duration', minBreakDuration.toString());
      paramIndex += 2;
    }

    if (maxBreakDuration !== undefined) {
      updates.push(`(setting_key, setting_value) = ($${paramIndex}, $${paramIndex + 1})`);
      values.push('max_break_duration', maxBreakDuration.toString());
      paramIndex += 2;
    }

    if (autoEndAfterMinutes !== undefined) {
      updates.push(`(setting_key, setting_value) = ($${paramIndex}, $${paramIndex + 1})`);
      values.push('auto_end_break_minutes', autoEndAfterMinutes.toString());
      paramIndex += 2;
    }

    if (timezone) {
      updates.push(`(setting_key, setting_value) = ($${paramIndex}, $${paramIndex + 1})`);
      values.push('timezone', timezone);
      paramIndex += 2;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek ayar bulunamadı'
      });
    }

    // Her ayarı ayrı ayrı güncelle
    for (let i = 0; i < updates.length; i++) {
      const settingKey = values[i * 2];
      const settingValue = values[i * 2 + 1];

      await query(
        `INSERT INTO system_settings (setting_key, setting_value) 
         VALUES ($1, $2) 
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP`,
        [settingKey, settingValue]
      );
    }

    res.json({
      success: true,
      message: 'Ayarlar başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Mola tiplerini getir
router.get('/break-types', authenticateToken, async (req, res) => {
  try {
    const breakTypesResult = await query(
      'SELECT * FROM break_types ORDER BY name'
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

// Mola tipi oluştur (sadece admin)
router.post('/break-types', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mola tipi adı gereklidir'
      });
    }

    // Aynı isimde mola tipi var mı kontrol et
    const existingType = await query(
      'SELECT id FROM break_types WHERE name = $1',
      [name.trim()]
    );

    if (existingType.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu mola tipi zaten mevcut'
      });
    }

    const newBreakType = await query(
      'INSERT INTO break_types (name, description) VALUES ($1, $2) RETURNING *',
      [name.trim(), description || '']
    );

    res.status(201).json({
      success: true,
      message: 'Mola tipi başarıyla oluşturuldu',
      data: {
        breakType: newBreakType.rows[0]
      }
    });

  } catch (error) {
    console.error('Create break type error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Mola tipi güncelle (sadece admin)
router.put('/break-types/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mola tipi adı gereklidir'
      });
    }

    // Aynı isimde başka mola tipi var mı kontrol et
    const existingType = await query(
      'SELECT id FROM break_types WHERE name = $1 AND id != $2',
      [name.trim(), id]
    );

    if (existingType.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu mola tipi zaten mevcut'
      });
    }

    const updatedBreakType = await query(
      'UPDATE break_types SET name = $1, description = $2, is_active = $3 WHERE id = $4 RETURNING *',
      [name.trim(), description || '', isActive !== undefined ? isActive : true, id]
    );

    if (updatedBreakType.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mola tipi bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Mola tipi başarıyla güncellendi',
      data: {
        breakType: updatedBreakType.rows[0]
      }
    });

  } catch (error) {
    console.error('Update break type error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Mola tipi sil (sadece admin)
router.delete('/break-types/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Bu mola tipini kullanan molalar var mı kontrol et
    const usedBreaks = await query(
      'SELECT COUNT(*) as count FROM breaks WHERE break_type_id = $1',
      [id]
    );

    if (parseInt(usedBreaks.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu mola tipini kullanan molalar bulunduğu için silinemez'
      });
    }

    const deletedBreakType = await query(
      'DELETE FROM break_types WHERE id = $1 RETURNING *',
      [id]
    );

    if (deletedBreakType.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mola tipi bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Mola tipi başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete break type error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Departmanları getir
router.get('/departments', authenticateToken, async (req, res) => {
  try {
    const departmentsResult = await query(
      'SELECT * FROM departments ORDER BY name'
    );

    res.json({
      success: true,
      data: {
        departments: departmentsResult.rows
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

// Departman oluştur (sadece admin)
router.post('/departments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Departman adı gereklidir'
      });
    }

    // Aynı isimde departman var mı kontrol et
    const existingDepartment = await query(
      'SELECT id FROM departments WHERE name = $1',
      [name.trim()]
    );

    if (existingDepartment.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu departman zaten mevcut'
      });
    }

    const newDepartment = await query(
      'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *',
      [name.trim(), description || '']
    );

    res.status(201).json({
      success: true,
      message: 'Departman başarıyla oluşturuldu',
      data: {
        department: newDepartment.rows[0]
      }
    });

  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Departman mola kurallarını getir
router.get('/break-rules', authenticateToken, async (req, res) => {
  try {
    const breakRulesResult = await query(
      `SELECT br.*, d.name as department_name 
       FROM break_rules br
       LEFT JOIN departments d ON br.department_id = d.id
       WHERE br.is_active = true
       ORDER BY d.name`
    );

    res.json({
      success: true,
      data: {
        breakRules: breakRulesResult.rows
      }
    });

  } catch (error) {
    console.error('Get break rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Departman mola kurallarını güncelle (sadece admin)
router.put('/break-rules/:id', authenticateToken, requireAdmin, validateBreakSettings, async (req, res) => {
  try {
    const { id } = req.params;
    const { maxDailyMinutes, minBreakDuration, maxBreakDuration, autoEndAfterMinutes, isActive } = req.body;

    const updatedRule = await query(
      `UPDATE break_rules 
       SET max_daily_minutes = COALESCE($1, max_daily_minutes),
           min_break_duration = COALESCE($2, min_break_duration),
           max_break_duration = COALESCE($3, max_break_duration),
           auto_end_after_minutes = COALESCE($4, auto_end_after_minutes),
           is_active = COALESCE($5, is_active)
       WHERE id = $6 
       RETURNING *`,
      [maxDailyMinutes, minBreakDuration, maxBreakDuration, autoEndAfterMinutes, isActive, id]
    );

    if (updatedRule.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mola kuralı bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Mola kuralı başarıyla güncellendi',
      data: {
        breakRule: updatedRule.rows[0]
      }
    });

  } catch (error) {
    console.error('Update break rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;

