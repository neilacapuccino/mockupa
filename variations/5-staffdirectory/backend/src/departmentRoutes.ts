// department routes (just a list - used to fill the dropdowns)
import { Router } from "express";
import { pool } from "./db";
import { authenticateToken } from "./authMiddleware";

const router = Router();


// ========================================
// GET ALL DEPARTMENTS
// GET /api/departments
//
// Response 200: [ { "id": "...", "name": "Design" }, { "id": "...", "name": "Engineering" }, ... ]
// ========================================

router.get("/", authenticateToken, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM departments
       ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


export default router;
