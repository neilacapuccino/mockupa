// item routes - staff can view + change stock, only ADMINS can create / delete
import { Router } from "express";
import { pool } from "./db";
import { Item } from "./types";
import { validateResource } from "./validate";
import { createItemSchema, stockSchema } from "./schemas";
import { authenticateToken, requireAdmin } from "./authMiddleware";

const router = Router();


// ========================================
// GET ALL ITEMS                  (any logged-in user)
// GET /api/items
//
// Header: Authorization: Bearer <token>
//
// Response 200: [ { "id": "...", "name": "USB-C Cable", "sku": "CAB-001",
//                   "quantity": 25, "price": "9.99", "created_at": "..." } ]
//   (price is a STRING because the column is NUMERIC)
// ========================================

router.get("/", authenticateToken, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM items
       ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


// ========================================
// GET ONE ITEM                   (any logged-in user)
// GET /api/items/:id
//
// Response 200: { ...the item }
// Response 404: { "error": "Item not found" }
// ========================================

router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM items
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Item not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


// ========================================
// CREATE AN ITEM                 (ADMIN ONLY)
// POST /api/items
//
// middleware chain: authenticateToken -> requireAdmin -> validateResource -> handler
//
// Body JSON:
// { "name": "Keyboard", "sku": "KEY-001", "quantity": 10, "price": 39.99 }
//   quantity = optional (default 0)     price = required
//
// Response 201: { ...the new item }
// Response 403: { "error": "Admins only." }          <- logged in as staff
// Response 409: { "error": "SKU already exists" }    <- duplicate sku
// ========================================

router.post(
  "/",
  authenticateToken,
  requireAdmin,
  validateResource(createItemSchema),
  async (req, res) => {
    const { name, sku, quantity, price }: Item = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO items (name, sku, quantity, price)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, sku, quantity ?? 0, price]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error(error);

      // UNIQUE violation (same pattern as movieRoutes in practice-c)
      if (error.code === "23505") {
        return res.status(409).json({
          error: "SKU already exists",
        });
      }

      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);


// ========================================
// ADD / REMOVE STOCK             (any logged-in user)
// PATCH /api/items/:id/stock
//
// Body JSON:
// { "change": 5 }     -> add 5
// { "change": -3 }    -> remove 3
//
// Response 200: { ...the item with the new quantity }
// Response 400: { "error": "Not enough stock" }      <- would go below 0
// Response 404: { "error": "Item not found" }
// ========================================

router.patch(
  "/:id/stock",
  authenticateToken,
  validateResource(stockSchema),
  async (req, res) => {
    const { id } = req.params;
    const { change } = req.body;

    try {
      // 1. find the item
      const found = await pool.query(
        `SELECT * FROM items
         WHERE id = $1`,
        [id]
      );

      if (found.rows.length === 0) {
        return res.status(404).json({
          error: "Item not found",
        });
      }

      // 2. business rule: stock can't go below 0
      const newQuantity = found.rows[0].quantity + change;

      if (newQuantity < 0) {
        return res.status(400).json({
          error: "Not enough stock",
        });
      }

      // 3. save the new quantity
      const result = await pool.query(
        `UPDATE items
         SET quantity = $1
         WHERE id = $2
         RETURNING *`,
        [newQuantity, id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// DELETE AN ITEM                 (ADMIN ONLY)
// DELETE /api/items/:id
//
// Response 200: { ...the deleted item }
// Response 403: { "error": "Admins only." }
// Response 404: { "error": "Item not found" }
// ========================================

router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM items
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Item not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


export default router;
