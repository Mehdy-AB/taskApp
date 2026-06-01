'use client';

import { useState, useMemo } from 'react';
import type { Employee } from '@/src/lib/types/api';
import { MOCK_EMPLOYEES, DEPARTMENTS, type SortKey, type SortDir } from '@/src/lib/mock-data';
import { AppSidebar }       from '@/src/components/layout/AppSidebar';
import { AppHeader }        from '@/src/components/layout/AppHeader';
import { StatCards }        from '@/src/components/employees/StatCards';
import { FilterBar }        from '@/src/components/employees/FilterBar';
import { EmployeeTable }    from '@/src/components/employees/EmployeeTable';
import { EmployeeFormModal } from '@/src/components/employees/EmployeeFormModal';
import { DeleteDialog }     from '@/src/components/employees/DeleteDialog';
import { DepartmentsView }  from '@/src/components/departments/DepartmentsView';

type View = 'dashboard' | 'departments';

const PAGE_SIZE = 5;

const VIEW_META: Record<View, { title: string; subtitle: string }> = {
  dashboard:   { title: 'Employee Directory', subtitle: 'Manage your team members' },
  departments: { title: 'Departments',         subtitle: 'Browse by department'      },
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView]               = useState<View>('dashboard');

  // filters
  const [search, setSearch]       = useState('');
  const [department, setDept]     = useState('');
  const [status, setStatus]       = useState('');
  const [sortKey, setSortKey]     = useState<SortKey>('fullName');
  const [sortDir, setSortDir]     = useState<SortDir>('asc');
  const [page, setPage]           = useState(1);

  // modals
  const [showModal, setShowModal]     = useState(false);
  const [editTarget, setEditTarget]   = useState<Employee | null>(null);
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
    departments: DEPARTMENTS.length,
  };

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const handleReset = () => { setSearch(''); setDept(''); setStatus(''); setPage(1); };

  const openCreate = () => { setEditTarget(null); setShowModal(true); };
  const openEdit   = (emp: Employee) => { setEditTarget(emp); setShowModal(true); };

  const meta = VIEW_META[view];

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-slate-800 flex">
      <AppSidebar
        activeView={view}
        onViewChange={v => { setView(v); setSidebarOpen(false); }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        totalEmployees={stats.total}
        totalDepartments={stats.departments}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          title={meta.title}
          subtitle={meta.subtitle}
        />

        <main className="flex-1 p-5 md:p-7 space-y-5 overflow-y-auto">
          {view === 'dashboard' && (
            <>
              {/* Page heading + add button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Team Members</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {stats.total} employees · {stats.departments} departments
                  </p>
                </div>
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#364dff] text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:bg-[#2a3de0] hover:-translate-y-0.5 transition-all"
                >
                  <iconify-icon icon="solar:add-circle-bold" width="18" />
                  Add Employee
                </button>
              </div>

              <StatCards {...stats} />

              <FilterBar
                search={search}
                department={department}
                status={status}
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
                onEdit={openEdit}
                onDelete={emp => setDeleteTarget(emp)}
                onReset={handleReset}
              />
            </>
          )}

          {view === 'departments' && <DepartmentsView employees={MOCK_EMPLOYEES} />}
        </main>
      </div>

      <EmployeeFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        employee={editTarget}
      />

      <DeleteDialog
        employee={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
