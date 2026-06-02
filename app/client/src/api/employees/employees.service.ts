import { http } from '../http';
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  ListEmployeesQuery,
  PaginatedEmployees,
} from './employees.types';

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
  list(query: ListEmployeesQuery = {}): Promise<PaginatedEmployees> {
    return http.get<PaginatedEmployees>(`/employees${toQueryString(query)}`);
  },

  getById(id: number): Promise<Employee> {
    return http.get<Employee>(`/employees/${id}`);
  },

  create(data: CreateEmployeeRequest): Promise<Employee> {
    return http.post<Employee>('/employees', data);
  },

  update(id: number, data: UpdateEmployeeRequest): Promise<Employee> {
    return http.patch<Employee>(`/employees/${id}`, data);
  },

  remove(id: number): Promise<void> {
    return http.delete(`/employees/${id}`);
  },
};
