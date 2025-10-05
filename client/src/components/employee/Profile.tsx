import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import { User } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import Input from '../common/Input';
import ChangePasswordModal from '../common/ChangePasswordModal';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: user.department
      });
      setLoading(false);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await userAPI.updateProfile(profileData);
      if (response.data.success) {
        // Auth context'i güncelle
        updateUser(response.data.data!.user);
        alert('Profil başarıyla güncellendi!');
      }
    } catch (error: any) {
      console.error('Profil güncelleme hatası:', error);
      setError(error.response?.data?.message || 'Profil güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Profil Bilgileri</h1>
        </div>
        
        <div className="px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ad"
                name="firstName"
                value={profileData.firstName || ''}
                onChange={handleInputChange}
                required
              />
              
              <Input
                label="Soyad"
                name="lastName"
                value={profileData.lastName || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            <Input
              label="Email"
              name="email"
              type="email"
              value={profileData.email || ''}
              onChange={handleInputChange}
              required
            />

            <Input
              label="Departman"
              name="department"
              value={profileData.department || ''}
              onChange={handleInputChange}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={saving}
              >
                {saving ? 'Kaydediliyor...' : 'Profili Güncelle'}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowPasswordModal(true)}
              >
                Şifre Değiştir
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Hesap Bilgileri</h2>
        </div>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Rol:</span>
              <span className="ml-2 text-gray-900">{user?.role}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Hesap Oluşturulma:</span>
              <span className="ml-2 text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
              </span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Hesap Durumu:</span>
              <span className={`ml-2 ${user?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {user?.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};

export default Profile;
