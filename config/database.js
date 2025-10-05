const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mola_takip',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Veritabanı bağlantısını test et
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL veritabanına başarıyla bağlandı');
    client.release();
  } catch (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err.message);
    process.exit(1);
  }
};

// Veritabanı sorgusu helper fonksiyonu
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper
const getClient = async () => {
  return await pool.connect();
};

module.exports = {
  connectDB,
  query,
  getClient,
  pool
};

