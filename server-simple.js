const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Basit in-memory veritabanı (test için)
// Test için basit şifreler kullanıyoruz (production'da hash kullanın)
// Departmanlar
let departments = [
  { id: 1, name: 'İnsan Kaynakları', description: 'İnsan kaynakları ve personel yönetimi', createdAt: new Date() },
  { id: 2, name: 'Bilgi İşlem', description: 'IT ve teknoloji departmanı', createdAt: new Date() },
  { id: 3, name: 'Satış', description: 'Satış ve müşteri ilişkileri', createdAt: new Date() },
  { id: 4, name: 'Pazarlama', description: 'Pazarlama ve reklam departmanı', createdAt: new Date() },
  { id: 5, name: 'Muhasebe', description: 'Mali işler ve muhasebe', createdAt: new Date() },
  { id: 6, name: 'Üretim', description: 'Üretim ve operasyon', createdAt: new Date() },
  { id: 7, name: 'Kalite', description: 'Kalite kontrol ve güvence', createdAt: new Date() },
  { id: 8, name: 'AR-GE', description: 'Araştırma ve geliştirme', createdAt: new Date() }
];

let users = [
  {
    id: 1,
    email: 'admin@mola.com',
    password: 'admin123', // Test için plain text
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    department: 'İnsan Kaynakları'
  },
  {
    id: 2,
    email: 'employee@mola.com',
    password: 'employee123', // Test için plain text
    firstName: 'Çalışan',
    lastName: 'User',
    role: 'employee',
    department: 'Bilgi İşlem'
  },
  {
    id: 3,
    email: 'ahmet@mola.com',
    password: 'ahmet123',
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    role: 'employee',
    department: 'Satış'
  },
  {
    id: 4,
    email: 'ayse@mola.com',
    password: 'ayse123',
    firstName: 'Ayşe',
    lastName: 'Demir',
    role: 'employee',
    department: 'Pazarlama'
  },
  {
    id: 5,
    email: 'mehmet@mola.com',
    password: 'mehmet123',
    firstName: 'Mehmet',
    lastName: 'Kaya',
    role: 'employee',
    department: 'Muhasebe'
  }
];

let breaks = [];
let breakTypes = [
  { id: 1, name: 'Yemek Molası', description: 'Öğle yemeği için mola' },
  { id: 2, name: 'Kahve Molası', description: 'Kısa kahve/çay molası' },
  { id: 3, name: 'Kişisel Mola', description: 'Kişisel ihtiyaçlar için mola' },
  { id: 4, name: 'Sigara Molası', description: 'Sigara molası' }
];

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = 'test_secret_key_change_in_production';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token bulunamadı' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email, password });
    
    const user = users.find(u => u.email === email);
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ success: false, message: 'Geçersiz email veya şifre' });
    }

    // Test için basit şifre karşılaştırması
    const validPassword = password === user.password;
    if (!validPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ success: false, message: 'Geçersiz email veya şifre' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for:', email);

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department
      }
    }
  });
});

// Break routes
app.get('/api/breaks/status/:userId', authenticateToken, (req, res) => {
  const userId = parseInt(req.params.userId);
  
  const activeBreak = breaks.find(b => b.userId === userId && !b.endTime);
  const todayBreaks = breaks.filter(b => {
    const today = new Date().toDateString();
    const breakDate = new Date(b.startTime).toDateString();
    return b.userId === userId && breakDate === today && b.endTime;
  });

  const totalMinutes = todayBreaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

  res.json({
    success: true,
    data: {
      activeBreak: activeBreak || null,
      dailyStats: {
        breakCount: todayBreaks.length,
        totalMinutes: totalMinutes,
        remainingMinutes: Math.max(0, 60 - totalMinutes),
        maxDailyMinutes: 60
      }
    }
  });
});

