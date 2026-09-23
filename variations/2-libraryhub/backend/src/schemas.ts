// zod schemas (rules for what the client is allowed to send)
import { z } from "zod";


// ========================================
// AUTH
// ========================================

export const loginBodySchema = z.object({
  email: z.email("Must be a valid email"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  body: loginBodySchema,
});


// ========================================
// BOOKS
// ========================================

export const bookBodySchema = z.object({
  title: z.string().min(1, "title is required"),
  author: z.string().min(1, "author is required"),

  // z.number() -> the frontend must send 2008 (number), NOT "2008" (string)
  published_year: z
    .number()
    .int("year must be a whole number")
    .min(1450, "year is too old")
    .max(2100, "year is too far in the future"),
});

export const createBookSchema = z.object({
  body: bookBodySchema,
});

// NEW: checking the QUERY instead of the body
// GET /api/books?available=true
// query values are ALWAYS strings -> "true" / "false", never true / false
export const bookQuerySchema = z.object({
  query: z.object({
    available: z.enum(["true", "false"]).optional(),
  }),
});

// NEW: checking ONLY the params (borrow / return have no body)
export const bookIdSchema = z.object({
  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),
});
