import React from 'react';

interface DailyStats {
  totalUsers: number;
  activeUsers: number;
  totalBreaks: number;
  totalMinutes: number;
  avgDuration: number;
}

interface DailyOverviewProps {
  dailyStats: DailyStats;
}

const DailyOverview: React.FC<DailyOverviewProps> = ({ dailyStats }) => {
  const stats = [
    {
      name: 'Toplam Kullanıcı',
      value: dailyStats.totalUsers,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-100'
    },
    {
      name: 'Aktif Kullanıcı',
      value: dailyStats.activeUsers,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-green-600 bg-green-100'
    },
    {
      name: 'Toplam Mola',
      value: dailyStats.totalBreaks,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-purple-600 bg-purple-100'
    },
    {
      name: 'Toplam Süre',
      value: `${dailyStats.totalMinutes}dk`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-orange-600 bg-orange-100'
    },
    {
      name: 'Ortalama Süre',
      value: `${Math.round(dailyStats.avgDuration)}dk`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-indigo-600 bg-indigo-100'
    }
  ];

  const activePercentage = dailyStats.totalUsers > 0 
    ? Math.round((dailyStats.activeUsers / dailyStats.totalUsers) * 100)
    : 0;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Günlük Genel Bakış</h2>
        <p className="text-sm text-gray-500">
          Bugünkü mola aktivitelerinin özeti
        </p>
      </div>

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${stat.color} mb-3`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">
                {stat.name}
              </div>
            </div>
          ))}
        </div>

        {/* Activity Overview */}
        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Users Progress */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Aktif Kullanıcı Oranı
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Aktif Kullanıcılar</span>
                  <span className="font-medium">{dailyStats.activeUsers} / {dailyStats.totalUsers}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${activePercentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {activePercentage}% kullanıcı bugün mola almış
                </div>
              </div>
            </div>

            {/* Break Efficiency */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Mola Verimliliği
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Toplam Mola</span>
                  <span className="font-medium">{dailyStats.totalBreaks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Ortalama Süre</span>
                  <span className="font-medium">{Math.round(dailyStats.avgDuration)} dakika</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Toplam Süre</span>
                  <span className="font-medium">
                    {Math.floor(dailyStats.totalMinutes / 60)}s {dailyStats.totalMinutes % 60}dk
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{dailyStats.totalUsers}</span> kullanıcıdan{' '}
                <span className="font-medium">{dailyStats.activeUsers}</span> tanesi bugün toplam{' '}
                <span className="font-medium">{dailyStats.totalBreaks}</span> mola almış ve{' '}
                <span className="font-medium">{Math.floor(dailyStats.totalMinutes / 60)} saat {dailyStats.totalMinutes % 60} dakika</span> mola süresi geçirmiştir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyOverview;

