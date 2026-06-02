import { apiAxios } from '../axios';
import type { ListActivityLogsQuery, PaginatedActivityLogs } from './activity-logs.types';

function toQueryString(params: ListActivityLogsQuery): string {
  const q = new URLSearchParams();
  if (params.page)     q.set('page',     String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  if (params.action)   q.set('action',   params.action);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const activityLogsService = {
  list(query: ListActivityLogsQuery = {}): Promise<PaginatedActivityLogs> {
    return apiAxios.get<PaginatedActivityLogs>(`/activity-logs${toQueryString(query)}`).then(r => r.data);
  },
};
