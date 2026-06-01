import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Employee } from '@/src/lib/types/api';

interface Props {
  name: string;
  employees: Employee[];
}

const DEPT_ICONS: Record<string, string> = {
  Engineering: 'solar:code-linear',
  Marketing:   'solar:megaphone-linear',
  HR:          'solar:heart-pulse-linear',
  Finance:     'solar:chart-linear',
  Design:      'solar:palette-linear',
};

const DEPT_COLORS: Record<string, { bg: string; icon: string }> = {
  Engineering: { bg: 'bg-indigo-50',  icon: 'text-indigo-600' },
  Marketing:   { bg: 'bg-pink-50',    icon: 'text-pink-600'   },
  HR:          { bg: 'bg-rose-50',    icon: 'text-rose-600'   },
  Finance:     { bg: 'bg-emerald-50', icon: 'text-emerald-600'},
  Design:      { bg: 'bg-violet-50',  icon: 'text-violet-600' },
};

export function DepartmentCard({ name, employees }: Props) {
  const active   = employees.filter(e => e.status === 'ACTIVE').length;
  const inactive = employees.filter(e => e.status === 'INACTIVE').length;
  const colors   = DEPT_COLORS[name] ?? { bg: 'bg-slate-50', icon: 'text-slate-500' };
  const icon     = DEPT_ICONS[name] ?? 'solar:buildings-linear';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div className={`p-3 ${colors.bg} rounded-xl ${colors.icon}`}>
            <iconify-icon icon={icon} width="22" />
          </div>
          <Badge variant="secondary" className="text-xs">
            {employees.length} {employees.length === 1 ? 'member' : 'members'}
          </Badge>
        </div>
        <CardTitle className="mt-3 text-base text-slate-800">{name}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs text-slate-500">{active} active</span>
          </div>
          {inactive > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <span className="text-xs text-slate-500">{inactive} inactive</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
