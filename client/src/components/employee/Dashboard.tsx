import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { breakAPI } from '../../services/api';
import { BreakStatus, Break, BreakType } from '../../types';
import BreakTimer from './BreakTimer';
import BreakHistory from './BreakHistory';
import DailyStats from './DailyStats';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [breakStatus, setBreakStatus] = useState<BreakStatus | null>(null);
  const [breakTypes, setBreakTypes] = useState<BreakType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const [statusResponse, typesResponse] = await Promise.all([
        breakAPI.getStatus(user.id),
        breakAPI.getTypes()
      ]);

      if (statusResponse.data.success) {
        setBreakStatus(statusResponse.data.data!);
      }

      if (typesResponse.data.success) {
        setBreakTypes(typesResponse.data.data!.breakTypes);
      }
    } catch (err: any) {
      setError(err.message || 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakStart = async (breakTypeId?: number) => {
    if (!user) return;

    try {
      const response = await breakAPI.startBreak({ breakTypeId });
      
      if (response.data.success) {
        // Mola durumunu yeniden yükle
        await loadData();
      }
    } catch (err: any) {
      setError(err.message || 'Mola başlatılırken hata oluştu');
    }
  };

  const handleBreakEnd = async (breakId: number, notes?: string) => {
    try {
      const response = await breakAPI.endBreak(breakId, { notes });
      
      if (response.data.success) {
        // Mola durumunu yeniden yükle
        await loadData();
      }
    } catch (err: any) {
      setError(err.message || 'Mola bitirilirken hata oluştu');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Dashboard yükleniyor..." />;
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
          onClick={loadData}
          className="btn btn-primary"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Hoş Geldiniz, {user?.firstName} {user?.lastName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            {user?.department && `${user.department} • `}
            {new Date().toLocaleDateString('tr-TR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Break Timer - ÜSTTE */}
      <BreakTimer
        activeBreak={breakStatus?.activeBreak || null}
        breakTypes={breakTypes}
        onStartBreak={handleBreakStart}
        onEndBreak={handleBreakEnd}
        dailyStats={breakStatus?.dailyStats}
      />

      {/* Daily Stats */}
      {breakStatus && (
        <DailyStats dailyStats={breakStatus.dailyStats} />
      )}

      {/* Break History */}
      <BreakHistory userId={user!.id} />
    </div>
  );
};

export default Dashboard;

