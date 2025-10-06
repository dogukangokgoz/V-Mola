const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Supabase client oluştur
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// JWT token doğrulama
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

exports.handler = async (event, context) => {
  // CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Authorization header'dan token al
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Yetkilendirme token\'ı gerekli'
        })
      };
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Admin yetkisi gerekli'
        })
      };
    }

    const method = event.httpMethod;
    const path = event.path;

    // Dashboard endpoint
    if (path.includes('/dashboard')) {
      // Toplam kullanıcı sayısı
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Aktif molalar
      const { count: activeBreaks } = await supabase
        .from('breaks')
        .select('*', { count: 'exact', head: true })
        .is('end_time', null);

      // Bugünkü molalar
      const today = new Date().toISOString().split('T')[0];
      const { count: todayBreaks } = await supabase
        .from('breaks')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', today);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          data: {
            totalUsers: totalUsers || 0,
            activeBreaks: activeBreaks || 0,
            todayBreaks: todayBreaks || 0,
            departments: [
              { name: 'İnsan Kaynakları', userCount: 1 },
              { name: 'Bilgi İşlem', userCount: 0 },
              { name: 'Muhasebe', userCount: 0 },
              { name: 'Satış', userCount: 0 },
              { name: 'Pazarlama', userCount: 0 }
            ]
          }
        })
      };
    }

    // Reports endpoint
    if (path.includes('/reports')) {
      const { startDate, endDate } = event.queryStringParameters || {};
      
      // Varsayılan tarih aralığı (son 30 gün)
      const defaultEndDate = new Date().toISOString().split('T')[0];
      const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const queryStartDate = startDate || defaultStartDate;
      const queryEndDate = endDate || defaultEndDate;

      // Rapor verileri
      const reports = {
        summary: {
          totalBreaks: 0,
          totalMinutes: 0,
          avgDuration: 0,
          mostActiveUser: null,
          mostUsedBreakType: null
        },
        dailyStats: [],
        userStats: [],
        departmentStats: []
      };

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          data: reports
        })
      };
    }

    // Diğer admin endpoint'leri için
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Endpoint bulunamadı'
      })
    };

  } catch (error) {
    console.error('Admin API error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Sunucu hatası'
      })
    };
  }
};
