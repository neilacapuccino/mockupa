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
// PROJECTS
// ========================================

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, "name is required"),
    description: z.string().optional(),
    // NEW: a date string like "2026-10-15" (what <input type="date"> gives you)
    deadline: z.iso.date("deadline must look like 2026-10-15").optional(),
  }),
});

// reused by GET /api/projects/:id and DELETE /api/projects/:id
export const projectIdSchema = z.object({
  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),
});


// ========================================
// TASKS
// ========================================

// POST /api/projects/:projectId/tasks  -> checks the URL param AND the body
export const createTaskSchema = z.object({
  params: z.object({
    projectId: z.uuid("projectId must be a valid id"),
  }),

  body: z.object({
    title: z.string().min(1, "title is required"),
    priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),

  body: z.object({
    title: z.string().min(1, "title can't be empty").optional(),
    status: z.enum(["todo", "doing", "done"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
  }),
});
