import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '../types';
import { authAPI } from '../services/api';
import socketService from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sayfa yüklendiğinde token kontrolü
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Socket bağlantısını kur
      socketService.connect(storedToken, JSON.parse(storedUser).id);
      
      // Kullanıcı bilgilerini doğrula
      authAPI.getMe()
        .then(response => {
          if (response.data.success) {
            setUser(response.data.data!.user);
            localStorage.setItem('user', JSON.stringify(response.data.data!.user));
          } else {
            // Token geçersiz, çıkış yap
            logout();
          }
        })
        .catch(() => {
          // API hatası, çıkış yap
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      const response = await authAPI.login(data);
      
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data!;
        
        setToken(newToken);
        setUser(userData);
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Socket bağlantısını kur
        socketService.connect(newToken, userData.id);
      } else {
        throw new Error(response.data.message || 'Giriş başarısız');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Giriş başarısız');
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await authAPI.register(data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Kayıt başarısız');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Kayıt başarısız');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Socket bağlantısını kes
    socketService.disconnect();
    
    // Logout API çağrısı (opsiyonel)
    if (token) {
      authAPI.logout().catch(() => {
        // Hata olsa da devam et
      });
    }
  };

  const isAuthenticated = !!user && !!token;

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth hook AuthProvider içinde kullanılmalıdır');
  }
  return context;
};

