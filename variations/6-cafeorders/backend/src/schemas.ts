// zod schemas (rules for what the client is allowed to send)
import { z } from "zod";

const statusEnum = z.enum(["pending", "preparing", "ready", "completed", "cancelled"]);


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
// MENU
// ========================================

// PATCH /api/menu/:id/availability   body: { "is_available": false }
export const availabilitySchema = z.object({
  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),

  body: z.object({
    is_available: z.boolean(),
  }),
});


// ========================================
// ORDERS
// ========================================

// GET /api/orders?status=pending
export const orderQuerySchema = z.object({
  query: z.object({
    status: statusEnum.optional(),
  }),
});

// NEW: the body has an ARRAY of objects
// {
//   "customer_name": "Juan",
//   "items": [ { "menu_item_id": "...", "quantity": 2 }, { "menu_item_id": "...", "quantity": 1 } ]
// }
export const createOrderSchema = z.object({
  body: z.object({
    customer_name: z.string().min(1, "customer_name is required"),

    items: z
      .array(
        z.object({
          menu_item_id: z.uuid("menu_item_id must be a valid id"),
          quantity: z.number().int().min(1, "quantity must be at least 1").max(20, "max 20 of one item"),
        })
      )
      .min(1, "An order needs at least 1 item"),
  }),
});

// PATCH /api/orders/:id/status   body: { "status": "preparing" }
export const orderStatusSchema = z.object({
  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),

  body: z.object({
    status: statusEnum,
  }),
});
