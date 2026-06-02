'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { activityLogsService } from '@/src/api/activity-logs/activity-logs.service';
import type { ActivityLog, ActivityAction } from '@/src/api/activity-logs/activity-logs.types';

const PAGE_SIZE = 10;

const ACTION_STYLES: Record<ActivityAction, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  UPDATE: 'bg-amber-100  text-amber-700  dark:bg-amber-500/15  dark:text-amber-400',
  DELETE: 'bg-rose-100   text-rose-700   dark:bg-rose-500/15   dark:text-rose-400',
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
          {[120, 80, 160, 180, 140].map((w, j) => (
            <td key={j} className="px-4 py-3">
              <div className={`h-3.5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse`} style={{ width: w }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ActivityLogSection({ status }: { status: string }) {
  const [logs, setLogs]           = useState<ActivityLog[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [action, setAction]       = useState<ActivityAction | ''>('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoading(true);
    activityLogsService.list({
      page,
      pageSize: PAGE_SIZE,
      action:   action || undefined,
    })
      .then(res => {
        setLogs(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch(() => toast.error('Failed to load activity logs.'))
      .finally(() => setLoading(false));
  }, [status, page, action]);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {total} events recorded
        </p>
        <Select
          value={action || 'all'}
          onValueChange={v => { setAction(!v || v === 'all' ? '' : v as ActivityAction); setPage(1); }}
        >
          <SelectTrigger className="h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="CREATE">Create</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Performed by</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    No activity yet.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${ACTION_STYLES[log.action]}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {log.employee?.fullName ?? <span className="text-slate-400 italic">deleted</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {log.user.email}
                    </td>
                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500 font-mono text-xs max-w-xs truncate">
                      {log.payload ? JSON.stringify(log.payload) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>{total} events &bull; page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
