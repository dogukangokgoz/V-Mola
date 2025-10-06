import React, { useState, useEffect } from 'react';
import { Break, BreakType, DailyStats } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';

interface BreakTimerProps {
  activeBreak: Break | null;
  breakTypes: BreakType[];
  onStartBreak: (breakTypeId?: number) => void;
  onEndBreak: (breakId: number, notes?: string) => void;
  dailyStats: DailyStats | undefined;
}

const BreakTimer: React.FC<BreakTimerProps> = ({
  activeBreak,
  breakTypes,
  onStartBreak,
  onEndBreak,
  dailyStats
}) => {
  const [selectedBreakType, setSelectedBreakType] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Aktif mola için gerçek zamanlı sayaç
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeBreak) {
      const startTime = new Date(activeBreak.startTime).getTime();
      
      interval = setInterval(() => {
        const now = new Date().getTime();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeBreak]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const canStartBreak = () => {
    return !activeBreak && dailyStats && (dailyStats.remainingMinutes || 0) > 0;
  };

  const handleStartBreak = () => {
    if (canStartBreak()) {
      onStartBreak(selectedBreakType);
      setSelectedBreakType(undefined);
    }
  };

  const handleEndBreak = () => {
    if (activeBreak) {
      onEndBreak(activeBreak.id, notes.trim() || undefined);
      setNotes('');
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary-50 to-blue-50 shadow-lg rounded-xl border border-primary-200">
      <div className="px-4 sm:px-6 py-4 border-b border-primary-200">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <span className="text-2xl mr-2">☕</span>
          Mola Yönetimi
        </h2>
      </div>

      <div className="p-4 sm:p-6">
        {activeBreak ? (
          /* Aktif Mola */
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-mono font-bold text-primary-600 mb-2">
                {formatTime(elapsedTime)}
              </div>
              <p className="text-base sm:text-lg text-gray-700 font-medium">
                {breakTypes.find(bt => bt.id === activeBreak.breakTypeId)?.name || 'Mola'} devam ediyor
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Başlangıç: {new Date(activeBreak.startTime).toLocaleTimeString('tr-TR')}
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mola hakkında notlarınızı yazın..."
                rows={3}
              />

              <Button
                onClick={handleEndBreak}
                variant="danger"
                size="lg"
                className="w-full text-lg sm:text-xl py-4 sm:py-5 font-bold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                ⏹️ Molayı Bitir
              </Button>
            </div>
          </div>
        ) : (
          /* Mola Başlat */
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">☕</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Mola Zamanı!
              </h3>
              <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                {dailyStats ? (
                  <>
                    Bugün <span className="font-semibold text-primary-600">{dailyStats.totalMinutes}</span> dakika mola aldınız.{' '}
                    <br />
                    <span className="font-bold text-primary-600 text-lg">
                      {dailyStats.remainingMinutes} dakika hakkınız kaldı.
                    </span>
                  </>
                ) : (
                  'Mola bilgileri yükleniyor...'
                )}
              </p>
            </div>

            {breakTypes.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Mola Tipi Seçin (Opsiyonel)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {breakTypes.map((breakType) => (
                    <button
                      key={breakType.id}
                      onClick={() => setSelectedBreakType(breakType.id)}
                      className={`p-3 text-left border rounded-lg transition-colors duration-200 ${
                        selectedBreakType === breakType.id
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      <div className="font-medium">{breakType.name}</div>
                      {breakType.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {breakType.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleStartBreak}
              variant="success"
              size="lg"
              className="w-full text-lg sm:text-xl py-4 sm:py-5 font-bold shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={!canStartBreak()}
            >
              {dailyStats?.remainingMinutes === 0 
                ? 'Günlük Mola Limitiniz Doldu' 
                : '🚀 Mola Başlat'
              }
            </Button>

            {dailyStats?.remainingMinutes === 0 && (
              <div className="bg-warning-50 border border-warning-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-warning-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-warning-800">
                      Günlük mola limitinize ulaştınız. Yarın yeni molalar alabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakTimer;

