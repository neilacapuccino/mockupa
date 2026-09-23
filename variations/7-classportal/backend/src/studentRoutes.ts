// student list (TEACHERS only)
import { Router } from "express";
import { pool } from "./db";
import { authenticateToken, requireTeacher } from "./authMiddleware";

const router = Router();


// ========================================
// GET ALL STUDENTS + their average
// GET /api/students                  (teachers only)
//
// Response 200:
// [ { "id": "...", "student_no": "2024-00123", "full_name": "Juan Dela Cruz",
//     "course": "BSIT", "year_level": 2, "subjects": 3, "average": 85 } ]
// Response 403: { "error": "Teachers only." }
// ========================================

router.get("/", authenticateToken, requireTeacher, async (_req, res) => {
  try {
    // NEVER select password_hash when sending users to the frontend
    // AVG      -> average score
    // ROUND(x, 1) -> 1 decimal place
    // ::float  -> AVG/ROUND give a NUMERIC (sent as a string), ::float makes it a normal number
    const result = await pool.query(
      `SELECT s.id, s.student_no, s.full_name, s.course, s.year_level,
              COUNT(g.id)::int AS subjects,
              ROUND(AVG(g.score), 1)::float AS average
       FROM students s
       LEFT JOIN grades g ON g.student_id = s.id
       GROUP BY s.id
       ORDER BY s.full_name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


export default router;
