'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { DEPARTMENTS } from '@/src/lib/mock-data';

interface Props {
  search: string;
  department: string;
  status: string;
  onSearch: (v: string) => void;
  onDepartment: (v: string) => void;
  onStatus: (v: string) => void;
  onReset: () => void;
}

const selectCls =
  'h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors';

export function FilterBar({ search, department, status, onSearch, onDepartment, onStatus, onReset }: Props) {
  const hasFilter = search !== '' || department !== '' || status !== '';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none size-3.5" />
        <Input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="pl-8"
        />
      </div>

      {/* Department filter */}
      <select
        value={department}
        onChange={e => onDepartment(e.target.value)}
        className={selectCls}
      >
        <option value="">All Departments</option>
        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
      </select>

      {/* Status filter */}
      <select
        value={status}
        onChange={e => onStatus(e.target.value)}
        className={selectCls}
      >
        <option value="">All Statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>

      {hasFilter && (
        <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5 h-8">
          <X className="size-3.5" />
          Reset
        </Button>
      )}
    </div>
  );
}
