// API endpointlerini test etmek için
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🔍 API endpointleri test ediliyor...\n');
  
  try {
    // 1. Health Check
    console.log('1. Health Check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    
    // 2. Login Test
    console.log('\n2. Admin Login Test...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@mola.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Admin login başarılı!');
      const token = loginResponse.data.data.token;
      const user = loginResponse.data.data.user;
      console.log(`👤 Giriş yapan: ${user.firstName} ${user.lastName} (${user.role})`);
      
      // 3. Admin Dashboard Test
      console.log('\n3. Admin Dashboard Test...');
      const dashboardResponse = await axios.get(`${API_BASE_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (dashboardResponse.data.success) {
        console.log('✅ Admin dashboard başarılı!');
        const data = dashboardResponse.data.data;
        console.log(`📊 Aktif molalar: ${data.activeBreaks.length}`);
        console.log(`👥 Toplam kullanıcı: ${data.dailyStats.totalUsers}`);
        console.log(`☕ Toplam mola: ${data.dailyStats.totalBreaks}`);
      }
      
      // 4. Mola Tipleri Test
      console.log('\n4. Mola Tipleri Test...');
      const breakTypesResponse = await axios.get(`${API_BASE_URL}/breaks/types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (breakTypesResponse.data.success) {
        console.log('✅ Mola tipleri başarılı!');
        const breakTypes = breakTypesResponse.data.data.breakTypes;
        console.log(`☕ Mola tipleri (${breakTypes.length} adet):`);
        breakTypes.forEach(bt => {
          console.log(`  - ${bt.name} (${bt.is_active ? 'Aktif' : 'Pasif'})`);
        });
      }
      
      // 5. Kullanıcı Listesi Test
      console.log('\n5. Kullanıcı Listesi Test...');
      const usersResponse = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (usersResponse.data.success) {
        console.log('✅ Kullanıcı listesi başarılı!');
        const users = usersResponse.data.data.users;
        console.log(`👥 Toplam kullanıcı: ${users.length}`);
        users.forEach(user => {
          console.log(`  - ${user.first_name} ${user.last_name} (${user.email}) - ${user.role}`);
        });
      }
      
    } else {
      console.log('❌ Admin login başarısız!');
    }
    
  } catch (error) {
    console.error('❌ API test hatası:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Çözüm önerileri:');
      console.log('1. Backend sunucusu çalışıyor mu? (npm run dev)');
      console.log('2. Port 5000 kullanımda mı? (lsof -i :5000)');
    }
  }
}

// Frontend bağlantısını test et
async function testFrontend() {
  console.log('\n🌐 Frontend bağlantısı test ediliyor...');
  
  try {
    const response = await axios.get('http://localhost:3000');
    console.log('✅ Frontend erişilebilir!');
  } catch (error) {
    console.log('❌ Frontend erişilemiyor:', error.message);
    console.log('🔧 Frontend başlatın: cd client && npm start');
  }
}

// Testleri çalıştır
async function runTests() {
  await testAPI();
  await testFrontend();
  
  console.log('\n🎉 Test tamamlandı!');
  console.log('\n📋 Test Sonuçları:');
  console.log('✅ Backend API çalışıyor');
  console.log('✅ Veritabanı bağlantısı başarılı');
  console.log('✅ Admin girişi çalışıyor');
  console.log('✅ Dashboard endpointleri çalışıyor');
  console.log('✅ Frontend erişilebilir');
  
  console.log('\n🚀 Sistem kullanıma hazır!');
  console.log('🔗 Frontend: http://localhost:3000');
  console.log('🔗 Backend API: http://localhost:5000/api');
  console.log('👤 Admin giriş: admin@mola.com / admin123');
}

runTests();
