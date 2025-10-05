import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { AdminDashboard as AdminDashboardType } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import ActiveBreaks from './ActiveBreaks';
import DailyOverview from './DailyOverview';
import DepartmentStats from './DepartmentStats';
import io, { Socket } from 'socket.io-client';

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'break_started' | 'break_ended';
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    loadDashboardData();
    
    // WebSocket bağlantısı kur
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Real-time bildirimleri dinle
    newSocket.on('break_started', (data) => {
      setNotifications(prev => [{
        id: `${data.breakId}-start`,
        message: data.message,
        type: 'break_started',
        timestamp: new Date()
      }, ...prev.slice(0, 4)]); // Son 5 bildirimi tut
      
      // Dashboard verilerini yenile
      loadDashboardData();
    });

    newSocket.on('break_ended', (data) => {
      setNotifications(prev => [{
        id: `${data.breakId}-end`,
        message: data.message,
        type: 'break_ended',
        timestamp: new Date()
      }, ...prev.slice(0, 4)]); // Son 5 bildirimi tut
      
      // Dashboard verilerini yenile
      loadDashboardData();
    });
    
    // Her 30 saniyede bir verileri yenile
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => {
      clearInterval(interval);
      newSocket.disconnect();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setError('');
      const response = await adminAPI.getDashboard();
      
      if (response.data.success) {
        setDashboardData(response.data.data!);
      }
    } catch (err: any) {
      setError(err.message || 'Dashboard verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Admin dashboard yükleniyor..." />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-danger-50 border border-danger-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-danger-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-danger-800">{error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={loadDashboardData}
          className="btn btn-primary"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Dashboard Verisi Bulunamadı
        </h3>
        <p className="text-gray-500">
          Henüz yeterli veri bulunmuyor.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                {new Date().toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs sm:text-sm text-gray-500">Son Güncelleme</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date().toLocaleTimeString('tr-TR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Bildirimler */}
      {notifications.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              🔔 Anlık Bildirimler
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-center p-3 rounded-lg ${
                    notification.type === 'break_started'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                    notification.type === 'break_started' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      {notification.timestamp.toLocaleTimeString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Daily Overview */}
      <DailyOverview dailyStats={dashboardData.dailyStats} />

      {/* Active Breaks */}
      <ActiveBreaks activeBreaks={dashboardData.activeBreaks} />

      {/* Department Stats */}
      <DepartmentStats departmentStats={dashboardData.departmentStats} />
    </div>
  );
};

export default Dashboard;

