import { z } from 'zod';

export const employeeFormSchema = z.object({
  fullName:   z.string().min(2, 'At least 2 characters'),
  email:      z.email('Valid email required'),
  department: z.string().min(1, 'Select a department'),
  jobTitle:   z.string().min(2, 'At least 2 characters'),
  status:     z.enum(['ACTIVE', 'INACTIVE']),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
