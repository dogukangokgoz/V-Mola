import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

interface UserReport {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  totalBreaks: number;
  morningBreaks: number;
  afternoonBreaks: number;
  totalMorningDuration: number; // dakika
  totalAfternoonDuration: number; // dakika
  averageBreakDuration: number; // dakika
  lastBreakDate: string;
}

interface ReportsProps {
  onClose?: () => void;
}

export const Reports: React.FC<ReportsProps> = ({ onClose }) => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    loadReports();
    loadDepartments();
  }, [dateRange, selectedDepartment]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getReports({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        department: selectedDepartment || undefined
      });
      
      if (response.data.success) {
        setReports(response.data.data?.reports || []);
      }
    } catch (error) {
      console.error('Raporlar yüklenirken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await adminAPI.getReports({});
      if (response.data.success && response.data.data?.departments) {
        setDepartments(response.data.data.departments);
      }
    } catch (error) {
      console.error('Departmanlar yüklenirken hata oluştu:', error);
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await adminAPI.getExcelReport({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        department: selectedDepartment || undefined
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mola-raporu-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel export hatası:', error);
      alert('Excel raporu oluşturulurken hata oluştu');
    }
  };

  const exportToPdf = async () => {
    try {
      const response = await adminAPI.getPdfReport({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        department: selectedDepartment || undefined
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mola-raporu-${dateRange.startDate}-${dateRange.endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export hatası:', error);
      alert('PDF raporu oluşturulurken hata oluştu');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Raporlar yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mola Raporları</h2>
          <p className="text-sm text-gray-500 mt-1">
            Kullanıcı bazlı mola istatistikleri ve analizleri
          </p>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="secondary">
            Kapat
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Filtreler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Departman
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Departmanlar</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex space-x-3">
        <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
          📊 Excel İndir
        </Button>
        <Button onClick={exportToPdf} className="bg-red-600 hover:bg-red-700">
          📄 PDF İndir
        </Button>
        <Button onClick={loadReports} variant="secondary">
          🔄 Yenile
        </Button>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            Kullanıcı Mola Raporları ({reports.length} kullanıcı)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departman
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Toplam Mola
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Öğleden Önce
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Öğleden Sonra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Toplam Süre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ort. Süre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Son Mola
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {report.firstName.charAt(0)}{report.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {report.firstName} {report.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {report.totalBreaks}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <span className="font-medium">{report.morningBreaks}</span> mola
                    </div>
                    <div className="text-gray-500">
                      {formatDuration(report.totalMorningDuration)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <span className="font-medium">{report.afternoonBreaks}</span> mola
                    </div>
                    <div className="text-gray-500">
                      {formatDuration(report.totalAfternoonDuration)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">
                      {formatDuration(report.totalMorningDuration + report.totalAfternoonDuration)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(report.averageBreakDuration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.lastBreakDate ? 
                      new Date(report.lastBreakDate).toLocaleDateString('tr-TR') : 
                      'Mola almamış'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {reports.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Rapor Bulunamadı
            </h3>
            <p className="text-gray-500">
              Seçilen tarih aralığında mola verisi bulunmuyor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
