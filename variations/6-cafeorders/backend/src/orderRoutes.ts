// order routes - orders with MANY items, server-side total, status workflow
import { Router } from "express";
import { JwtPayload } from "jsonwebtoken";
import { pool } from "./db";
import { OrderLine } from "./types";
import { validateResource } from "./validate";
import { orderQuerySchema, createOrderSchema, orderStatusSchema } from "./schemas";
import { authenticateToken } from "./authMiddleware";

const router = Router();

// NEW: the status "rules" - which status is allowed to come NEXT
const ALLOWED_NEXT: Record<string, string[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],   // finished -> can't change anymore
  cancelled: [],
};


// helper: give every order its "items" list
// (1 query for ALL the items, then match them to their order with filter)
const attachItems = async (orders: any[]) => {
  if (orders.length === 0) return [];

  const ids = orders.map((order) => order.id);

  // JOIN menu_items to get the NAME of each item
  // ANY($1) = "order_id is one of the ids in this array"
  const itemResult = await pool.query(
    `SELECT oi.*, m.name
     FROM order_items oi
     JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE oi.order_id = ANY($1)`,
    [ids]
  );

  return orders.map((order) => ({
    ...order,
    items: itemResult.rows.filter((item) => item.order_id === order.id),
  }));
};


// ========================================
// GET ORDERS (optional status filter)
// GET /api/orders
// GET /api/orders?status=pending
//
// Response 200:
// [ { "id": "...", "customer_name": "Juan", "status": "pending", "total": 335, "created_at": "...",
//     "items": [ { "name": "Americano", "quantity": 2, "price_each": 120, ... },
//                { "name": "Croissant", "quantity": 1, "price_each": 95, ... } ] } ]
// ========================================

router.get(
  "/",
  authenticateToken,
  validateResource(orderQuerySchema),
  async (req, res) => {
    const { status } = req.query;

    try {
      let queryText = "SELECT * FROM orders";
      const queryParams: string[] = [];

      if (typeof status === "string") {
        queryText += " WHERE status = $1";
        queryParams.push(status);
      }

      queryText += " ORDER BY created_at DESC";

      const result = await pool.query(queryText, queryParams);

      res.json(await attachItems(result.rows));
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// PLACE AN ORDER
// POST /api/orders
//
// Body JSON:
// {
//   "customer_name": "Ana",
//   "items": [
//     { "menu_item_id": "<id of Americano>", "quantity": 2 },
//     { "menu_item_id": "<id of Croissant>", "quantity": 1 }
//   ]
// }
// NO prices in the body -> the SERVER looks them up (never trust prices from the client)
//
// Response 201: { ...the new order with "total" and "items" }
// Response 400: { "error": "Blueberry Muffin is sold out" }
// ========================================

router.post(
  "/",
  authenticateToken,
  validateResource(createOrderSchema),
  async (req, res) => {
    const userId = (req.user as JwtPayload).userId;
    const { customer_name, items }: { customer_name: string; items: OrderLine[] } = req.body;

    try {
      // 1. get every menu item in this order with ONE query
      const ids = items.map((item) => item.menu_item_id);

      const menuResult = await pool.query(
        `SELECT * FROM menu_items
         WHERE id = ANY($1)`,
        [ids]
      );

      // 2. check every line + add up the total using the DATABASE prices
      let total = 0;

      for (const item of items) {
        const menuItem = menuResult.rows.find((m) => m.id === item.menu_item_id);

        if (!menuItem) {
          return res.status(400).json({
            error: "A menu item in this order doesn't exist",
          });
        }

        if (!menuItem.is_available) {
          return res.status(400).json({
            error: `${menuItem.name} is sold out`,
          });
        }

        total += menuItem.price * item.quantity;
      }

      // 3. save the order
      const orderResult = await pool.query(
        `INSERT INTO orders (customer_name, total, created_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [customer_name, total, userId]
      );

      const order = orderResult.rows[0];

      // 4. save every line into order_items
      for (const item of items) {
        const menuItem = menuResult.rows.find((m) => m.id === item.menu_item_id);

        await pool.query(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, price_each)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.menu_item_id, item.quantity, menuItem.price]
        );
      }

      // 5. send it back with its items (same shape as GET)
      const [fullOrder] = await attachItems([order]);

      res.status(201).json(fullOrder);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// CHANGE AN ORDER'S STATUS
// PATCH /api/orders/:id/status
//
// Body JSON: { "status": "preparing" }
//
// RULES (ALLOWED_NEXT at the top):
//   pending   -> preparing or cancelled
//   preparing -> ready or cancelled
//   ready     -> completed
//   completed / cancelled -> nothing (finished)
//
// Response 200: { ...the order with its items }
// Response 400: { "error": "Can't change an order from \"ready\" to \"pending\"" }
// Response 404: { "error": "Order not found" }
// ========================================

router.patch(
  "/:id/status",
  authenticateToken,
  validateResource(orderStatusSchema),
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
      const found = await pool.query(
        `SELECT * FROM orders
         WHERE id = $1`,
        [id]
      );

      if (found.rows.length === 0) {
        return res.status(404).json({
          error: "Order not found",
        });
      }

      // is the new status in the list of allowed next statuses?
      const current = found.rows[0].status;
      const allowed = ALLOWED_NEXT[current] || [];

      if (!allowed.includes(status)) {
        return res.status(400).json({
          error: `Can't change an order from "${current}" to "${status}"`,
        });
      }

      const result = await pool.query(
        `UPDATE orders
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );

      const [fullOrder] = await attachItems(result.rows);

      res.json(fullOrder);
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// DELETE AN ORDER
// DELETE /api/orders/:id
//
// CONDITION: only CANCELLED orders can be deleted
//
// Response 200: { ...the deleted order }   (its order_items are deleted too - CASCADE)
// Response 404: { "error": "Order not found" }
// Response 409: { "error": "Only cancelled orders can be deleted" }
// ========================================

router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const found = await pool.query(
      `SELECT * FROM orders
       WHERE id = $1`,
      [id]
    );

    if (found.rows.length === 0) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    if (found.rows[0].status !== "cancelled") {
      return res.status(409).json({
        error: "Only cancelled orders can be deleted",
      });
    }

    const result = await pool.query(
      `DELETE FROM orders
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


export default router;
