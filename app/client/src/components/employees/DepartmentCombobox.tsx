'use client';

import { useState } from 'react';
import { Search, ChevronDown, Check, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (v: string) => void;
  departments: string[];
  onCreateDepartment?: (name: string) => void;
  placeholder?: string;
}

export function DepartmentCombobox({
  value,
  onChange,
  departments,
  onCreateDepartment,
  placeholder = 'All Departments',
}: Props) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');

  const q       = query.trim();
  const options = ['', ...departments] as string[];
  const visible = options.filter(d =>
    (d || placeholder).toLowerCase().includes(q.toLowerCase()),
  );
  const canCreate =
    !!onCreateDepartment &&
    q.length > 0 &&
    !departments.some(d => d.toLowerCase() === q.toLowerCase());

  const handleSelect = (dept: string) => {
    onChange(dept);
    setOpen(false);
    setQuery('');
  };

  const handleCreate = () => {
    if (!onCreateDepartment || !q) return;
    onCreateDepartment(q);
    onChange(q);
    setOpen(false);
    setQuery('');
  };

  return (
    <Popover open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) setQuery(''); }}>
      <PopoverTrigger className="h-8 inline-flex items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors hover:bg-muted/30 data-open:border-ring whitespace-nowrap">
        {value || placeholder}
        <ChevronDown className="size-3.5 text-muted-foreground shrink-0 ml-1" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-56 p-2 gap-0">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="pl-6 h-7 text-xs"
            autoFocus
          />
        </div>

        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {visible.map(dept => (
            <button
              key={dept || '__all'}
              onClick={() => handleSelect(dept)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors text-left',
                value === dept && 'bg-primary/10 text-primary font-medium',
              )}
            >
              <Check className={cn('size-3.5 shrink-0', value === dept ? 'opacity-100 text-primary' : 'opacity-0')} />
              {dept || placeholder}
            </button>
          ))}

          {visible.length === 0 && !canCreate && (
            <p className="text-xs text-muted-foreground text-center py-3">No departments found</p>
          )}

          {canCreate && (
            <>
              {visible.length > 0 && <div className="my-1 h-px bg-border" />}
              <button
                onClick={handleCreate}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-primary/10 text-primary transition-colors text-left font-medium"
              >
                <Plus className="size-3.5 shrink-0" />
                Create &ldquo;{q}&rdquo;
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
