'use client';

import { useState, useMemo } from 'react';
import type { Employee } from '@/src/lib/types/api';

const MOCK_EMPLOYEES: Employee[] = [
  { id: 1,  fullName: 'Alice Johnson',  email: 'alice.j@company.com',  department: 'Engineering', jobTitle: 'Senior Developer',   status: 'ACTIVE'   },
  { id: 2,  fullName: 'Bob Smith',       email: 'bob.s@company.com',     department: 'Marketing',   jobTitle: 'Marketing Manager',  status: 'ACTIVE'   },
  { id: 3,  fullName: 'Carol White',     email: 'carol.w@company.com',   department: 'HR',          jobTitle: 'HR Specialist',      status: 'INACTIVE' },
  { id: 4,  fullName: 'David Brown',     email: 'david.b@company.com',   department: 'Engineering', jobTitle: 'Frontend Developer', status: 'ACTIVE'   },
  { id: 5,  fullName: 'Emma Davis',      email: 'emma.d@company.com',    department: 'Design',      jobTitle: 'UI/UX Designer',     status: 'ACTIVE'   },
  { id: 6,  fullName: 'Frank Miller',    email: 'frank.m@company.com',   department: 'Finance',     jobTitle: 'Financial Analyst',  status: 'INACTIVE' },
  { id: 7,  fullName: 'Grace Wilson',    email: 'grace.w@company.com',   department: 'Engineering', jobTitle: 'Backend Developer',  status: 'ACTIVE'   },
  { id: 8,  fullName: 'Henry Taylor',    email: 'henry.t@company.com',   department: 'Marketing',   jobTitle: 'Content Strategist', status: 'ACTIVE'   },
  { id: 9,  fullName: 'Isla Martinez',   email: 'isla.m@company.com',    department: 'Finance',     jobTitle: 'Accountant',         status: 'ACTIVE'   },
  { id: 10, fullName: 'James Anderson',  email: 'james.a@company.com',   department: 'HR',          jobTitle: 'Talent Acquisition', status: 'ACTIVE'   },
  { id: 11, fullName: 'Karen Thomas',    email: 'karen.t@company.com',   department: 'Design',      jobTitle: 'Graphic Designer',   status: 'INACTIVE' },
  { id: 12, fullName: 'Liam Jackson',    email: 'liam.j@company.com',    department: 'Engineering', jobTitle: 'DevOps Engineer',    status: 'ACTIVE'   },
];

const DEPARTMENTS = ['Engineering', 'Marketing', 'HR', 'Finance', 'Design'];

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-600',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-rose-100 text-rose-600',
  'bg-violet-100 text-violet-600',
  'bg-cyan-100 text-cyan-600',
  'bg-orange-100 text-orange-600',
  'bg-sky-100 text-sky-600',
];

