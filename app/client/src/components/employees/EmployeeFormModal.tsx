'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DepartmentCombobox } from './DepartmentCombobox';
import type { Employee } from '@/src/lib/types/api';

interface Props {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  departments: string[];
  onCreateDepartment: (name: string) => void;
}

const selectCls =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors';

const labelCls = 'block text-xs font-semibold text-muted-foreground mb-1.5';

export function EmployeeFormModal({ open, onClose, employee, departments, onCreateDepartment }: Props) {
  const isEdit = employee !== null;

  const [form, setForm] = useState({
    fullName:   '',
    email:      '',
    department: '',
    jobTitle:   '',
    status:     'ACTIVE',
  });

  useEffect(() => {
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

  return (
    <Dialog open={open} onOpenChange={isOpen => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
                departments={departments}
                onCreateDepartment={onCreateDepartment}
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
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
