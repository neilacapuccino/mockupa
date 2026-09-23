// zod schemas (rules for what the client is allowed to send)
import { z } from "zod";


// ========================================
// AUTH
// ========================================

export const loginSchema = z.object({
  body: z.object({
    email: z.email("Must be a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});


// ========================================
// EMPLOYEES
// ========================================

// a LOT of fields -> same idea as before, just longer
export const employeeBodySchema = z.object({
  first_name: z.string().min(1, "first_name is required"),
  last_name: z.string().min(1, "last_name is required"),
  email: z.email("Must be a valid email"),
  phone: z.string().optional(),
  department_id: z.uuid("department_id must be a valid id").optional(),
  position: z.string().min(1, "position is required"),
  employment_type: z.enum(["full_time", "part_time", "contract"]).optional().default("full_time"),
  salary: z.number().int("salary must be a whole number").min(0, "salary can't be negative"),
  hire_date: z.iso.date("hire_date must look like 2024-01-31"),
});

export const createEmployeeSchema = z.object({
  body: employeeBodySchema,
});

export const updateEmployeeSchema = z.object({
  body: employeeBodySchema.partial(),

  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),
});

export const employeeIdSchema = z.object({
  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),
});

// NEW: MANY query params, all optional
// GET /api/employees?search=ana&department_id=...&status=active&sort=salary&order=desc&page=2&limit=5
// (remember: query values are always STRINGS)
export const employeeQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    department_id: z.uuid("department_id must be a valid id").optional(),
    status: z.enum(["active", "inactive", "all"]).optional(),
    // only these columns can be used for sorting (so nobody can inject SQL through ?sort=)
    sort: z.enum(["last_name", "salary", "hire_date"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
    page: z.string().regex(/^\d+$/, "page must be a number").optional(),
    limit: z.string().regex(/^\d+$/, "limit must be a number").optional(),
  }),
});
