export interface Department {
  id: number;
  name: string;
  description?: string;
  userCount?: number;
  createdAt: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'employee' | 'admin';
  department?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface BreakType {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Break {
  id: number;
  userId: number;
  breakTypeId?: number;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  notes?: string;
  isAutoEnded: boolean;
  createdAt: string;
  updatedAt: string;
  breakTypeName?: string;
}

export interface ActiveBreak extends Break {
  firstName: string;
  lastName: string;
  department?: string;
}

export interface DailyStats {
  breakCount: number;
  totalMinutes: number;
  remainingMinutes: number;
  maxDailyMinutes: number;
}

export interface BreakStatus {
  activeBreak: Break | null;
  dailyStats: DailyStats;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface BreakHistory {
  breaks: Break[];
  pagination: Pagination;
}

export interface AdminDashboard {
  activeBreaks: ActiveBreak[];
  dailyStats: {
    totalUsers: number;
    activeUsers: number;
    totalBreaks: number;
    totalMinutes: number;
    avgDuration: number;
  };
  departmentStats: Array<{
    department: string;
    userCount: number;
    breakCount: number;
    totalMinutes: number;
  }>;
}

export interface SystemSettings {
  dailyMaxBreakMinutes: number;
  morningBreakMinutes: number;
  afternoonBreakMinutes: number;
  minBreakInterval: number;
  autoEndForgottenBreaks: boolean;
  forgottenBreakMinutes: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  department?: string;
  role?: 'employee' | 'admin';
}

