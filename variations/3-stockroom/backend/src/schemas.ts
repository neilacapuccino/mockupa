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
// ITEMS
// ========================================

export const itemBodySchema = z.object({
  name: z.string().min(1, "name is required"),
  sku: z.string().min(1, "sku is required"),

  // numbers -> the frontend must send numbers, not strings
  quantity: z.number().int("quantity must be a whole number").min(0, "quantity can't be negative").optional().default(0),
  price: z.number().min(0, "price can't be negative"),
});

export const createItemSchema = z.object({
  body: itemBodySchema,
});

// PATCH /api/items/:id/stock
// body: { "change": 5 }  (add 5)   or   { "change": -3 }  (remove 3)
export const stockSchema = z.object({
  body: z.object({
    change: z.number().int("change must be a whole number"),
  }),

  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),
});
