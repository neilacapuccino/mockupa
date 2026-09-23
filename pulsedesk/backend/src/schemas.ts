// STEP 4 - zod schemas (rules for what the client is allowed to send)
import { z } from "zod";


// ========================================
// AUTH
// ========================================

export const authBodySchema = z.object({
  email: z.email("Must be a valid email"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export const authRequestSchema = z.object({
  body: authBodySchema,
});


// ========================================
// INCIDENTS  (STEP 6 - added when making incidentRoutes.ts)
// ========================================

export const incidentBodySchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required"),
  severity: z.enum(["low", "medium", "high", "critical"]).optional().default("low"),
  status: z.enum(["open", "in_progress", "resolved"]).optional().default("open"),
});

export const createIncidentSchema = z.object({
  body: incidentBodySchema,
});

export const updateIncidentSchema = z.object({
  body: incidentBodySchema.partial(),

  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),
});
