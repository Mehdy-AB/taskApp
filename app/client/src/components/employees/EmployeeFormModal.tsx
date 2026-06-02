'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DepartmentCombobox } from './DepartmentCombobox';
import type { Employee, Department, CreateEmployeeRequest, UpdateEmployeeRequest, EmployeeStatus } from '@/src/lib/types/api';

interface Props {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  departments: Department[];
  onCreateDepartment: (name: string) => Promise<Department>;
  onSubmit: (data: CreateEmployeeRequest | UpdateEmployeeRequest) => Promise<void>;
}

const selectCls =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors';

const labelCls = 'block text-xs font-semibold text-muted-foreground mb-1.5';

export function EmployeeFormModal({ open, onClose, employee, departments, onCreateDepartment, onSubmit }: Props) {
  const isEdit = employee !== null;

  const [localDepts, setLocalDepts] = useState<Department[]>(departments);
  const [form, setForm] = useState({ fullName: '', email: '', department: '', jobTitle: '', status: 'ACTIVE' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => { setLocalDepts(departments); }, [departments]);

  useEffect(() => {
    setError('');
    setForm({
      fullName:   employee?.fullName   ?? '',
      email:      employee?.email      ?? '',
      department: employee?.department ?? '',
      jobTitle:   employee?.jobTitle   ?? '',
      status:     employee?.status     ?? 'ACTIVE',
    });
  }, [employee, open]);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleCreateDept = async (name: string) => {
    const dept = await onCreateDepartment(name);
    setLocalDepts(prev => [...prev, dept]);
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.department || !form.jobTitle.trim()) {
      setError('All fields are required.');
      return;
    }
    const dept = localDepts.find(d => d.name === form.department);
    if (!dept) {
      setError('Selected department not found.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        const patch: UpdateEmployeeRequest = {};
        if (form.fullName  !== employee.fullName)  patch.fullName     = form.fullName;
        if (form.email     !== employee.email)     patch.email        = form.email;
        if (dept.id        !== employee.departmentId) patch.departmentId = dept.id;
        if (form.jobTitle  !== employee.jobTitle)  patch.jobTitle     = form.jobTitle;
        if (form.status    !== employee.status)    patch.status       = form.status as EmployeeStatus;
        await onSubmit(patch);
      } else {
        await onSubmit({
          fullName:     form.fullName,
          email:        form.email,
          departmentId: dept.id,
          jobTitle:     form.jobTitle,
          status:       form.status as EmployeeStatus,
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div>
            <label className={labelCls}>Full Name <span className="text-rose-400">*</span></label>
            <Input value={form.fullName} onChange={set('fullName')} placeholder="John Doe" />
          </div>

          <div>
            <label className={labelCls}>Email <span className="text-rose-400">*</span></label>
            <Input type="email" value={form.email} onChange={set('email')} placeholder="john@company.com" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Department <span className="text-rose-400">*</span></label>
              <DepartmentCombobox
                value={form.department}
                onChange={dept => setForm(f => ({ ...f, department: dept }))}
                departments={localDepts.map(d => d.name)}
                onCreateDepartment={handleCreateDept}
                placeholder="Select department…"
              />
            </div>
            <div>
              <label className={labelCls}>Status <span className="text-rose-400">*</span></label>
              <select value={form.status} onChange={set('status')} className={selectCls}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Job Title <span className="text-rose-400">*</span></label>
            <Input value={form.jobTitle} onChange={set('jobTitle')} placeholder="Software Engineer" />
          </div>
        </div>

        <DialogFooter showCloseButton={false}>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