const PAGE_SIZE = 5;

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [search, setSearch]             = useState('');
  const [department, setDepartment]     = useState('');
  const [page, setPage]                 = useState(1);
  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_EMPLOYEES.filter(emp => {
      const matchSearch = !q || emp.fullName.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q);
      const matchDept   = !department || emp.department === department;
      return matchSearch && matchDept;
    });
  }, [search, department]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total:       MOCK_EMPLOYEES.length,
    active:      MOCK_EMPLOYEES.filter(e => e.status === 'ACTIVE').length,
    inactive:    MOCK_EMPLOYEES.filter(e => e.status === 'INACTIVE').length,
    departments: DEPARTMENTS.length,
  };

  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleDept   = (value: string) => { setDepartment(value); setPage(1); };
  const handleReset  = () => { setSearch(''); setDepartment(''); setPage(1); };
  const openCreate   = () => { setEditTarget(null); setShowModal(true); };
  const openEdit     = (emp: Employee) => { setEditTarget(emp); setShowModal(true); };

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-slate-800 flex">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shrink-0`}>

        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#364dff] to-[#667aff] flex items-center justify-center text-white shadow-md">
              <iconify-icon icon="solar:users-group-rounded-bold" width="16" />
            </div>
            <span className="font-bold text-sm text-slate-900 tracking-tight">
              Employee<span className="text-[#364dff]">Dir</span>
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Main</p>

          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#364dff]/10 text-[#364dff] font-semibold text-sm">
            <iconify-icon icon="solar:home-2-linear" width="18" />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 text-sm transition-colors">
            <iconify-icon icon="solar:users-group-rounded-linear" width="18" />
            Employees
            <span className="ml-auto text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500">{stats.total}</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 text-sm transition-colors">
            <iconify-icon icon="solar:buildings-linear" width="18" />
            Departments
            <span className="ml-auto text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500">{stats.departments}</span>
          </a>

          <p className="px-3 mt-6 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">System</p>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 text-sm transition-colors">
            <iconify-icon icon="solar:history-linear" width="18" />
            Activity Log
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 text-sm transition-colors">
            <iconify-icon icon="solar:settings-linear" width="18" />
            Settings
          </a>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <div className="w-8 h-8 rounded-full bg-[#364dff]/10 text-[#364dff] flex items-center justify-center text-xs font-bold shrink-0">AU</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">Admin User</p>
              <p className="text-[10px] text-slate-400 truncate">admin@company.com</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
              <iconify-icon icon="solar:logout-2-linear" width="16" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <iconify-icon icon="solar:hamburger-menu-linear" width="22" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">Employee Directory</h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">Manage your team members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors relative">
              <iconify-icon icon="solar:bell-bing-linear" width="20" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#364dff]/10 text-[#364dff] flex items-center justify-center text-xs font-bold cursor-pointer">AU</div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-5 md:p-7 space-y-5 overflow-y-auto">

          {/* Title + CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Team Members</h2>
              <p className="text-sm text-slate-500 mt-0.5">{stats.total} employees · {stats.departments} departments</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#364dff] text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:bg-[#2a3de0] hover:-translate-y-0.5 transition-all"
            >
              <iconify-icon icon="solar:add-circle-bold" width="18" />
              Add Employee
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total',       value: stats.total,      icon: 'solar:users-group-rounded-linear', bg: 'bg-[#364dff]/10', color: 'text-[#364dff]'  },
              { label: 'Active',      value: stats.active,     icon: 'solar:user-check-rounded-linear',  bg: 'bg-emerald-50',   color: 'text-emerald-600' },
              { label: 'Inactive',    value: stats.inactive,   icon: 'solar:user-cross-rounded-linear',  bg: 'bg-slate-100',    color: 'text-slate-500'  },
              { label: 'Departments', value: stats.departments, icon: 'solar:buildings-linear',           bg: 'bg-violet-50',    color: 'text-violet-600' },
            ].map(({ label, value, icon, bg, color }) => (
              <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 ${bg} rounded-lg ${color} shrink-0`}>
                    <iconify-icon icon={icon} width="20" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <iconify-icon
                icon="solar:magnifer-linear"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                width="16"
              />
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#364dff]/20 focus:border-[#364dff] transition-all"
              />
            </div>
            <select
              value={department}
              onChange={e => handleDept(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#364dff]/20 focus:border-[#364dff] transition-all"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {(search || department) && (
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Employee</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Department</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Role</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Email</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <iconify-icon icon="solar:users-group-rounded-linear" width="40" className="text-slate-300 block mx-auto mb-3" />
                        <p className="text-sm text-slate-400">No employees match your search.</p>
                        <button onClick={handleReset} className="mt-2 text-xs text-[#364dff] hover:underline">Clear filters</button>
                      </td>
                    </tr>
                  ) : paginated.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${AVATAR_COLORS[(emp.id - 1) % AVATAR_COLORS.length]}`}>
                            {getInitials(emp.fullName)}
                          </div>
                          <span className="font-medium text-slate-700 whitespace-nowrap">{emp.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{emp.department}</td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap hidden md:table-cell">{emp.jobTitle}</td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap hidden lg:table-cell">{emp.email}</td>
                      <td className="px-6 py-4">
                        {emp.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#364dff] hover:bg-[#364dff]/10 transition-colors"
                            title="Edit"
                          >
                            <iconify-icon icon="solar:pen-2-linear" width="16" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <iconify-icon icon="solar:trash-bin-trash-linear" width="16" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                {filtered.length === 0
                  ? 'No results'
                  : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <iconify-icon icon="solar:alt-arrow-left-linear" width="16" />
                </button>
                {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-[#364dff] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <iconify-icon icon="solar:alt-arrow-right-linear" width="16" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">
                {editTarget ? 'Edit Employee' : 'Add Employee'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <iconify-icon icon="solar:close-circle-linear" width="20" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name <span className="text-rose-400">*</span></label>
                <input type="text" defaultValue={editTarget?.fullName} placeholder="John Doe"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#364dff]/20 focus:border-[#364dff] transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email <span className="text-rose-400">*</span></label>
                <input type="email" defaultValue={editTarget?.email} placeholder="john@company.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#364dff]/20 focus:border-[#364dff] transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Department <span className="text-rose-400">*</span></label>
                  <select defaultValue={editTarget?.department ?? ''}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#364dff]/20 focus:border-[#364dff] transition-all">
                    <option value="">Select…</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Status <span className="text-rose-400">*</span></label>
                  <select defaultValue={editTarget?.status ?? 'ACTIVE'}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#364dff]/20 focus:border-[#364dff] transition-all">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Role / Job Title <span className="text-rose-400">*</span></label>
                <input type="text" defaultValue={editTarget?.jobTitle} placeholder="Software Engineer"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#364dff]/20 focus:border-[#364dff] transition-all" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button className="flex-1 py-2.5 rounded-xl bg-[#364dff] text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:bg-[#2a3de0] transition-all">
                {editTarget ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <iconify-icon icon="solar:trash-bin-trash-bold" width="26" className="text-rose-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Delete Employee</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-700">{deleteTarget.fullName}</span>?
              <br />This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-500/25 hover:bg-rose-600 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
