export type { UserRole, AuthUser, AuthUser as User, LoginRequest, LoginResponse } from '@/src/api/auth/auth.types';
export type { EmployeeStatus, EmployeeSortKey, Employee, CreateEmployeeRequest, UpdateEmployeeRequest, ListEmployeesQuery, PaginatedEmployees } from '@/src/api/employees/employees.types';
export type { Department, CreateDepartmentRequest } from '@/src/api/departments/departments.types';

export type PaginatedResponse<T> = { data: T[]; total: number; page: number; pageSize: number; totalPages: number };
