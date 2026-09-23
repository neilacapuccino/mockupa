// zod schemas (rules for what the client is allowed to send)
import { z } from "zod";


// ========================================
// AUTH  (register and login use the same rules)
// ========================================

export const authBodySchema = z.object({
  email: z.email("Must be a valid email"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  body: authBodySchema,
});

export const loginSchema = z.object({
  body: authBodySchema,
});


// ========================================
// NOTES
// ========================================

export const noteBodySchema = z.object({
  title: z.string().min(1, "title is required"),
  content: z.string().min(1, "content is required"),
  is_pinned: z.boolean().optional().default(false),
});

export const createNoteSchema = z.object({
  body: noteBodySchema,
});

export const updateNoteSchema = z.object({
  body: noteBodySchema.partial(),

  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),
});
