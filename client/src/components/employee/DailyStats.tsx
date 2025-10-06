import React from 'react';
import { DailyStats as DailyStatsType } from '../../types';

interface DailyStatsProps {
  dailyStats: DailyStatsType;
}

const DailyStats: React.FC<DailyStatsProps> = ({ dailyStats }) => {
  const progressPercentage = ((dailyStats.totalMinutes || 0) / (dailyStats.maxDailyMinutes || 240)) * 100;

  const getProgressColor = () => {
    if (progressPercentage >= 90) return 'bg-danger-500';
    if (progressPercentage >= 70) return 'bg-warning-500';
    return 'bg-success-500';
  };

  const getRemainingColor = () => {
    const remaining = dailyStats.remainingMinutes || 0;
    if (remaining <= 5) return 'text-danger-600';
    if (remaining <= 15) return 'text-warning-600';
    return 'text-success-600';
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Günlük İstatistikler</h2>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('tr-TR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Toplam Mola Sayısı */}
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {dailyStats.breakCount}
            </div>
            <div className="text-sm text-gray-500">
              Toplam Mola
            </div>
          </div>

          {/* Kullanılan Süre */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {dailyStats.totalMinutes}
            </div>
            <div className="text-sm text-gray-500">
              Dakika Kullanıldı
            </div>
          </div>

          {/* Kalan Süre */}
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${getRemainingColor()}`}>
              {dailyStats.remainingMinutes || 0}
            </div>
            <div className="text-sm text-gray-500">
              Dakika Kaldı
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Mola Kullanımı</span>
            <span>{dailyStats.totalMinutes} / {dailyStats.maxDailyMinutes} dakika</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Durum Mesajı */}
        <div className="mt-4 p-3 rounded-lg bg-gray-50">
          {(dailyStats.remainingMinutes || 0) === 0 ? (
            <div className="flex items-center text-warning-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                Günlük mola limitinize ulaştınız.
              </span>
            </div>
          ) : (dailyStats.remainingMinutes || 0) <= 5 ? (
            <div className="flex items-center text-danger-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                Çok az mola hakkınız kaldı!
              </span>
            </div>
          ) : (dailyStats.remainingMinutes || 0) <= 15 ? (
            <div className="flex items-center text-warning-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                Mola hakkınızın çoğunu kullandınız.
              </span>
            </div>
          ) : (
            <div className="flex items-center text-success-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                Mola hakkınız yeterli seviyede.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyStats;

