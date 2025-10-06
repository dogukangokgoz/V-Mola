import axios, { AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User, 
  BreakStatus, 
  BreakHistory, 
  AdminDashboard,
  BreakType,
  SystemSettings,
  Break,
  Department
} from '../types';

// Dinamik API URL - mevcut hostname'i kullan
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // Netlify production'da Netlify Functions kullan
  if (hostname.includes('netlify.app')) {
    return `${protocol}//${hostname}/api`;
  }

  // Production'da port kullanma
  if (hostname.includes('vercel.app') || hostname.includes('yourdomain.com')) {
    return `${protocol}//${hostname}/api`;
  }
  
  // Development'da port kullan
  const port = window.location.port || '5000';
  return `${protocol}//${hostname}:${port}/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - token süresi dolmuşsa çıkış yap
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data: LoginRequest): Promise<AxiosResponse<ApiResponse<LoginResponse>>> =>
    api.post('/auth', data),
  
  register: (data: RegisterRequest): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.post('/auth/register', data),
  
  logout: (): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.post('/auth/logout'),
  
  getMe: (): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.get('/users'),
  
  refreshToken: (): Promise<AxiosResponse<ApiResponse<{ token: string }>>> =>
    api.post('/auth/refresh'),
};

// Break API
export const breakAPI = {
  getStatus: (userId: number): Promise<AxiosResponse<ApiResponse<BreakStatus>>> =>
    api.get(`/breaks/status/${userId}`),
  
  startBreak: (data: { breakTypeId?: number }): Promise<AxiosResponse<ApiResponse<{ break: Break }>>> =>
    api.post('/breaks', data),
  
  endBreak: (breakId: number, data: { notes?: string }): Promise<AxiosResponse<ApiResponse<{ break: Break }>>> =>
    api.put('/breaks', { breakId, ...data }),
  
  getHistory: (userId: number, params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<BreakHistory>>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    return api.get(`/breaks?${queryParams.toString()}`);
  },
  
  getTypes: (): Promise<AxiosResponse<ApiResponse<{ breakTypes: BreakType[] }>>> =>
    api.get('/breaks/types'),
  
  autoEndForgotten: (): Promise<AxiosResponse<ApiResponse<{ endedCount: number }>>> =>
    api.post('/breaks/auto-end-forgotten'),
};

// User API
export const userAPI = {
  getUsers: (params?: {
    page?: number;
    limit?: number;
    department?: string;
    role?: string;
    search?: string;
  }): Promise<AxiosResponse<ApiResponse<{ users: User[]; pagination: any }>>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.department) queryParams.append('department', params.department);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);
    
    return api.get(`/users?${queryParams.toString()}`);
  },
  
  getUser: (userId: number): Promise<AxiosResponse<ApiResponse<{ user: User; stats: any }>>> =>
    api.get(`/users/${userId}`),
  
  createUser: (data: RegisterRequest): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.post('/users', data),
  
  updateUser: (userId: number, data: Partial<User>): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.put(`/users/${userId}`, data),
  
  deleteUser: (userId: number): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.delete(`/users/${userId}`),
  
  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.put('/users/change-password', data),
  
  changeUserPassword: (userId: number, data: { newPassword: string }): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.put(`/users/${userId}/change-password`, data),
  
  updateProfile: (data: Partial<User>): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.put('/profile', data),
  
  getDepartments: (): Promise<AxiosResponse<ApiResponse<{ departments: string[] }>>> =>
    api.get('/users/departments/list'),
};

// Admin API
export const adminAPI = {
  getDashboard: (): Promise<AxiosResponse<ApiResponse<AdminDashboard>>> =>
    api.get('/admin/dashboard'),
  
  getReports: (params?: {
    startDate?: string;
    endDate?: string;
    department?: string;
    userId?: number;
    breakTypeId?: number;
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<any>>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.userId) queryParams.append('userId', params.userId.toString());
    if (params?.breakTypeId) queryParams.append('breakTypeId', params.breakTypeId.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    return api.get(`/admin/reports?${queryParams.toString()}`);
  },
  
  getExcelReport: (params?: {
    startDate?: string;
    endDate?: string;
    department?: string;
    userId?: number;
  }): Promise<AxiosResponse<Blob>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.userId) queryParams.append('userId', params.userId?.toString() || '');
    
    return api.get(`/admin/reports/excel?${queryParams.toString()}`, {
      responseType: 'blob'
    });
  },
  
  getPdfReport: (params?: {
    startDate?: string;
    endDate?: string;
    department?: string;
    userId?: number;
  }): Promise<AxiosResponse<Blob>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.userId) queryParams.append('userId', params.userId?.toString() || '');
    
    return api.get(`/admin/reports/pdf?${queryParams.toString()}`, {
      responseType: 'blob'
    });
  },
  
  getChartsData: (params?: {
    startDate?: string;
    endDate?: string;
    department?: string;
  }): Promise<AxiosResponse<ApiResponse<any>>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.department) queryParams.append('department', params.department);
    
    return api.get(`/admin/charts/data?${queryParams.toString()}`);
  },
};

// Settings API
export const settingsAPI = {
  getSettings: (): Promise<AxiosResponse<ApiResponse<{ settings: SystemSettings }>>> =>
    api.get('/settings'),
  
  updateSettings: (data: Partial<SystemSettings>): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.put('/settings', data),
  
  getBreakTypes: (): Promise<AxiosResponse<ApiResponse<{ breakTypes: BreakType[] }>>> =>
    api.get('/settings/break-types'),
  
  createBreakType: (data: { name: string; description?: string }): Promise<AxiosResponse<ApiResponse<{ breakType: BreakType }>>> =>
    api.post('/settings/break-types', data),
  
  updateBreakType: (id: number, data: { name: string; description?: string; isActive?: boolean }): Promise<AxiosResponse<ApiResponse<{ breakType: BreakType }>>> =>
    api.put(`/settings/break-types/${id}`, data),
  
  deleteBreakType: (id: number): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.delete(`/settings/break-types/${id}`),
  
  // Departman yönetimi
  getDepartments: (): Promise<AxiosResponse<ApiResponse<Department[]>>> =>
    api.get('/departments'),
  
  createDepartment: (data: { name: string; description?: string }): Promise<AxiosResponse<ApiResponse<Department>>> =>
    api.post('/departments', data),
  
  updateDepartment: (id: number, data: { name: string; description?: string }): Promise<AxiosResponse<ApiResponse<Department>>> =>
    api.put(`/departments/${id}`, data),
  
  deleteDepartment: (id: number): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.delete(`/departments/${id}`),
  
  getBreakRules: (): Promise<AxiosResponse<ApiResponse<{ breakRules: any[] }>>> =>
    api.get('/settings/break-rules'),
  
  updateBreakRule: (id: number, data: any): Promise<AxiosResponse<ApiResponse<{ breakRule: any }>>> =>
    api.put(`/settings/break-rules/${id}`, data),
};

export default api;

