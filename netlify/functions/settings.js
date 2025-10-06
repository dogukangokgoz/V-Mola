const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Varsayılan ayarları döndür
      const defaultSettings = {
        dailyMaxBreakMinutes: 240,
        morningBreakMinutes: 15,
        afternoonBreakMinutes: 15,
        breakTypes: [
          { id: 1, name: 'Kahve Molası', duration: 15 },
          { id: 2, name: 'Öğle Yemeği', duration: 60 },
          { id: 3, name: 'Kişisel Mola', duration: 10 }
        ]
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: defaultSettings
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed'
      })
    };

  } catch (error) {
    console.error('Settings error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Sunucu hatası'
      })
    };
  }
};
