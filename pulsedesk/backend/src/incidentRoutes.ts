// STEP 6 - incident routes (CRUD) - every route needs a token
import { Router } from "express";
import { pool } from "./db";
import { Incident } from "./types";
import { validateResource } from "./validate";
import { createIncidentSchema, updateIncidentSchema } from "./schemas";
import { authenticateToken } from "./authMiddleware";

const router = Router();


// ========================================
// GET ALL INCIDENTS
// GET /api/incidents
//
// Header: Authorization: Bearer <token>
//
// Response 200:
// [ { "id": "7c9e...", "title": "Printer offline", "description": "...",
//     "severity": "low", "status": "open", "created_at": "..." } ]
// ========================================

router.get("/", authenticateToken, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM incidents
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


// ========================================
// CREATE AN INCIDENT
// POST /api/incidents
//
// Header: Authorization: Bearer <token>
//
// Body JSON:
// {
//   "title": "VPN not connecting",       required
//   "description": "Error 809 at 9am",   required
//   "severity": "high",                  optional (low | medium | high | critical)
//   "status": "open"                     optional (open | in_progress | resolved)
// }
//
// Response 201: { ...the new incident }
// Response 400: { "error": "Validation failed", "details": [...] }
// ========================================

router.post(
  "/",
  authenticateToken,
  validateResource(createIncidentSchema),
  async (req, res) => {
    const { title, description, severity, status }: Incident = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO incidents (title, description, severity, status)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [title, description, severity ?? "low", status ?? "open"]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// UPDATE STATUS / SEVERITY
// PATCH /api/incidents/:id
//
// Header: Authorization: Bearer <token>
//
// Body JSON (send one or both):
// { "status": "resolved" }
// { "severity": "critical" }
//
// Response 200: { ...the updated incident }
// Response 400: no fields sent / wrong values / bad id
// Response 404: { "error": "Incident not found" }
// ========================================

router.patch(
  "/:id",
  authenticateToken,
  validateResource(updateIncidentSchema),
  async (req, res) => {
    const { id } = req.params;
    const { severity, status }: Incident = req.body;

    if (severity === undefined && status === undefined) {
      return res.status(400).json({
        error: "No fields provided for update",
      });
    }

    try {
      const result = await pool.query(
        `UPDATE incidents
         SET severity = COALESCE($1, severity),
             status = COALESCE($2, status)
         WHERE id = $3
         RETURNING *`,
        [severity ?? null, status ?? null, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Incident not found",
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


// ========================================
// DELETE AN INCIDENT
// DELETE /api/incidents/:id
//
// Header: Authorization: Bearer <token>
//
// Response 200: { ...the deleted incident }
// Response 404: { "error": "Incident not found" }
// ========================================

router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM incidents
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Incident not found",
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
