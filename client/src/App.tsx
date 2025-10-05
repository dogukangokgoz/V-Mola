import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import EmployeeDashboard from './components/employee/Dashboard';
import AdminDashboard from './components/admin/Dashboard';
import UserManagementPage from './components/admin/UserManagementPage';
import DepartmentManagement from './components/admin/DepartmentManagement';
import { Reports } from './components/admin/Reports';
import { Settings } from './components/admin/Settings';
import Profile from './components/employee/Profile';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import OfflineIndicator from './components/common/OfflineIndicator';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'admin' | 'employee' }> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Unauthorized component
const Unauthorized: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
      <div className="text-red-600 text-6xl mb-4">🚫</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Erişim Reddedildi</h1>
      <p className="text-gray-600 mb-4">
        Bu sayfaya erişim yetkiniz bulunmamaktadır.
      </p>
      <button
        onClick={() => window.history.back()}
        className="btn btn-primary"
      >
        Geri Dön
      </button>
    </div>
  </div>
);

// App Routes
const AppRoutes: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? 
            <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace /> : 
            <Login />
        } 
      />
      <Route 
        path="/register" 
        element={
          isAuthenticated ? 
            <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace /> : 
            <Register />
        } 
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="employee">
            <Layout>
              <EmployeeDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <UserManagementPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <DepartmentManagement />
                </Layout>
              </ProtectedRoute>
            }
          />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

      {/* Error Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Default Route */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 Route */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
              <div className="text-gray-600 text-6xl mb-4">🔍</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Sayfa Bulunamadı</h1>
              <p className="text-gray-600 mb-4">
                Aradığınız sayfa mevcut değil.
              </p>
              <button
                onClick={() => window.history.back()}
                className="btn btn-primary"
              >
                Geri Dön
              </button>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <OfflineIndicator />
          <AppRoutes />
          <PWAInstallPrompt />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;

