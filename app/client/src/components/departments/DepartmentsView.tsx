import { DepartmentCard } from './DepartmentCard';
import { DEPARTMENTS } from '@/src/lib/mock-data';
import type { Employee } from '@/src/lib/types/api';

interface Props {
  employees: Employee[];
}

export function DepartmentsView({ employees }: Props) {
  const byDept = Object.fromEntries(
    DEPARTMENTS.map(d => [d, employees.filter(e => e.department === d)])
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Departments</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {DEPARTMENTS.length} departments · {employees.length} employees total
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEPARTMENTS.map(name => (
          <DepartmentCard key={name} name={name} employees={byDept[name] ?? []} />
        ))}
      </div>
    </div>
  );
}
