import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';
import { SystemSettings } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import Input from '../common/Input';

interface SettingsProps {
  onClose?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    dailyMaxBreakMinutes: 60,
    morningBreakMinutes: 30,
    afternoonBreakMinutes: 30,
    minBreakInterval: 30,
    autoEndForgottenBreaks: true,
    forgottenBreakMinutes: 120
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      if (response.data.success && response.data.data?.settings) {
        setSettings(response.data.data.settings);
      }
    } catch (error) {
      console.error('Ayarlar yüklenirken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await settingsAPI.updateSettings(settings);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi!' });
      } else {
        setMessage({ type: 'error', text: 'Ayarlar kaydedilirken hata oluştu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ayarlar kaydedilirken hata oluştu' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Ayarlar yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sistem Ayarları</h2>
          <p className="text-sm text-gray-500 mt-1">
            Mola süreleri ve sistem kurallarını yönetin
          </p>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="secondary">
            Kapat
          </Button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Mola Süre Ayarları</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Daily Max Break Minutes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Günlük Maksimum Mola Süresi (dakika)"
              type="number"
              value={settings.dailyMaxBreakMinutes}
              onChange={(e) => handleInputChange('dailyMaxBreakMinutes', parseInt(e.target.value) || 0)}
              min="0"
              helperText="Bir çalışanın günde alabileceği toplam mola süresi"
            />
            
            <Input
              label="Minimum Mola Aralığı (dakika)"
              type="number"
              value={settings.minBreakInterval}
              onChange={(e) => handleInputChange('minBreakInterval', parseInt(e.target.value) || 0)}
              min="0"
              helperText="İki mola arasındaki minimum bekleme süresi"
            />
          </div>

          {/* Morning and Afternoon Break Settings */}
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold mb-4">Mola Süre Limitleri</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Öğleden Önce Mola Süresi (dakika)
                </label>
                <input
                  type="number"
                  value={settings.morningBreakMinutes}
                  onChange={(e) => handleInputChange('morningBreakMinutes', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  12:00 öncesi alınan molalar için maksimum süre
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Öğleden Sonra Mola Süresi (dakika)
                </label>
                <input
                  type="number"
                  value={settings.afternoonBreakMinutes}
                  onChange={(e) => handleInputChange('afternoonBreakMinutes', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  12:00 sonrası alınan molalar için maksimum süre
                </p>
              </div>
            </div>
          </div>

          {/* Auto End Forgotten Breaks */}
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold mb-4">Unutulan Molalar</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoEndForgottenBreaks"
                  checked={settings.autoEndForgottenBreaks}
                  onChange={(e) => handleInputChange('autoEndForgottenBreaks', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoEndForgottenBreaks" className="ml-2 block text-sm text-gray-900">
                  Unutulan molaları otomatik olarak sonlandır
                </label>
              </div>
              
              {settings.autoEndForgottenBreaks && (
                <div className="ml-6">
                  <Input
                    label="Otomatik Sonlandırma Süresi (dakika)"
                    type="number"
                    value={settings.forgottenBreakMinutes}
                    onChange={(e) => handleInputChange('forgottenBreakMinutes', parseInt(e.target.value) || 0)}
                    min="0"
                    helperText="Bu süre sonunda mola otomatik olarak sonlandırılır"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t pt-6">
            <div className="flex justify-end space-x-3">
              <Button onClick={loadSettings} variant="secondary">
                İptal
              </Button>
              <Button 
                onClick={saveSettings} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Settings Summary */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Mevcut Ayarlar Özeti</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-blue-700">Günlük Maksimum Mola:</span>
              <span className="font-medium text-blue-900">{settings.dailyMaxBreakMinutes} dakika</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Öğleden Önce Mola:</span>
              <span className="font-medium text-blue-900">{settings.morningBreakMinutes} dakika</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Öğleden Sonra Mola:</span>
              <span className="font-medium text-blue-900">{settings.afternoonBreakMinutes} dakika</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-blue-700">Minimum Mola Aralığı:</span>
              <span className="font-medium text-blue-900">{settings.minBreakInterval} dakika</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Otomatik Sonlandırma:</span>
              <span className="font-medium text-blue-900">
                {settings.autoEndForgottenBreaks ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            {settings.autoEndForgottenBreaks && (
              <div className="flex justify-between">
                <span className="text-blue-700">Sonlandırma Süresi:</span>
                <span className="font-medium text-blue-900">{settings.forgottenBreakMinutes} dakika</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
