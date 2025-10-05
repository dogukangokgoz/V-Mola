const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://veritasmola.netlify.app",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://veritasmola.netlify.app",
  credentials: true
}));
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/build')));

// Test data (in-memory database)
let users = [
  {
    id: 1,
    email: 'admin@mola.com',
    password: '$2a$10$rQZ8K9vL8mN7pQ6rS5tT8eJ2kL3mN4pQ5rS6tT7uV8wX9yZ0aB1cD2eF3gH4iJ5kL',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    department: 'İnsan Kaynakları',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 2,
    email: 'employee@mola.com',
    password: '$2a$10$rQZ8K9vL8mN7pQ6rS5tT8eJ2kL3mN4pQ5rS6tT7uV8wX9yZ0aB1cD2eF3gH4iJ5kL',
    firstName: 'Çalışan',
    lastName: 'User',
    role: 'employee',
    department: 'Bilgi İşlem',
    isActive: true,
    createdAt: new Date()
  }
];

let breaks = [];
let breakTypes = [
  { id: 1, name: 'Kahve Molası', description: 'Kısa kahve molası' },
  { id: 2, name: 'Öğle Yemeği', description: 'Öğle yemeği molası' },
  { id: 3, name: 'Kişisel Mola', description: 'Kişisel işler için mola' }
];

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

let systemSettings = {
  dailyMaxMinutes: 60,
  morningBreakMinutes: 30,
  afternoonBreakMinutes: 30,
  minBreakInterval: 30,
  autoEndForgottenBreaks: true,
  workingHours: {
    start: '09:00',
    end: '18:00'
  }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token gerekli' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
};

// API Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email && u.isActive);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Geçersiz email veya şifre' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Geçersiz email veya şifre' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
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
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department
    }
  });
});

// Get break status
app.get('/api/breaks/status', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const userBreaks = breaks.filter(b => b.userId === req.user.id && b.date === today);
  
  const activeBreak = userBreaks.find(b => !b.endTime);
  const totalMinutes = userBreaks.reduce((sum, b) => sum + (b.duration || 0), 0);
  const remainingMinutes = Math.max(0, systemSettings.dailyMaxMinutes - totalMinutes);

  res.json({
    success: true,
    data: {
      activeBreak,
      dailyStats: {
        totalBreaks: userBreaks.length,
        totalMinutes,
        remainingMinutes
      }
    }
  });
});

// Start break
app.post('/api/breaks/start', authenticateToken, (req, res) => {
  const { breakTypeId, notes } = req.body;
  const today = new Date().toISOString().split('T')[0];
  
  // Check if user already has an active break
  const existingBreak = breaks.find(b => b.userId === req.user.id && !b.endTime);
  if (existingBreak) {
    return res.status(400).json({ success: false, message: 'Zaten aktif bir molanız var' });
  }

  const newBreak = {
    id: breaks.length + 1,
    userId: req.user.id,
    breakTypeId: breakTypeId || null,
    startTime: new Date(),
    date: today,
    notes: notes || '',
    createdAt: new Date()
  };

  breaks.push(newBreak);

  // Emit real-time notification
  io.emit('breakStarted', {
    userId: req.user.id,
    userName: users.find(u => u.id === req.user.id)?.firstName || 'Kullanıcı',
    breakType: breakTypes.find(bt => bt.id === breakTypeId)?.name || 'Mola'
  });

  res.json({
    success: true,
    data: newBreak
  });
});

// End break
app.post('/api/breaks/end', authenticateToken, (req, res) => {
  const { notes } = req.body;
  const activeBreak = breaks.find(b => b.userId === req.user.id && !b.endTime);
  
  if (!activeBreak) {
    return res.status(400).json({ success: false, message: 'Aktif molanız bulunamadı' });
  }

  const endTime = new Date();
  const duration = Math.round((endTime - new Date(activeBreak.startTime)) / 60000); // minutes

  activeBreak.endTime = endTime;
  activeBreak.duration = duration;
  activeBreak.notes = notes || activeBreak.notes;

  // Emit real-time notification
  io.emit('breakEnded', {
    userId: req.user.id,
    userName: users.find(u => u.id === req.user.id)?.firstName || 'Kullanıcı',
    duration: duration
  });

  res.json({
    success: true,
    data: activeBreak
  });
});

// Get break history
app.get('/api/breaks/history', authenticateToken, (req, res) => {
  const userBreaks = breaks
    .filter(b => b.userId === req.user.id)
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  res.json({
    success: true,
    data: userBreaks
  });
});

// Get break types
app.get('/api/breaks/types', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: breakTypes
  });
});

// Get departments
app.get('/api/departments', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: departments.map(dept => ({
      ...dept,
      userCount: users.filter(user => user.department === dept.name).length
    }))
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Yeni WebSocket bağlantısı:', socket.id);

  socket.on('register', (data) => {
    if (data.userId) {
      socket.join(`user-${data.userId}`);
      console.log(`👤 Kullanıcı ${data.userId} socket'e kaydedildi`);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 WebSocket bağlantısı kesildi:', socket.id);
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`🚀 Production sunucu ${PORT} portunda çalışıyor`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "https://veritasmola.netlify.app"}`);
  console.log(`👤 Admin: admin@mola.com / admin123`);
  console.log(`👤 Çalışan: employee@mola.com / employee123`);
});