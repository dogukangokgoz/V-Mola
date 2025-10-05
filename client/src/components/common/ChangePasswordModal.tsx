import React, { useState } from 'react';
import { userAPI } from '../../services/api';
import Button from './Button';
import Input from './Input';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number; // Admin için kullanıcı ID'si, yoksa kendi şifresi
  userName?: string; // Admin için kullanıcı adı
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName
}) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdminChanging = userId !== undefined;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Şifre eşleşme kontrolü
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Yeni şifreler eşleşmiyor');
        setLoading(false);
        return;
      }

      // Şifre uzunluk kontrolü
      if (formData.newPassword.length < 6) {
        setError('Yeni şifre en az 6 karakter olmalıdır');
        setLoading(false);
        return;
      }

      let response;
      if (isAdminChanging) {
        // Admin kullanıcı şifresini değiştiriyor
        response = await userAPI.changeUserPassword(userId, {
          newPassword: formData.newPassword
        });
      } else {
        // Kullanıcı kendi şifresini değiştiriyor
        response = await userAPI.changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
      }

      if (response.data.success) {
        alert(response.data.message);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        onClose();
      }
    } catch (error: any) {
      console.error('Şifre değiştirme hatası:', error);
      setError(error.response?.data?.message || 'Şifre değiştirilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {isAdminChanging ? `${userName} Şifresini Değiştir` : 'Şifre Değiştir'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isAdminChanging && (
              <Input
                label="Mevcut Şifre"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleInputChange}
                required
              />
            )}

            <Input
              label="Yeni Şifre"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleInputChange}
              required
              minLength={6}
            />

            <Input
              label="Yeni Şifre (Tekrar)"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              minLength={6}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                className="flex-1"
              >
                İptal
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