app.post('/api/breaks/start', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  const existingBreak = breaks.find(b => b.userId === userId && !b.endTime);
  if (existingBreak) {
    return res.status(400).json({ success: false, message: 'Zaten aktif bir molanız bulunuyor' });
  }

  const newBreak = {
    id: breaks.length + 1,
    userId: userId,
    breakTypeId: req.body.breakTypeId,
    startTime: new Date().toISOString(),
    endTime: null,
    durationMinutes: null,
    notes: null,
    isAutoEnded: false
  };

  breaks.push(newBreak);

  // Kullanıcı bilgilerini al
  const user = users.find(u => u.id === userId);
  
  // Tüm adminlere real-time bildirim gönder
  io.emit('break_started', {
    breakId: newBreak.id,
    userId: userId,
    userName: `${user.firstName} ${user.lastName}`,
    department: user.department,
    startTime: newBreak.startTime,
    message: `${user.firstName} ${user.lastName} molaya çıktı!`
  });

  res.json({
    success: true,
    message: 'Mola başlatıldı',
    data: { break: newBreak }
  });
});

app.post('/api/breaks/end/:breakId', authenticateToken, (req, res) => {
  const breakId = parseInt(req.params.breakId);
  const userId = req.user.userId;

  const breakRecord = breaks.find(b => b.id === breakId && b.userId === userId && !b.endTime);
  if (!breakRecord) {
    return res.status(404).json({ success: false, message: 'Aktif mola bulunamadı' });
  }

  const endTime = new Date();
  const startTime = new Date(breakRecord.startTime);
  const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

  breakRecord.endTime = endTime.toISOString();
  breakRecord.durationMinutes = durationMinutes;
  breakRecord.notes = req.body.notes;

  // Kullanıcı bilgilerini al
  const user = users.find(u => u.id === userId);
  
  // Tüm adminlere real-time bildirim gönder
  io.emit('break_ended', {
    breakId: breakRecord.id,
    userId: userId,
    userName: `${user.firstName} ${user.lastName}`,
    department: user.department,
    duration: durationMinutes,
    message: `${user.firstName} ${user.lastName} moladan döndü! (${durationMinutes} dk)`
  });

  res.json({
    success: true,
    message: 'Mola tamamlandı',
    data: { break: breakRecord }
  });
});

app.get('/api/breaks/history/:userId', authenticateToken, (req, res) => {
  const userId = parseInt(req.params.userId);
  const userBreaks = breaks
    .filter(b => b.userId === userId && b.endTime)
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  res.json({
    success: true,
    data: {
      breaks: userBreaks,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalBreaks: userBreaks.length,
        hasNext: false,
        hasPrev: false
      }
    }
  });
});

app.get('/api/breaks/types', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: { breakTypes }
  });
});

// Admin routes
app.get('/api/admin/dashboard', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin yetkisi gereklidir' });
  }

  const activeBreaks = breaks
    .filter(b => !b.endTime)
    .map(b => {
      const user = users.find(u => u.id === b.userId);
      const breakType = breakTypes.find(bt => bt.id === b.breakTypeId);
      return {
        ...b,
        firstName: user?.firstName || 'Bilinmeyen',
        lastName: user?.lastName || 'Kullanıcı',
        department: user?.department || 'Belirtilmemiş',
        breakTypeName: breakType?.name || 'Belirtilmemiş'
      };
    });

  const todayBreaks = breaks.filter(b => {
    const today = new Date().toDateString();
    const breakDate = new Date(b.startTime).toDateString();
    return breakDate === today && b.endTime;
  });

  const totalMinutes = todayBreaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

  res.json({
    success: true,
    data: {
      activeBreaks,
      dailyStats: {
        totalUsers: users.length,
        activeUsers: [...new Set(todayBreaks.map(b => b.userId))].length,
        totalBreaks: todayBreaks.length,
        totalMinutes: totalMinutes,
        avgDuration: todayBreaks.length > 0 ? totalMinutes / todayBreaks.length : 0
      },
      departmentStats: []
    }
  });
});

