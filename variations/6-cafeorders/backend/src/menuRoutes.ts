// menu routes
import { Router } from "express";
import { pool } from "./db";
import { validateResource } from "./validate";
import { availabilitySchema } from "./schemas";
import { authenticateToken } from "./authMiddleware";

const router = Router();


// ========================================
// GET THE MENU
// GET /api/menu
//
// Response 200: [ { "id": "...", "name": "Americano", "category": "coffee",
//                   "price": 120, "is_available": true }, ... ]
// ========================================

router.get("/", authenticateToken, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM menu_items
       ORDER BY category ASC, name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


// ========================================
// MARK AS SOLD OUT / BACK IN STOCK
// PATCH /api/menu/:id/availability
//
// Body JSON: { "is_available": false }   (false = sold out)
//
// Response 200: { ...the updated menu item }
// Response 404: { "error": "Menu item not found" }
// ========================================

router.patch(
  "/:id/availability",
  authenticateToken,
  validateResource(availabilitySchema),
  async (req, res) => {
    const { id } = req.params;
    const { is_available } = req.body;

    try {
      const result = await pool.query(
        `UPDATE menu_items
         SET is_available = $1
         WHERE id = $2
         RETURNING *`,
        [is_available, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Menu item not found",
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


export default router;
