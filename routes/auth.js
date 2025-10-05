const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { validateLogin, validateRegister } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Kullanıcı girişi
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı veritabanından bul
    const userResult = await query(
      'SELECT id, email, password_hash, first_name, last_name, role, department, is_active FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    const user = userResult.rows[0];

    // Hesap aktif mi kontrol et
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Hesabınız deaktif edilmiş. Lütfen yöneticinizle iletişime geçin.'
      });
    }

    // Şifre kontrolü
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // Token'ı veritabanına kaydet (session management için)
    await query(
      'INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [
        user.id,
        jwt.sign({ userId: user.id }, process.env.JWT_SECRET),
        new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 saat
      ]
    );

    // Başarılı giriş
    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          department: user.department
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı kaydı (sadece admin)
router.post('/register', authenticateToken, validateRegister, async (req, res) => {
  try {
    // Sadece admin kullanıcı kaydı yapabilir
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gereklidir'
      });
    }

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
      'INSERT INTO users (first_name, last_name, email, password_hash, department, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, role, department',
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
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı çıkışı
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Session'ı veritabanından sil
    await query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Çıkış başarılı'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Mevcut kullanıcı bilgilerini getir
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await query(
      'SELECT id, email, first_name, last_name, role, department, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      data: {
        user: userResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Token yenileme
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Yeni token oluştur
    const token = jwt.sign(
      { 
        userId: req.user.id, 
        email: req.user.email, 
        role: req.user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({
      success: true,
      message: 'Token başarıyla yenilendi',
      data: {
        token
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;

