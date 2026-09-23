// zod schemas (rules for what the client is allowed to send)
import { z } from "zod";


// ========================================
// AUTH  (NEW: mobile number + "remember me")
// ========================================

export const loginSchema = z.object({
  body: z.object({
    // 09 then exactly 9 more digits -> "09171234567"
    mobile: z.string().regex(/^09\d{9}$/, "Mobile number must look like 09171234567"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    // a checkbox value: true / false (optional -> treated as false)
    remember_me: z.boolean().optional(),
  }),
});


// ========================================
// EVENTS
// ========================================

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(1, "title is required"),
    venue: z.string().min(1, "venue is required"),
    // what <input type="datetime-local"> gives: "2026-10-01T14:30" (no timezone -> local: true)
    starts_at: z.iso.datetime({ local: true, error: "starts_at must be a date and time" }),
    capacity: z.number().int("capacity must be a whole number").min(1, "capacity must be at least 1"),
  }),
});

export const eventIdSchema = z.object({
  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),
});
