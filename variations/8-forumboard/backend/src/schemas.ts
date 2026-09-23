// zod schemas (rules for what the client is allowed to send)
import { z } from "zod";


// ========================================
// AUTH
// ========================================

export const registerSchema = z.object({
  body: z.object({
    // regex: only letters, numbers and _ , from 3 to 20 characters
    username: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/, "Username must be 3-20 letters, numbers or _"),
    display_name: z.string().min(1, "display_name is required").max(50, "display_name is too long"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    // checked against "password" inside the route
    confirm_password: z.string().min(1, "Please confirm your password"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, "username is required"),
    password: z.string().min(1, "password is required"),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    current_password: z.string().min(1, "current_password is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
  }),
});


// ========================================
// POSTS
// ========================================

export const postBodySchema = z.object({
  title: z.string().min(1, "title is required").max(150, "title is too long"),
  body: z.string().min(1, "body is required"),
});

export const createPostSchema = z.object({
  body: postBodySchema,
});

export const updatePostSchema = z.object({
  body: postBodySchema.partial(),

  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),
});
