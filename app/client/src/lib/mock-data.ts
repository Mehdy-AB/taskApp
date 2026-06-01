import type { Employee } from './types/api';

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 1,  fullName: 'Alice Johnson',   email: 'alice.j@company.com',   department: 'Engineering', jobTitle: 'Senior Developer',    status: 'ACTIVE'   },
  { id: 2,  fullName: 'Bob Smith',       email: 'bob.s@company.com',     department: 'Marketing',   jobTitle: 'Marketing Manager',   status: 'ACTIVE'   },
  { id: 3,  fullName: 'Carol White',     email: 'carol.w@company.com',   department: 'HR',          jobTitle: 'HR Specialist',       status: 'INACTIVE' },
  { id: 4,  fullName: 'David Brown',     email: 'david.b@company.com',   department: 'Engineering', jobTitle: 'Frontend Developer',  status: 'ACTIVE'   },
  { id: 5,  fullName: 'Emma Davis',      email: 'emma.d@company.com',    department: 'Design',      jobTitle: 'UI/UX Designer',      status: 'ACTIVE'   },
  { id: 6,  fullName: 'Frank Miller',    email: 'frank.m@company.com',   department: 'Finance',     jobTitle: 'Financial Analyst',   status: 'INACTIVE' },
  { id: 7,  fullName: 'Grace Wilson',    email: 'grace.w@company.com',   department: 'Engineering', jobTitle: 'Backend Developer',   status: 'ACTIVE'   },
  { id: 8,  fullName: 'Henry Taylor',    email: 'henry.t@company.com',   department: 'Marketing',   jobTitle: 'Content Strategist',  status: 'ACTIVE'   },
  { id: 9,  fullName: 'Isla Martinez',   email: 'isla.m@company.com',    department: 'Finance',     jobTitle: 'Accountant',          status: 'ACTIVE'   },
  { id: 10, fullName: 'James Anderson',  email: 'james.a@company.com',   department: 'HR',          jobTitle: 'Talent Acquisition',  status: 'ACTIVE'   },
  { id: 11, fullName: 'Karen Thomas',    email: 'karen.t@company.com',   department: 'Design',      jobTitle: 'Graphic Designer',    status: 'INACTIVE' },
  { id: 12, fullName: 'Liam Jackson',    email: 'liam.j@company.com',    department: 'Engineering', jobTitle: 'DevOps Engineer',     status: 'ACTIVE'   },
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

export type SortKey = 'fullName' | 'department' | 'jobTitle' | 'status';
export type SortDir = 'asc' | 'desc';