// User routes
app.get('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin yetkisi gereklidir' });
  }

  const userList = users.map(u => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    department: u.department,
    isActive: true,
    createdAt: new Date().toISOString()
  }));

  res.json({
    success: true,
    data: {
      users: userList,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: userList.length,
        hasNext: false,
        hasPrev: false
      }
    }
  });
});

// Yeni kullanıcı oluştur
app.post('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin yetkisi gereklidir' });
  }

  const { firstName, lastName, email, password, department, role = 'employee' } = req.body;

  // Email kontrolü
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Bu email adresi zaten kullanılıyor' });
  }

  // Yeni kullanıcı oluştur
  const newUser = {
    id: users.length + 1,
    firstName,
    lastName,
    email,
    password, // Test için plain text
    department,
    role
  };

  users.push(newUser);

  res.status(201).json({
    success: true,
    message: 'Kullanıcı başarıyla oluşturuldu',
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        department: newUser.department,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    }
  });
});

// Kullanıcı güncelle
app.put('/api/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin yetkisi gereklidir' });
  }

  const userId = parseInt(req.params.id);
  const { firstName, lastName, email, department, role, isActive } = req.body;

  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
  }

  // Email kontrolü (kendisi hariç)
  const existingUser = users.find(u => u.email === email && u.id !== userId);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Bu email adresi zaten kullanılıyor' });
  }

  // Kullanıcıyı güncelle
  users[userIndex] = {
    ...users[userIndex],
    firstName,
    lastName,
    email,
    department,
    role,
    isActive: isActive !== undefined ? isActive : true
  };

  res.json({
    success: true,
    message: 'Kullanıcı başarıyla güncellendi',
    data: {
      user: {
        id: users[userIndex].id,
        email: users[userIndex].email,
        firstName: users[userIndex].firstName,
        lastName: users[userIndex].lastName,
        role: users[userIndex].role,
        department: users[userIndex].department,
        isActive: users[userIndex].isActive,
        createdAt: users[userIndex].createdAt || new Date().toISOString()
      }
    }
  });
});

// Kullanıcı sil
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin yetkisi gereklidir' });
  }

  const userId = parseInt(req.params.id);
  
  // Admin kendini silemez
  if (userId === req.user.id) {
    return res.status(400).json({ success: false, message: 'Kendi hesabınızı silemezsiniz' });
  }

  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
  }

  // Kullanıcıyı sil
  users.splice(userIndex, 1);

  res.json({
    success: true,
    message: 'Kullanıcı başarıyla silindi'
  });
});

// Şifre değiştirme (kendi şifresi)
app.put('/api/users/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Mevcut şifre ve yeni şifre gereklidir' });
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
  }

  // Mevcut şifreyi kontrol et (test için plain text)
  if (user.password !== currentPassword) {
    return res.status(400).json({ success: false, message: 'Mevcut şifre yanlış' });
  }

  // Yeni şifre validasyonu
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Yeni şifre en az 6 karakter olmalıdır' });
  }

  // Şifreyi güncelle (test için plain text, production'da hash kullanın)
  user.password = newPassword;

  res.json({
    success: true,
    message: 'Şifre başarıyla değiştirildi'
  });
});

// Admin tarafından kullanıcı şifresi değiştirme
app.put('/api/users/:id/change-password', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin yetkisi gereklidir' });
  }

  const userId = parseInt(req.params.id);
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ success: false, message: 'Yeni şifre gereklidir' });
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
  }

  // Yeni şifre validasyonu
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Yeni şifre en az 6 karakter olmalıdır' });
  }

  // Şifreyi güncelle (test için plain text, production'da hash kullanın)
  user.password = newPassword;

  res.json({
    success: true,
    message: 'Kullanıcı şifresi başarıyla değiştirildi'
  });
});

// Sistem ayarları (in-memory)
let systemSettings = {
  dailyMaxBreakMinutes: 60,
  morningBreakMinutes: 30,
  afternoonBreakMinutes: 30,
  minBreakInterval: 30,
  autoEndForgottenBreaks: true,
  forgottenBreakMinutes: 120
};

