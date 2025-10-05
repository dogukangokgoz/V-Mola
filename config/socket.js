const socketIo = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Yeni kullanıcı bağlandı:', socket.id);

    // Kullanıcı odaya katılma
    socket.on('join_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`👤 Kullanıcı ${userId} odaya katıldı`);
    });

    // Departman odasına katılma (admin için)
    socket.on('join_department', (departmentId) => {
      socket.join(`department_${departmentId}`);
      console.log(`🏢 Departman ${departmentId} odasına katıldı`);
    });

    // Mola başlatma bildirimi
    socket.on('break_started', (data) => {
      socket.broadcast.to('admin_room').emit('break_started', data);
      socket.broadcast.to(`department_${data.departmentId}`).emit('break_started', data);
    });

    // Mola bitirme bildirimi
    socket.on('break_ended', (data) => {
      socket.broadcast.to('admin_room').emit('break_ended', data);
      socket.broadcast.to(`department_${data.departmentId}`).emit('break_ended', data);
    });

    // Bağlantı kesilme
    socket.on('disconnect', () => {
      console.log('🔌 Kullanıcı bağlantısı kesildi:', socket.id);
    });
  });

  return io;
};

// Socket.IO instance'ını dışa aktar
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO henüz başlatılmamış');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};

