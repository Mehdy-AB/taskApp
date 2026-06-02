export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

export type EmployeeSortKey =
  | 'fullName'
  | 'email'
  | 'jobTitle'
  | 'status'
  | 'department'
  | 'createdBy'
  | 'createdAt';

export interface Employee {
  id: number;
  fullName: string;
  email: string;
  department: string;
  departmentId: number;
  jobTitle: string;
  status: EmployeeStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  fullName: string;
  email: string;
  departmentId: number;
  jobTitle: string;
  status?: EmployeeStatus;
}

export interface UpdateEmployeeRequest {
  fullName?: string;
  email?: string;
  departmentId?: number;
  jobTitle?: string;
  status?: EmployeeStatus;
}

export interface ListEmployeesQuery {
  search?: string;
  department?: string;
  status?: EmployeeStatus;
  sortBy?: EmployeeSortKey;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedEmployees {
  data: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