// Sistem ayarlarını getir
app.get('/api/settings', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      settings: systemSettings
    }
  });
});

// Sistem ayarlarını güncelle
app.put('/api/settings', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin yetkisi gereklidir' });
  }

  const { 
    dailyMaxBreakMinutes, 
    morningBreakMinutes, 
    afternoonBreakMinutes,
    minBreakInterval,
    autoEndForgottenBreaks,
    forgottenBreakMinutes
  } = req.body;

  systemSettings = {
    ...systemSettings,
    ...(dailyMaxBreakMinutes !== undefined && { dailyMaxBreakMinutes }),
    ...(morningBreakMinutes !== undefined && { morningBreakMinutes }),
    ...(afternoonBreakMinutes !== undefined && { afternoonBreakMinutes }),
    ...(minBreakInterval !== undefined && { minBreakInterval }),
    ...(autoEndForgottenBreaks !== undefined && { autoEndForgottenBreaks }),
    ...(forgottenBreakMinutes !== undefined && { forgottenBreakMinutes })
  };

  res.json({
    success: true,
    message: 'Ayarlar başarıyla güncellendi'
  });
});

// ========== DEPARTMAN YÖNETİMİ API'LERİ ==========

// Tüm departmanları getir
app.get('/api/departments', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: departments.map(dept => ({
      ...dept,
      userCount: users.filter(user => user.department === dept.name).length
    }))
  });
});

// Departman ekle
app.post('/api/departments', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin yetkisi gereklidir' });
  }

  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Departman adı gereklidir' });
  }

  // Aynı isimde departman var mı kontrol et
  const existingDept = departments.find(d => d.name.toLowerCase() === name.toLowerCase());
  if (existingDept) {
    return res.status(400).json({ success: false, message: 'Bu isimde bir departman zaten mevcut' });
  }

  const newDepartment = {
    id: Math.max(...departments.map(d => d.id)) + 1,
    name: name.trim(),
    description: description?.trim() || '',
    createdAt: new Date()
  };

  departments.push(newDepartment);

  res.json({
    success: true,
    message: 'Departman başarıyla eklendi',
    data: newDepartment
  });
});

// Departman güncelle
app.put('/api/departments/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin yetkisi gereklidir' });
  }

  const { id } = req.params;
  const { name, description } = req.body;

  const departmentIndex = departments.findIndex(d => d.id === parseInt(id));
  if (departmentIndex === -1) {
    return res.status(404).json({ success: false, message: 'Departman bulunamadı' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Departman adı gereklidir' });
  }

  // Aynı isimde başka departman var mı kontrol et
  const existingDept = departments.find(d => d.name.toLowerCase() === name.toLowerCase() && d.id !== parseInt(id));
  if (existingDept) {
    return res.status(400).json({ success: false, message: 'Bu isimde bir departman zaten mevcut' });
  }

  const oldName = departments[departmentIndex].name;
  
  departments[departmentIndex] = {
    ...departments[departmentIndex],
    name: name.trim(),
    description: description?.trim() || ''
  };

  // Kullanıcıların departman bilgilerini güncelle
  users.forEach(user => {
    if (user.department === oldName) {
      user.department = name.trim();
    }
  });

  res.json({
    success: true,
    message: 'Departman başarıyla güncellendi',
    data: departments[departmentIndex]
  });
});

