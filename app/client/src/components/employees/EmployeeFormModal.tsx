'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DepartmentCombobox } from './DepartmentCombobox';
import { employeeFormSchema, type EmployeeFormValues } from '@/src/lib/validations';
import type { Employee, Department, CreateEmployeeRequest, UpdateEmployeeRequest, EmployeeStatus } from '@/src/lib/types/api';

interface Props {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  departments: Department[];
  onCreateDepartment: (name: string) => Promise<Department>;
  onSubmit: (data: CreateEmployeeRequest | UpdateEmployeeRequest) => Promise<void>;
}

const labelCls = 'block text-xs font-semibold text-muted-foreground mb-1.5';
const errorCls = 'mt-1 text-[11px] text-destructive';

export function EmployeeFormModal({ open, onClose, employee, departments, onCreateDepartment, onSubmit }: Props) {
  const isEdit = employee !== null;

  const [localDepts, setLocalDepts] = useState<Department[]>(departments);
  const [apiError, setApiError]     = useState('');
  const [loading, setLoading]       = useState(false);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: { fullName: '', email: '', department: '', jobTitle: '', status: 'ACTIVE' },
  });

  // Sync departments list from parent
  useEffect(() => { setLocalDepts(departments); }, [departments]);

  // Reset form whenever the modal opens or the target employee changes
  useEffect(() => {
    form.reset({
      fullName:   employee?.fullName   ?? '',
      email:      employee?.email      ?? '',
      department: employee?.department ?? '',
      jobTitle:   employee?.jobTitle   ?? '',
      status:    (employee?.status     ?? 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
    });
    setApiError('');
  }, [employee, open]);

  const handleCreateDept = async (name: string) => {
    const dept = await onCreateDepartment(name);
    setLocalDepts(prev => [...prev, dept]);
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    const dept = localDepts.find(d => d.name === values.department);
    if (!dept) {
      form.setError('department', { message: 'Department not found — try selecting again.' });
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      if (isEdit) {
        const patch: UpdateEmployeeRequest = {};
        if (values.fullName  !== employee.fullName)      patch.fullName     = values.fullName;
        if (values.email     !== employee.email)         patch.email        = values.email;
        if (dept.id          !== employee.departmentId)  patch.departmentId = dept.id;
        if (values.jobTitle  !== employee.jobTitle)      patch.jobTitle     = values.jobTitle;
        if (values.status    !== employee.status)        patch.status       = values.status as EmployeeStatus;
        await onSubmit(patch);
      } else {
        await onSubmit({
          fullName:     values.fullName,
          email:        values.email,
          departmentId: dept.id,
          jobTitle:     values.jobTitle,
          status:       values.status as EmployeeStatus,
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={isOpen => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {apiError && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{apiError}</p>
          )}

          {/* Full name */}
          <div>
            <label className={labelCls}>Full Name <span className="text-destructive">*</span></label>
            <Input {...form.register('fullName')} placeholder="John Doe" />
            {form.formState.errors.fullName && (
              <p className={errorCls}>{form.formState.errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>Email <span className="text-destructive">*</span></label>
            <Input type="email" {...form.register('email')} placeholder="john@company.com" />
            {form.formState.errors.email && (
              <p className={errorCls}>{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Department + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Department <span className="text-destructive">*</span></label>
              <Controller
                name="department"
                control={form.control}
                render={({ field }) => (
                  <DepartmentCombobox
                    value={field.value}
                    onChange={field.onChange}
                    departments={localDepts.map(d => d.name)}
                    onCreateDepartment={handleCreateDept}
                    placeholder="Select department…"
                  />
                )}
              />
              {form.formState.errors.department && (
                <p className={errorCls}>{form.formState.errors.department.message}</p>
              )}
            </div>

            <div>
              <label className={labelCls}>Status <span className="text-destructive">*</span></label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Job title */}
          <div>
            <label className={labelCls}>Job Title <span className="text-destructive">*</span></label>
            <Input {...form.register('jobTitle')} placeholder="Software Engineer" />
            {form.formState.errors.jobTitle && (
              <p className={errorCls}>{form.formState.errors.jobTitle.message}</p>
            )}
          </div>
        </form>

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
