// Veritabanı bağlantısını test etmek için
const { Pool } = require('pg');
require('dotenv').config();

async function testDatabase() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mola_takip',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🔍 Veritabanı bağlantısı test ediliyor...');
    
    const client = await pool.connect();
    console.log('✅ Veritabanına başarıyla bağlandı!');
    
    // Tabloları kontrol et
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 Mevcut tablolar:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Admin kullanıcısını kontrol et
    const adminResult = await client.query(`
      SELECT id, email, first_name, last_name, role 
      FROM users 
      WHERE role = 'admin'
    `);
    
    if (adminResult.rows.length > 0) {
      console.log('👤 Admin kullanıcısı mevcut:');
      adminResult.rows.forEach(user => {
        console.log(`  - ${user.email} (${user.first_name} ${user.last_name})`);
      });
    } else {
      console.log('⚠️  Admin kullanıcısı bulunamadı!');
    }
    
    // Mola tiplerini kontrol et
    const breakTypesResult = await client.query(`
      SELECT name, is_active 
      FROM break_types
    `);
    
    console.log('☕ Mola tipleri:');
    breakTypesResult.rows.forEach(breakType => {
      console.log(`  - ${breakType.name} (${breakType.is_active ? 'Aktif' : 'Pasif'})`);
    });
    
    client.release();
    console.log('✅ Test başarıyla tamamlandı!');
    
  } catch (error) {
    console.error('❌ Veritabanı test hatası:', error.message);
    console.log('\n🔧 Çözüm önerileri:');
    console.log('1. PostgreSQL çalışıyor mu kontrol edin: brew services list | grep postgresql');
    console.log('2. Veritabanı oluşturuldu mu: createdb mola_takip');
    console.log('3. Şema import edildi mi: psql -d mola_takip -f database/schema.sql');
    console.log('4. .env dosyası doğru mu kontrol edin');
  } finally {
    await pool.end();
  }
}

testDatabase();