// Departman sil
app.delete('/api/departments/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin yetkisi gereklidir' });
  }

  const { id } = req.params;
  const departmentIndex = departments.findIndex(d => d.id === parseInt(id));
  
  if (departmentIndex === -1) {
    return res.status(404).json({ success: false, message: 'Departman bulunamadı' });
  }

  const department = departments[departmentIndex];
  
  // Bu departmanda kullanıcı var mı kontrol et
  const usersInDepartment = users.filter(user => user.department === department.name);
  if (usersInDepartment.length > 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Bu departmanda ${usersInDepartment.length} kullanıcı bulunuyor. Önce kullanıcıları başka departmanlara taşıyın.` 
    });
  }

  departments.splice(departmentIndex, 1);

  res.json({
    success: true,
    message: 'Departman başarıyla silindi'
  });
});

// Raporlar API
app.get('/api/admin/reports', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin yetkisi gereklidir' });
  }

  const { startDate, endDate, department } = req.query;
  
  // Tüm kullanıcılar için rapor oluştur
  const userReports = users.map(user => {
    // Bu kullanıcının molalarını filtrele
    const userBreaks = breaks.filter(breakItem => {
      if (breakItem.userId !== user.id) return false;
      
      const breakDate = new Date(breakItem.startTime).toISOString().split('T')[0];
      
      if (startDate && breakDate < startDate) return false;
      if (endDate && breakDate > endDate) return false;
      
      return true;
    });

    // Mola istatistiklerini hesapla
    const morningBreaks = userBreaks.filter(b => {
      const hour = new Date(b.startTime).getHours();
      return hour < 12;
    });

    const afternoonBreaks = userBreaks.filter(b => {
      const hour = new Date(b.startTime).getHours();
      return hour >= 12;
    });

    const totalMorningDuration = morningBreaks.reduce((sum, b) => {
      return sum + (b.endTime ? Math.round((new Date(b.endTime) - new Date(b.startTime)) / 60000) : 0);
    }, 0);

    const totalAfternoonDuration = afternoonBreaks.reduce((sum, b) => {
      return sum + (b.endTime ? Math.round((new Date(b.endTime) - new Date(b.startTime)) / 60000) : 0);
    }, 0);

    const lastBreakDate = userBreaks.length > 0 ? 
      new Date(Math.max(...userBreaks.map(b => new Date(b.startTime)))).toISOString() : 
      null;

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: user.department,
      totalBreaks: userBreaks.length,
      morningBreaks: morningBreaks.length,
      afternoonBreaks: afternoonBreaks.length,
      totalMorningDuration,
      totalAfternoonDuration,
      averageBreakDuration: userBreaks.length > 0 ? 
        Math.round((totalMorningDuration + totalAfternoonDuration) / userBreaks.length) : 0,
      lastBreakDate
    };
  });

  // Departman filtresi uygula
  const filteredReports = department ? 
    userReports.filter(report => report.department === department) : 
    userReports;

  // Departman listesi
  const departments = [...new Set(users.map(u => u.department))];

  res.json({
    success: true,
    data: {
      reports: filteredReports,
      departments
    }
  });
});

// Excel raporu (basit CSV format)
app.get('/api/admin/reports/excel', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin yetkisi gereklidir' });
  }

  // Basit CSV formatında rapor oluştur
  const csvHeaders = 'Ad,Soyad,Email,Departman,Toplam Mola,Öğleden Önce,Öğleden Sonra,Toplam Süre,Ortalama Süre,Son Mola\n';
  
  // Bu basit bir implementasyon - gerçek Excel dosyası için xlsx kütüphanesi kullanın
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="mola-raporu.xlsx"');
  res.send(csvHeaders);
});

// PDF raporu (basit text format)
app.get('/api/admin/reports/pdf', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin yetkisi gereklidir' });
  }

  // Basit text formatında rapor oluştur
  const reportText = 'Mola Raporu\n================\n\nBu basit bir PDF implementasyonu.\nGerçek PDF için puppeteer veya jsPDF kullanın.';
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="mola-raporu.pdf"');
  res.send(reportText);
});

// Serve static files
app.use(express.static(path.join(__dirname, 'client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// WebSocket bağlantıları
io.on('connection', (socket) => {
  console.log('🔌 Yeni WebSocket bağlantısı:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 WebSocket bağlantısı kesildi:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Basit sunucu ${PORT} portunda çalışıyor`);
  console.log(`📊 Test modu - PostgreSQL gerektirmez`);
  console.log(`🔗 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`👤 Admin: admin@mola.com / admin123`);
  console.log(`👤 Çalışan: employee@mola.com / employee123`);
});
