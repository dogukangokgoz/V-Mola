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
    
    if (!decoded) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Geçersiz token'
        })
      };
    }

    const userId = decoded.userId;
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    switch (method) {
      case 'GET':
        // Kullanıcının molalarını getir
        const { data: breaks, error: breaksError } = await supabase
          .from('breaks')
          .select(`
            *,
            break_types(name, description)
          `)
          .eq('user_id', userId)
          .order('start_time', { ascending: false })
          .limit(50);

        if (breaksError) throw breaksError;

        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            data: breaks
          })
        };

      case 'POST':
        // Yeni mola başlat
        const { start_time, break_type_id, notes } = body;
        
        if (!start_time) {
          return {
            statusCode: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Başlangıç zamanı gerekli'
            })
          };
        }

        const { data: newBreak, error: insertError } = await supabase
          .from('breaks')
          .insert({
            user_id: userId,
            start_time,
            break_type_id,
            notes
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return {
          statusCode: 201,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            data: newBreak
          })
        };

      case 'PUT':
        // Mola bitir
        const { breakId, end_time } = body;
        
        if (!breakId || !end_time) {
          return {
            statusCode: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Mola ID ve bitiş zamanı gerekli'
            })
          };
        }

        // Mola süresini hesapla
        const { data: currentBreak } = await supabase
          .from('breaks')
          .select('start_time')
          .eq('id', breakId)
          .eq('user_id', userId)
          .single();

        if (!currentBreak) {
          return {
            statusCode: 404,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Mola bulunamadı'
            })
          };
        }

        const startTime = new Date(currentBreak.start_time);
        const endTime = new Date(end_time);
        const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

        const { data: updatedBreak, error: updateError } = await supabase
          .from('breaks')
          .update({
            end_time,
            duration_minutes: durationMinutes
          })
          .eq('id', breakId)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) throw updateError;

        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            data: updatedBreak
          })
        };

      default:
        return {
          statusCode: 405,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Desteklenmeyen HTTP metodu'
          })
        };
    }

  } catch (error) {
    console.error('Breaks API error:', error);
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
