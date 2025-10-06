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
    const userRole = decoded.role;
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    switch (method) {
      case 'GET':
        // Kullanıcı profilini getir
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, department, role, created_at')
          .eq('id', userId)
          .single();

        if (userError) throw userError;

        // Admin ise tüm kullanıcıları da getir
        if (userRole === 'admin') {
          const { data: allUsers, error: allUsersError } = await supabase
            .from('users')
            .select('id, first_name, last_name, email, department, role, is_active, created_at')
            .order('created_at', { ascending: false });

          if (allUsersError) throw allUsersError;

          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: true,
              data: {
                currentUser: user,
                allUsers: allUsers
              }
            })
          };
        }

        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            data: user
          })
        };

      case 'PUT':
        // Kullanıcı bilgilerini güncelle
        const { first_name, last_name, department } = body;
        
        const updateData = {};
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (department) updateData.department = department;

        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .select('id, first_name, last_name, email, department, role')
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
            data: updatedUser
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
    console.error('Users API error:', error);
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
