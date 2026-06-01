'use client';

import { ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AVATAR_COLORS, getInitials, type SortKey, type SortDir } from '@/src/lib/mock-data';
import type { Employee } from '@/src/lib/types/api';

const PAGE_SIZE = 5;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface Props {
  rows: Employee[];
  totalFiltered: number;
  page: number;
  totalPages: number;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onPageChange: (p: number) => void;
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
  onReset: () => void;
}

const COLS: { label: string; key: SortKey; hide?: string }[] = [
  { label: 'Employee',   key: 'fullName'   },
  { label: 'Department', key: 'department' },
  { label: 'Role',       key: 'jobTitle',  hide: 'hidden md:table-cell' },
  { label: 'Status',     key: 'status'     },
  { label: 'Created By', key: 'createdBy', hide: 'hidden xl:table-cell' },
  { label: 'Created At', key: 'createdAt', hide: 'hidden xl:table-cell' },
];

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className="inline-flex flex-col leading-none">
      <ChevronUp className={cn('size-2.5', active && dir === 'asc' ? 'text-[#364dff]' : 'opacity-30')} />
      <ChevronDown className={cn('size-2.5', active && dir === 'desc' ? 'text-[#364dff]' : 'opacity-30')} />
    </span>
  );
}

export function EmployeeTable({
  rows, totalFiltered, page, totalPages, sortKey, sortDir,
  onSort, onPageChange, onEdit, onDelete, onReset,
}: Props) {
  const start = (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, totalFiltered);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
          <TableRow className="border-slate-100 dark:border-slate-700/50">
            {COLS.map(({ label, key, hide }) => (
              <TableHead
                key={key}
                onClick={() => onSort(key)}
                className={cn(
                  'px-6 cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-300 transition-colors group',
                  hide,
                )}
              >
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide group-hover:text-slate-600 dark:group-hover:text-slate-300">
                  {label}
                  <SortIcon active={sortKey === key} dir={sortDir} />
                </span>
              </TableHead>
            ))}
            <TableHead className="px-6 hidden lg:table-cell text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Email</TableHead>
            <TableHead className="px-6 text-right text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="px-6 py-16 text-center">
                <iconify-icon icon="solar:users-group-rounded-linear" width="40" className="text-slate-300 dark:text-slate-600 block mx-auto mb-3" />
                <p className="text-sm text-slate-400 dark:text-slate-500">No employees match your search.</p>
                <button onClick={onReset} className="mt-2 text-xs text-[#364dff] hover:underline">Clear filters</button>
              </TableCell>
            </TableRow>
          ) : rows.map((emp) => (
            <TableRow key={emp.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 group">
              <TableCell className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className={AVATAR_COLORS[(emp.id - 1) % AVATAR_COLORS.length]}>
                      {getInitials(emp.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{emp.fullName}</span>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 text-slate-500 dark:text-slate-400">{emp.department}</TableCell>
              <TableCell className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">{emp.jobTitle}</TableCell>
              <TableCell className="px-6 py-4">
                {emp.status === 'ACTIVE' ? (
                  <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden xl:table-cell">{emp.createdBy}</TableCell>
              <TableCell className="px-6 py-4 text-slate-400 dark:text-slate-500 hidden xl:table-cell whitespace-nowrap">{formatDate(emp.createdAt)}</TableCell>
              <TableCell className="px-6 py-4 text-slate-400 dark:text-slate-500 hidden lg:table-cell">{emp.email}</TableCell>
              <TableCell className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(emp)}
                    title="Edit"
                    className="text-slate-400 hover:text-[#364dff] hover:bg-[#364dff]/10"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(emp)}
                    title="Delete"
                    className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {totalFiltered === 0 ? 'No results' : `Showing ${start}–${end} of ${totalFiltered}`}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
            <iconify-icon icon="solar:alt-arrow-left-linear" width="16" />
          </Button>
          {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                p === page
                  ? 'bg-[#364dff] text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
              )}
            >
              {p}
            </button>
          ))}
          <Button variant="ghost" size="icon-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            <iconify-icon icon="solar:alt-arrow-right-linear" width="16" />
          </Button>
        </div>
      </div>
    </div>
  );
}
