import React from 'react';

interface DepartmentStat {
  department: string;
  userCount: number;
  breakCount: number;
  totalMinutes: number;
}

interface DepartmentStatsProps {
  departmentStats: DepartmentStat[];
}

const DepartmentStats: React.FC<DepartmentStatsProps> = ({ departmentStats }) => {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}s ${mins}dk`;
    }
    return `${mins}dk`;
  };

  const getAverageBreakDuration = (totalMinutes: number, breakCount: number): number => {
    return breakCount > 0 ? Math.round(totalMinutes / breakCount) : 0;
  };

  const getBreakEfficiency = (breakCount: number, userCount: number): number => {
    return userCount > 0 ? Math.round((breakCount / userCount) * 100) / 100 : 0;
  };

  const sortedDepartments = [...departmentStats].sort((a, b) => b.totalMinutes - a.totalMinutes);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Departman İstatistikleri</h2>
        <p className="text-sm text-gray-500">
          Bugünkü departman bazlı mola kullanımı
        </p>
      </div>

      <div className="p-6">
        {departmentStats.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Departman Verisi Yok
            </h3>
            <p className="text-gray-500">
              Bugün henüz departman bazlı mola verisi bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Department Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sortedDepartments.map((dept, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {dept.department}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {dept.userCount} kullanıcı
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">
                        {dept.totalMinutes}
                      </div>
                      <div className="text-xs text-gray-500">dakika</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {dept.breakCount}
                      </div>
                      <div className="text-xs text-gray-500">Toplam Mola</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {getAverageBreakDuration(dept.totalMinutes, dept.breakCount)}
                      </div>
                      <div className="text-xs text-gray-500">Ort. Süre (dk)</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {getBreakEfficiency(dept.breakCount, dept.userCount)}
                      </div>
                      <div className="text-xs text-gray-500">Mola/Kişi</div>
                    </div>
                  </div>

                  {/* Progress bar for total minutes */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Kullanım</span>
                      <span>{formatDuration(dept.totalMinutes)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((dept.totalMinutes / Math.max(...departmentStats.map(d => d.totalMinutes))) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Table */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Özet Tablo</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Departman
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kullanıcı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Toplam Mola
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Toplam Süre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ort. Süre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mola/Kişi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedDepartments.map((dept, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{dept.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dept.userCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dept.breakCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDuration(dept.totalMinutes)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getAverageBreakDuration(dept.totalMinutes, dept.breakCount)}dk
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getBreakEfficiency(dept.breakCount, dept.userCount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {departmentStats.reduce((sum, dept) => sum + dept.userCount, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Toplam Kullanıcı</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {departmentStats.reduce((sum, dept) => sum + dept.breakCount, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Toplam Mola</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatDuration(departmentStats.reduce((sum, dept) => sum + dept.totalMinutes, 0))}
                  </div>
                  <div className="text-sm text-gray-500">Toplam Süre</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(departmentStats.reduce((sum, dept) => sum + dept.totalMinutes, 0) / 
                      Math.max(departmentStats.reduce((sum, dept) => sum + dept.breakCount, 0), 1))}dk
                  </div>
                  <div className="text-sm text-gray-500">Genel Ort. Süre</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentStats;

