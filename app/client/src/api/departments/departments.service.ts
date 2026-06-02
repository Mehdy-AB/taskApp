import { http } from '../http';
import type { Department, CreateDepartmentRequest } from './departments.types';

export const departmentsService = {
  list(): Promise<Department[]> {
    return http.get<Department[]>('/departments');
  },

  create(data: CreateDepartmentRequest): Promise<Department> {
    return http.post<Department>('/departments', data);
  },
};
