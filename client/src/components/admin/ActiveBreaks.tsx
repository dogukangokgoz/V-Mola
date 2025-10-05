import React, { useState, useEffect } from 'react';
import { ActiveBreak } from '../../types';

interface ActiveBreaksProps {
  activeBreaks: ActiveBreak[];
}

const ActiveBreaks: React.FC<ActiveBreaksProps> = ({ activeBreaks: initialActiveBreaks }) => {
  const [activeBreaks, setActiveBreaks] = useState<ActiveBreak[]>(initialActiveBreaks);

  useEffect(() => {
    setActiveBreaks(initialActiveBreaks);
  }, [initialActiveBreaks]);

  // Gerçek zamanlı sayaç
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBreaks(prevBreaks => 
        prevBreaks.map(breakRecord => ({
          ...breakRecord,
          // Elapsed time hesaplama burada yapılabilir
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatElapsedTime = (startTime: string): string => {
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const elapsed = Math.floor((now - start) / 1000);

    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    if (hours > 0) {
      return `${hours}s ${minutes}dk ${seconds}sn`;
    }
    return `${minutes}dk ${seconds}sn`;
  };

  const getElapsedMinutes = (startTime: string): number => {
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / (1000 * 60));
  };

  const getBreakStatusColor = (startTime: string) => {
    const elapsedMinutes = getElapsedMinutes(startTime);
    
    if (elapsedMinutes > 120) return 'text-danger-600 bg-danger-100'; // 2 saatten fazla
    if (elapsedMinutes > 60) return 'text-warning-600 bg-warning-100'; // 1 saatten fazla
    return 'text-success-600 bg-success-100'; // Normal
  };

  const getBreakStatusText = (startTime: string) => {
    const elapsedMinutes = getElapsedMinutes(startTime);
    
    if (elapsedMinutes > 120) return 'Uzun Mola';
    if (elapsedMinutes > 60) return 'Orta Mola';
    return 'Normal Mola';
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Aktif Molalar</h2>
            <p className="text-sm text-gray-500">
              Şu anda devam eden molalar ({activeBreaks.length} kişi)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">Canlı</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {activeBreaks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">☕</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aktif Mola Yok
            </h3>
            <p className="text-gray-500">
              Şu anda kimse mola almıyor.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeBreaks.map((breakRecord) => (
              <div
                key={breakRecord.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {breakRecord.firstName.charAt(0)}{breakRecord.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {breakRecord.firstName} {breakRecord.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {breakRecord.department}
                          </div>
                        </div>
                      </div>
                      
                      <span className={`badge ${getBreakStatusColor(breakRecord.startTime)}`}>
                        {getBreakStatusText(breakRecord.startTime)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Mola Tipi:</span>
                        <div className="font-medium">
                          {breakRecord.breakTypeName || 'Belirtilmemiş'}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Başlangıç:</span>
                        <div className="font-medium">
                          {new Date(breakRecord.startTime).toLocaleTimeString('tr-TR')}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Geçen Süre:</span>
                        <div className="font-medium text-primary-600 font-mono">
                          {formatElapsedTime(breakRecord.startTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-primary-600">
                        {formatElapsedTime(breakRecord.startTime)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(breakRecord.startTime).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveBreaks;

