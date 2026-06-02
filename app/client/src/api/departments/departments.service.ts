import { apiAxios } from '../axios';
import type { Department, CreateDepartmentRequest } from './departments.types';

export const departmentsService = {
  list(): Promise<Department[]> {
    return apiAxios.get<Department[]>('/departments').then(r => r.data);
  },

  create(data: CreateDepartmentRequest): Promise<Department> {
    return apiAxios.post<Department>('/departments', data).then(r => r.data);
  },
};
