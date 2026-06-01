import { z } from "zod";

export const employeeSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    departmentId: z.string().min(1, "Department is required"),
    role: z.string().min(1, "Role is required"),
    status: z.enum(["ACTIVE", "INACTIVE"]),
});
