'use client';

import { useState, useMemo } from 'react';
import { Sun, Moon, Plus, LogOut } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import type { Employee } from '@/src/lib/types/api';
import { MOCK_EMPLOYEES, DEPARTMENTS, type SortKey, type SortDir } from '@/src/lib/mock-data';
import { StatCards }         from '@/src/components/employees/StatCards';
import { FilterBar }         from '@/src/components/employees/FilterBar';
import { EmployeeTable }     from '@/src/components/employees/EmployeeTable';
import { EmployeeFormModal } from '@/src/components/employees/EmployeeFormModal';
import { DeleteDialog }      from '@/src/components/employees/DeleteDialog';
import { Button }            from '@/components/ui/button';
import { useTheme }          from '@/src/lib/use-theme';

const PAGE_SIZE = 5;

export default function HomePage() {
  const { isDark, toggle } = useTheme();

  // Departments can grow when user creates new ones in the modal
  const [departments, setDepartments] = useState<string[]>([...DEPARTMENTS]);

  const [search, setSearch]   = useState('');
  const [department, setDept] = useState('');
  const [status, setStatus]   = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('fullName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage]       = useState(1);

  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = MOCK_EMPLOYEES.filter(emp => {
      const matchSearch = !q || emp.fullName.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q);
      const matchDept   = !department || emp.department === department;
      const matchStatus = !status || emp.status === status;
      return matchSearch && matchDept && matchStatus;
    });
    result.sort((a, b) => {
      const av = a[sortKey].toLowerCase();
      const bv = b[sortKey].toLowerCase();
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return result;
  }, [search, department, status, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total:       MOCK_EMPLOYEES.length,
    active:      MOCK_EMPLOYEES.filter(e => e.status === 'ACTIVE').length,
    inactive:    MOCK_EMPLOYEES.filter(e => e.status === 'INACTIVE').length,
    departments: departments.length,
  };

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const handleReset = () => { setSearch(''); setDept(''); setStatus(''); setPage(1); };

  const handleAddDepartment = (name: string) => {
    setDepartments(prev => prev.includes(name) ? prev : [...prev, name]);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] dark:bg-slate-950 transition-colors">
      {/* Top bar */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#364dff] to-[#667aff] flex items-center justify-center text-white shadow-sm shrink-0">
            <iconify-icon icon="solar:users-group-rounded-bold" width="14" />
          </div>
          <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
            Employee<span className="text-[#364dff]">Dir</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            suppressHydrationWarning
            onClick={toggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <Popover>
            <PopoverTrigger className="w-8 h-8 rounded-full bg-[#364dff]/10 text-[#364dff] flex items-center justify-center text-xs font-bold select-none hover:bg-[#364dff]/20 transition-colors outline-none">
              AU
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-0 gap-0 overflow-hidden">
              {/* User info */}
              <div className="px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Admin User</p>
                <p className="text-xs text-muted-foreground mt-0.5">admin@company.com</p>
              </div>
              <Separator />
              {/* Logout */}
              <button
                onClick={() => { /* Phase 3: signOut() */ }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="size-3.5" />
                Log out
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Team Members</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {stats.total} employees across {departments.length} departments
            </p>
          </div>
          <Button
            onClick={() => { setEditTarget(null); setShowModal(true); }}
            className="gap-2 shadow-md shadow-primary/20"
          >
            <Plus className="size-4" />
            Add Employee
          </Button>
        </div>

        <StatCards {...stats} />

        <FilterBar
          search={search}
          department={department}
          status={status}
          departments={departments}
          onSearch={v => { setSearch(v); setPage(1); }}
          onDepartment={v => { setDept(v); setPage(1); }}
          onStatus={v => { setStatus(v); setPage(1); }}
          onReset={handleReset}
        />

        <EmployeeTable
          rows={paginated}
          totalFiltered={filtered.length}
          page={page}
          totalPages={totalPages}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onPageChange={setPage}
          onEdit={emp => { setEditTarget(emp); setShowModal(true); }}
          onDelete={emp => setDeleteTarget(emp)}
          onReset={handleReset}
        />
      </main>

      <EmployeeFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        employee={editTarget}
        departments={departments}
        onCreateDepartment={handleAddDepartment}
      />

      <DeleteDialog
        employee={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
