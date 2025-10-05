import React, { useState, useEffect } from 'react';
import { breakAPI } from '../../services/api';
import { BreakHistory as BreakHistoryType, Break } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

interface BreakHistoryProps {
  userId: number;
}

const BreakHistory: React.FC<BreakHistoryProps> = ({ userId }) => {
  const [history, setHistory] = useState<BreakHistoryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  const loadHistory = async (page = 1, startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await breakAPI.getHistory(userId, {
        page,
        limit: 10,
        startDate,
        endDate
      });

      if (response.data.success) {
        setHistory(response.data.data!);
        setCurrentPage(page);
      }
    } catch (err: any) {
      setError(err.message || 'Mola geçmişi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1, dateFilter.startDate || undefined, dateFilter.endDate || undefined);
  }, [userId, dateFilter]);

  const handleDateFilterChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateFilter(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setDateFilter({ startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}s ${mins}dk`;
    }
    return `${mins}dk`;
  };

  const getBreakTypeColor = (breakType?: string) => {
    switch (breakType) {
      case 'Yemek Molası':
        return 'badge-warning';
      case 'Kahve Molası':
        return 'badge-primary';
      case 'Kişisel Mola':
        return 'badge-success';
      case 'Sigara Molası':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  if (loading && !history) {
    return <LoadingSpinner text="Mola geçmişi yükleniyor..." />;
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Mola Geçmişi</h2>
      </div>

      <div className="p-6">
        {/* Filtreler */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                className="input"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={clearFilters}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                Filtreleri Temizle
              </Button>
            </div>
          </div>
        </div>

        {error && (
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
        )}

        {history && (
          <>
            {/* Mola Listesi */}
            <div className="space-y-3">
              {history.breaks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Mola Geçmişi Bulunamadı
                  </h3>
                  <p className="text-gray-500">
                    Seçilen tarih aralığında mola kaydınız bulunmuyor.
                  </p>
                </div>
              ) : (
                history.breaks.map((breakRecord: Break) => (
                  <div
                    key={breakRecord.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`badge ${getBreakTypeColor(breakRecord.breakTypeName)}`}>
                            {breakRecord.breakTypeName || 'Belirtilmemiş'}
                          </span>
                          {breakRecord.isAutoEnded && (
                            <span className="badge badge-warning">
                              Otomatik Bitirildi
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Başlangıç:</span>
                            <div className="font-medium">
                              {new Date(breakRecord.startTime).toLocaleString('tr-TR')}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Bitiş:</span>
                            <div className="font-medium">
                              {breakRecord.endTime 
                                ? new Date(breakRecord.endTime).toLocaleString('tr-TR')
                                : 'Devam ediyor'
                              }
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Süre:</span>
                            <div className="font-medium text-primary-600">
                              {breakRecord.durationMinutes 
                                ? formatDuration(breakRecord.durationMinutes)
                                : 'Hesaplanıyor...'
                              }
                            </div>
                          </div>
                        </div>
                        
                        {breakRecord.notes && (
                          <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
                            <span className="text-gray-500">Notlar:</span>
                            <div className="text-gray-700 mt-1">{breakRecord.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {history.pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Toplam {history.pagination.totalItems} mola gösteriliyor
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => loadHistory(currentPage - 1, dateFilter.startDate || undefined, dateFilter.endDate || undefined)}
                    disabled={!history.pagination.hasPrev || loading}
                    variant="secondary"
                    size="sm"
                  >
                    Önceki
                  </Button>
                  
                  <span className="px-3 py-2 text-sm text-gray-700">
                    {currentPage} / {history.pagination.totalPages}
                  </span>
                  
                  <Button
                    onClick={() => loadHistory(currentPage + 1, dateFilter.startDate || undefined, dateFilter.endDate || undefined)}
                    disabled={!history.pagination.hasNext || loading}
                    variant="secondary"
                    size="sm"
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {loading && history && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakHistory;

