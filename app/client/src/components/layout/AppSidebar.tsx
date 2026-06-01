'use client';

import { cn } from '@/lib/utils';

type View = 'dashboard' | 'departments';

interface Props {
  activeView: View;
  onViewChange: (v: View) => void;
  isOpen: boolean;
  onClose: () => void;
  totalEmployees: number;
  totalDepartments: number;
}

const NAV = [
  { view: 'dashboard'   as View, label: 'Dashboard',   icon: 'solar:home-2-linear' },
  { view: 'departments' as View, label: 'Departments',  icon: 'solar:buildings-linear' },
];

export function AppSidebar({ activeView, onViewChange, isOpen, onClose, totalEmployees, totalDepartments }: Props) {
  const badge: Record<View, number> = {
    dashboard:   totalEmployees,
    departments: totalDepartments,
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
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

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
          {NAV.map(({ view, label, icon }) => {
            const active = activeView === view;
            return (
              <button
                key={view}
                onClick={() => { onViewChange(view); onClose(); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                  active
                    ? 'bg-[#364dff]/10 text-[#364dff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 font-medium',
                )}
              >
                <iconify-icon icon={icon} width="18" />
                {label}
                <span className="ml-auto text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500">
                  {badge[view]}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User */}
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
    </>
  );
}
