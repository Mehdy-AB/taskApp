import { Card, CardContent } from '@/components/ui/card';

interface Stats {
  total: number;
  active: number;
  inactive: number;
  departments: number;
  loading?: boolean;
}

const CARDS = [
  { key: 'total'       as const, label: 'Total',       icon: 'solar:users-group-rounded-linear', bg: 'bg-[#364dff]/10',                             color: 'text-[#364dff]'                          },
  { key: 'active'      as const, label: 'Active',      icon: 'solar:user-check-rounded-linear',  bg: 'bg-emerald-50 dark:bg-emerald-500/10',         color: 'text-emerald-600 dark:text-emerald-400'  },
  { key: 'inactive'    as const, label: 'Inactive',    icon: 'solar:user-cross-rounded-linear',  bg: 'bg-slate-100 dark:bg-slate-700/50',            color: 'text-slate-500 dark:text-slate-400'      },
  { key: 'departments' as const, label: 'Departments', icon: 'solar:buildings-linear',           bg: 'bg-violet-50 dark:bg-violet-500/10',           color: 'text-violet-600 dark:text-violet-400'    },
];

export function StatCards({ total, active, inactive, departments, loading }: Stats) {
  const values = { total, active, inactive, departments };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, icon, bg, color }) => (
        <Card key={key} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 ${bg} rounded-lg ${color} shrink-0`}>
                <iconify-icon icon={icon} width="20" />
              </div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</span>
            </div>
            {loading ? (
              <div className="h-8 w-14 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{values[key]}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
