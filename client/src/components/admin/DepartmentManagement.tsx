import React, { useState, useEffect } from 'react';
import { Department } from '../../types';
import api from '../../services/api';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/departments');
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Departmanlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      setError('');

      if (editingDepartment) {
        // Güncelleme
        const response = await api.put(`/departments/${editingDepartment.id}`, formData);
        if (response.data.success) {
          setDepartments(prev => 
            prev.map(dept => 
              dept.id === editingDepartment.id 
                ? { ...dept, ...formData }
                : dept
            )
          );
          setEditingDepartment(null);
          setFormData({ name: '', description: '' });
        }
      } else {
        // Yeni ekleme
        const response = await api.post('/departments', formData);
        if (response.data.success) {
          setDepartments(prev => [...prev, response.data.data]);
          setFormData({ name: '', description: '' });
          setShowAddForm(false);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'İşlem sırasında hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({ name: department.name, description: department.description || '' });
    setShowAddForm(true);
  };

  const handleDelete = async (department: Department) => {
    if (!window.confirm(`"${department.name}" departmanını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const response = await api.delete(`/departments/${department.id}`);
      if (response.data.success) {
        setDepartments(prev => prev.filter(dept => dept.id !== department.id));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Departman silinirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingDepartment(null);
    setFormData({ name: '', description: '' });
    setError('');
  };

  if (loading) {
    return <LoadingSpinner text="Departmanlar yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departman Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Şirket departmanlarını yönetin ve organize edin
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          variant="primary"
          disabled={showAddForm}
        >
          + Yeni Departman
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingDepartment ? 'Departman Düzenle' : 'Yeni Departman Ekle'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Departman Adı"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Örn: İnsan Kaynakları"
            />
            <Input
              label="Açıklama (Opsiyonel)"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Departman hakkında kısa açıklama"
            />
            <div className="flex space-x-3">
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || !formData.name.trim()}
                loading={submitting}
              >
                {editingDepartment ? 'Güncelle' : 'Ekle'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={submitting}
              >
                İptal
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Departments List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Departmanlar ({departments.length})
          </h2>
        </div>
        
        {departments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Departman Bulunamadı</h3>
            <p className="text-gray-500 mb-4">Henüz hiç departman eklenmemiş.</p>
            <Button
              onClick={() => setShowAddForm(true)}
              variant="primary"
            >
              İlk Departmanı Ekle
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {departments.map((department) => (
              <div key={department.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {department.name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {department.userCount || 0} kullanıcı
                      </span>
                    </div>
                    {department.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {department.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Oluşturulma: {new Date(department.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleEdit(department)}
                      variant="secondary"
                      size="sm"
                      disabled={submitting}
                    >
                      Düzenle
                    </Button>
                    <Button
                      onClick={() => handleDelete(department)}
                      variant="danger"
                      size="sm"
                      disabled={submitting || (department.userCount || 0) > 0}
                    >
                      Sil
                    </Button>
                  </div>
                </div>
                
                {(department.userCount || 0) > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    ⚠️ Bu departmanda kullanıcılar bulunduğu için silinemez. Önce kullanıcıları başka departmanlara taşıyın.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentManagement;
