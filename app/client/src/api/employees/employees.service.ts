import { apiAxios } from '../axios';
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  ListEmployeesQuery,
  PaginatedEmployees,
} from './employees.types';

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  departments: number;
}

function toQueryString(params: ListEmployeesQuery): string {
  const q = new URLSearchParams();
  if (params.search)     q.set('search',     params.search);
  if (params.department) q.set('department', params.department);
  if (params.status)     q.set('status',     params.status);
  if (params.sortBy)     q.set('sortBy',     params.sortBy);
  if (params.sortDir)    q.set('sortDir',    params.sortDir);
  if (params.page)       q.set('page',       String(params.page));
  if (params.pageSize)   q.set('pageSize',   String(params.pageSize));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const employeesService = {
  stats(): Promise<EmployeeStats> {
    return apiAxios.get<EmployeeStats>('/employees/stats').then(r => r.data);
  },

  list(query: ListEmployeesQuery = {}): Promise<PaginatedEmployees> {
    return apiAxios.get<PaginatedEmployees>(`/employees${toQueryString(query)}`).then(r => r.data);
  },

  getById(id: number): Promise<Employee> {
    return apiAxios.get<Employee>(`/employees/${id}`).then(r => r.data);
  },

  create(data: CreateEmployeeRequest): Promise<Employee> {
    return apiAxios.post<Employee>('/employees', data).then(r => r.data);
  },

  update(id: number, data: UpdateEmployeeRequest): Promise<Employee> {
    return apiAxios.patch<Employee>(`/employees/${id}`, data).then(r => r.data);
  },

  remove(id: number): Promise<void> {
    return apiAxios.delete(`/employees/${id}`).then(() => undefined);
  },
};
