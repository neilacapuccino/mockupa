// grade routes - students see THEIR OWN grades, teachers manage everyone's
import { Router } from "express";
import { JwtPayload } from "jsonwebtoken";
import { pool } from "./db";
import { Grade } from "./types";
import { validateResource } from "./validate";
import { createGradeSchema, updateGradeSchema, gradeQuerySchema } from "./schemas";
import { authenticateToken, requireTeacher, requireStudent } from "./authMiddleware";

const router = Router();


// helper: the grades of one student + "Passed/Failed" + their average
const getGrades = async (studentId: string) => {
  // CASE WHEN = an "if" inside SQL -> makes a new "remarks" column
  const gradeResult = await pool.query(
    `SELECT id, subject, score,
            CASE WHEN score >= 75 THEN 'Passed' ELSE 'Failed' END AS remarks
     FROM grades
     WHERE student_id = $1
     ORDER BY subject ASC`,
    [studentId]
  );

  const averageResult = await pool.query(
    `SELECT ROUND(AVG(score), 1)::float AS average
     FROM grades
     WHERE student_id = $1`,
    [studentId]
  );

  return {
    grades: gradeResult.rows,
    average: averageResult.rows[0].average,   // null if there are no grades yet
  };
};


// ========================================
// MY GRADES                          (STUDENTS only)
// GET /api/grades/mine
//
// the student id comes from the TOKEN, not from the URL
// -> a student can never ask for someone else's grades
//
// Response 200:
// { "grades": [ { "id": "...", "subject": "Networking", "score": 95, "remarks": "Passed" } ],
//   "average": 85 }
// Response 403: { "error": "Students only." }
// ========================================

router.get("/mine", authenticateToken, requireStudent, async (req, res) => {
  const studentId = (req.user as JwtPayload).userId;

  try {
    res.json(await getGrades(studentId));
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


// ========================================
// ONE STUDENT'S GRADES               (TEACHERS only)
// GET /api/grades?student_id=<uuid>
//
// Response 200: same shape as /mine
// ========================================

router.get(
  "/",
  authenticateToken,
  requireTeacher,
  validateResource(gradeQuerySchema),
  async (req, res) => {
    const studentId = req.query.student_id as string;

    try {
      res.json(await getGrades(studentId));
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// ADD A GRADE                        (TEACHERS only)
// POST /api/grades
//
// Body JSON: { "student_id": "<uuid>", "subject": "Web Development", "score": 88 }
//
// Response 201: { ...the new grade }
// Response 404: { "error": "Student not found" }                                   <- error code 23503
// Response 409: { "error": "This student already has a grade for Web Development" } <- error code 23505
// ========================================

router.post(
  "/",
  authenticateToken,
  requireTeacher,
  validateResource(createGradeSchema),
  async (req, res) => {
    const teacherId = (req.user as JwtPayload).userId;
    const { student_id, subject, score }: Grade = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO grades (student_id, subject, score, encoded_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [student_id, subject, score, teacherId]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error(error);

      // UNIQUE (student_id, subject) broken
      if (error.code === "23505") {
        return res.status(409).json({
          error: `This student already has a grade for ${subject}`,
        });
      }

      // FOREIGN KEY broken -> that student_id doesn't exist
      if (error.code === "23503") {
        return res.status(404).json({
          error: "Student not found",
        });
      }

      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);


// ========================================
// CHANGE A SCORE                     (TEACHERS only)
// PATCH /api/grades/:id
//
// Body JSON: { "score": 80 }
//
// Response 200: { ...the updated grade }
// Response 404: { "error": "Grade not found" }
// ========================================

router.patch(
  "/:id",
  authenticateToken,
  requireTeacher,
  validateResource(updateGradeSchema),
  async (req, res) => {
    const { id } = req.params;
    const { score } = req.body;

    try {
      const result = await pool.query(
        `UPDATE grades
         SET score = $1
         WHERE id = $2
         RETURNING *`,
        [score, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Grade not found",
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
// DELETE A GRADE                     (TEACHERS only)
// DELETE /api/grades/:id
//
// Response 200: { ...the deleted grade }
// Response 404: { "error": "Grade not found" }
// ========================================

router.delete("/:id", authenticateToken, requireTeacher, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM grades
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Grade not found",
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
