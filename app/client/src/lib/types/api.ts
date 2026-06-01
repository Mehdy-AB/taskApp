export type UserRole = 'ADMIN' | 'VIEWER';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Employee {
  id: number;
  fullName: string;
  email: string;
  department: string;
  jobTitle: string;
  status: EmployeeStatus;
  createdBy: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
