'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { DepartmentCombobox } from './DepartmentCombobox';

interface Props {
  search: string;
  department: string;
  status: string;
  departments: string[];
  onSearch: (v: string) => void;
  onDepartment: (v: string) => void;
  onStatus: (v: string) => void;
  onReset: () => void;
}

export function FilterBar({ search, department, status, departments, onSearch, onDepartment, onStatus, onReset }: Props) {
  const [inputValue, setInputValue] = useState(search);

  // Clear input when parent resets
  useEffect(() => { if (search === '') setInputValue(''); }, [search]);

  const handleInput = (v: string) => {
    setInputValue(v);
    onSearch(v); // fires immediately — parent owns the debounce
  };

  const hasFilter = inputValue !== '' || department !== '' || status !== '';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none size-3.5" />
        <Input
          value={inputValue}
          onChange={e => handleInput(e.target.value)}
          placeholder="Search by name or email…"
          className="pl-8"
        />
      </div>

      <DepartmentCombobox
        value={department}
        onChange={onDepartment}
        departments={departments}
      />

      <Select value={status || 'all'} onValueChange={v => onStatus(!v || v === 'all' ? '' : v)}>
        <SelectTrigger className="h-8 w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {hasFilter && (
        <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5 h-8">
          <X className="size-3.5" />
          Reset
        </Button>
      )}
    </div>
  );
}
