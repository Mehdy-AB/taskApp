import type { Employee } from './types/api';

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 1,  fullName: 'Alice Johnson',   email: 'alice.j@company.com',   department: 'Engineering', departmentId: 1, jobTitle: 'Senior Developer',    status: 'ACTIVE',   createdBy: 'admin@company.com', createdAt: '2024-01-10T09:00:00Z', updatedAt: '2024-01-10T09:00:00Z' },
  { id: 2,  fullName: 'Bob Smith',       email: 'bob.s@company.com',     department: 'Marketing',   departmentId: 2, jobTitle: 'Marketing Manager',   status: 'ACTIVE',   createdBy: 'admin@company.com', createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-15T10:30:00Z' },
  { id: 3,  fullName: 'Carol White',     email: 'carol.w@company.com',   department: 'HR',          departmentId: 3, jobTitle: 'HR Specialist',       status: 'INACTIVE', createdBy: 'admin@company.com', createdAt: '2024-02-03T08:15:00Z', updatedAt: '2024-02-03T08:15:00Z' },
  { id: 4,  fullName: 'David Brown',     email: 'david.b@company.com',   department: 'Engineering', departmentId: 1, jobTitle: 'Frontend Developer',  status: 'ACTIVE',   createdBy: 'admin@company.com', createdAt: '2024-02-18T14:00:00Z', updatedAt: '2024-02-18T14:00:00Z' },
  { id: 5,  fullName: 'Emma Davis',      email: 'emma.d@company.com',    department: 'Design',      departmentId: 5, jobTitle: 'UI/UX Designer',      status: 'ACTIVE',   createdBy: 'admin@company.com', createdAt: '2024-03-05T11:45:00Z', updatedAt: '2024-03-05T11:45:00Z' },
  { id: 6,  fullName: 'Frank Miller',    email: 'frank.m@company.com',   department: 'Finance',     departmentId: 4, jobTitle: 'Financial Analyst',   status: 'INACTIVE', createdBy: 'admin@company.com', createdAt: '2024-03-20T09:30:00Z', updatedAt: '2024-03-20T09:30:00Z' },
  { id: 7,  fullName: 'Grace Wilson',    email: 'grace.w@company.com',   department: 'Engineering', departmentId: 1, jobTitle: 'Backend Developer',   status: 'ACTIVE',   createdBy: 'admin@company.com', createdAt: '2024-04-08T13:00:00Z', updatedAt: '2024-04-08T13:00:00Z' },
  { id: 8,  fullName: 'Henry Taylor',    email: 'henry.t@company.com',   department: 'Marketing',   departmentId: 2, jobTitle: 'Content Strategist',  status: 'ACTIVE',   createdBy: 'admin@company.com', createdAt: '2024-04-22T10:00:00Z', updatedAt: '2024-04-22T10:00:00Z' },
  { id: 9,  fullName: 'Isla Martinez',   email: 'isla.m@company.com',    department: 'Finance',     departmentId: 4, jobTitle: 'Accountant',          status: 'ACTIVE',   createdBy: 'admin@company.com', createdAt: '2024-05-14T16:20:00Z', updatedAt: '2024-05-14T16:20:00Z' },
  { id: 10, fullName: 'James Anderson',  email: 'james.a@company.com',   department: 'HR',          departmentId: 3, jobTitle: 'Talent Acquisition',  status: 'ACTIVE',   createdBy: 'admin@company.com', createdAt: '2024-06-01T08:00:00Z', updatedAt: '2024-06-01T08:00:00Z' },
  { id: 11, fullName: 'Karen Thomas',    email: 'karen.t@company.com',   department: 'Design',      departmentId: 5, jobTitle: 'Graphic Designer',    status: 'INACTIVE', createdBy: 'admin@company.com', createdAt: '2024-06-17T12:30:00Z', updatedAt: '2024-06-17T12:30:00Z' },
  { id: 12, fullName: 'Liam Jackson',    email: 'liam.j@company.com',    department: 'Engineering', departmentId: 1, jobTitle: 'DevOps Engineer',     status: 'ACTIVE',   createdBy: 'admin@company.com', createdAt: '2024-07-09T09:15:00Z', updatedAt: '2024-07-09T09:15:00Z' },
];

export const DEPARTMENTS = ['Engineering', 'Marketing', 'HR', 'Finance', 'Design'] as const;

export const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-600',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-rose-100 text-rose-600',
  'bg-violet-100 text-violet-600',
  'bg-cyan-100 text-cyan-600',
  'bg-orange-100 text-orange-600',
  'bg-sky-100 text-sky-600',
];

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export type SortKey = 'fullName' | 'department' | 'jobTitle' | 'status' | 'createdBy' | 'createdAt';
export type SortDir = 'asc' | 'desc';
