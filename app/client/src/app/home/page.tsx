'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Sun, Moon, Plus, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import type { Employee, Department, CreateEmployeeRequest, UpdateEmployeeRequest, EmployeeStatus } from '@/src/lib/types/api';
import { employeesService, type EmployeeStats } from '@/src/api/employees/employees.service';
import { departmentsService } from '@/src/api/departments/departments.service';
import { type SortKey, type SortDir } from '@/src/lib/mock-data';
import { useDebounce } from '@/src/lib/use-debounce';
import { StatCards }         from '@/src/components/employees/StatCards';
import { FilterBar }         from '@/src/components/employees/FilterBar';
import { EmployeeTable }     from '@/src/components/employees/EmployeeTable';
import { EmployeeFormModal } from '@/src/components/employees/EmployeeFormModal';
import { DeleteDialog }      from '@/src/components/employees/DeleteDialog';
import { Button }               from '@/components/ui/button';
import { useTheme }             from '@/src/lib/use-theme';
import { ActivityLogSection }   from '@/src/components/activity/ActivityLogSection';

const PAGE_SIZE = 5;

function getInitials(email: string) {
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

function Spinner() {
  return (
    <div className="min-h-screen bg-[#F8F9FF] dark:bg-slate-950 flex items-center justify-center">
      <svg className="animate-spin size-8 text-[#364dff]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const { isDark, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState<'employees' | 'logs'>('employees');

  // ── filter / sort / page ──────────────────────────────────────────────────
  const [search, setSearch]   = useState('');        // immediate — from FilterBar
  const debouncedSearch       = useDebounce(search, 300); // triggers API
  const [department, setDept] = useState('');
  const [status2, setStatus2] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('fullName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage]       = useState(1);

  // ── server data ───────────────────────────────────────────────────────────
  const [employees, setEmployees]           = useState<Employee[]>([]);
  const [currentPageIds, setCurrentPageIds] = useState<number[]>([]);
  const [totalFiltered, setTotalFiltered]   = useState(0);
  const [totalPages, setTotalPages]         = useState(1);
  const [stats, setStats]               = useState<EmployeeStats>({ total: 0, active: 0, inactive: 0, departments: 0 });
  const [departments, setDepartments]   = useState<Department[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshKey, setRefreshKey]     = useState(0);

  // ── modal state ───────────────────────────────────────────────────────────
  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  // ── load departments + stats on mount ────────────────────────────────────
  useEffect(() => {
    if (status !== 'authenticated') return;
    setStatsLoading(true);
    Promise.all([departmentsService.list(), employeesService.stats()])
      .then(([depts, s]) => { setDepartments(depts); setStats(s); })
      .catch(() => toast.error('Failed to load dashboard data.'))
      .finally(() => setStatsLoading(false));
  }, [status, refreshKey]);

  // ── load employees when debounced search / other filters / page change ─────
  useEffect(() => {
    if (status !== 'authenticated') return;
    setTableLoading(true);
    employeesService.list({
      search:     debouncedSearch || undefined,
      department: department || undefined,
      status:     (status2   || undefined) as EmployeeStatus | undefined,
      sortBy:     sortKey,
      sortDir,
      page,
      pageSize:   PAGE_SIZE,
    })
      .then(res => {
        setCurrentPageIds(res.data.map(e => e.id));
        setEmployees(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const toAdd = res.data.filter(e => !existingIds.has(e.id));
          return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
        });
        setTotalFiltered(res.total);
        setTotalPages(res.totalPages);
      })
      .catch(() => toast.error('Failed to load employees.'))
      .finally(() => setTableLoading(false));
  }, [status, debouncedSearch, department, status2, sortKey, sortDir, page, refreshKey]);

  const triggerRefresh = useCallback(() => setRefreshKey(k => k + 1), []);

  // ── local filter while debounce is pending ────────────────────────────────
  // Immediately filter the already-loaded rows so the table responds to typing
  // before the API call fires. Once debouncedSearch catches up, the API result
  // (employees) takes over and this memo returns it unchanged.
  const isPending = search !== debouncedSearch;

  const displayRows = useMemo(() => {
    if (isPending && search) {
      const q = search.toLowerCase();
      return employees.filter(e =>
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q),
      );
    }
    const byId = new Map(employees.map(e => [e.id, e]));
    return currentPageIds.map(id => byId.get(id)).filter((e): e is Employee => !!e);
  }, [isPending, search, employees, currentPageIds]);

  const displayTotal = isPending ? displayRows.length : totalFiltered;
  const displayPages = isPending ? Math.max(1, Math.ceil(displayRows.length / PAGE_SIZE)) : totalPages;

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const handleReset = () => { setSearch(''); setDept(''); setStatus2(''); setPage(1); };

  const handleCreateDepartment = async (name: string): Promise<Department> => {
    try {
      const dept = await departmentsService.create({ name });
      setDepartments(prev => [...prev, dept]);
      toast.success(`Department "${dept.name}" created.`);
      return dept;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create department.');
      throw err;
    }
  };

  const handleSubmit = async (data: CreateEmployeeRequest | UpdateEmployeeRequest) => {
    if (editTarget) {
      await employeesService.update(editTarget.id, data as UpdateEmployeeRequest);
      toast.success('Employee updated successfully.');
    } else {
      await employeesService.create(data as CreateEmployeeRequest);
      toast.success('Employee created successfully.');
    }
    triggerRefresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await employeesService.remove(deleteTarget.id);
      toast.success(`${deleteTarget.fullName} was deleted.`);
      triggerRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete employee.');
      throw err;
    }
  };

  if (status === 'loading') return <Spinner />;

  const user     = session?.user;
  const isAdmin  = (user as any)?.role === 'ADMIN';
  const initials = user?.email ? getInitials(user.email) : '??';
  const userName = user?.email?.split('@')[0].replace(/[._]/g, ' ') ?? '';

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
              {initials}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-0 gap-0 overflow-hidden">
              <div className="px-4 py-3">
                <p className="text-sm font-semibold text-foreground capitalize">{userName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#364dff]/10 text-[#364dff]">
                  {(user as any)?.role}
                </span>
              </div>
              <Separator />
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
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

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
          {(['employees', 'logs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-[#364dff] text-[#364dff]'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'employees' ? 'Team Members' : 'Activity Log'}
            </button>
          ))}
        </div>

        {activeTab === 'employees' ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Team Members</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {stats.total} employees across {stats.departments} departments
                </p>
              </div>
              {isAdmin && (
                <Button
                  onClick={() => { setEditTarget(null); setShowModal(true); }}
                  className="gap-2 shadow-md shadow-primary/20"
                >
                  <Plus className="size-4" />
                  Add Employee
                </Button>
              )}
            </div>

            <StatCards
              total={stats.total}
              active={stats.active}
              inactive={stats.inactive}
              departments={stats.departments}
              loading={statsLoading}
            />

            <FilterBar
              search={search}
              department={department}
              status={status2}
              departments={departments.map(d => d.name)}
              onSearch={v => { setSearch(v); setPage(1); }}
              onDepartment={v => { setDept(v); setPage(1); }}
              onStatus={v => { setStatus2(v); setPage(1); }}
              onReset={handleReset}
            />

            <EmployeeTable
              rows={displayRows}
              totalFiltered={displayTotal}
              page={page}
              totalPages={displayPages}
              sortKey={sortKey}
              sortDir={sortDir}
              loading={tableLoading && !search}
              onSort={handleSort}
              onPageChange={setPage}
              onEdit={emp => { setEditTarget(emp); setShowModal(true); }}
              onDelete={emp => setDeleteTarget(emp)}
              onReset={handleReset}
            />
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Activity Log</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">All create, update, and delete events.</p>
            </div>
            <ActivityLogSection status={status} />
          </>
        )}
      </main>

      <EmployeeFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        employee={editTarget}
        departments={departments}
        onCreateDepartment={handleCreateDepartment}
        onSubmit={handleSubmit}
      />

      <DeleteDialog
        employee={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
