export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface ActivityLog {
  id:        number;
  action:    ActivityAction;
  employee:  { id: number; fullName: string } | null;
  user:      { id: number; email: string };
  payload:   Record<string, unknown> | null;
  createdAt: string;
}

export interface ListActivityLogsQuery {
  page?:     number;
  pageSize?: number;
  action?:   ActivityAction;
}

export interface PaginatedActivityLogs {
  data:       ActivityLog[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}
