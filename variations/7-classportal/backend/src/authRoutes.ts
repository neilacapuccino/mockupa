// auth routes - TWO logins: students (student number) and teachers (employee number)
import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "./db";
import jwt from "jsonwebtoken";
import { validateResource } from "./validate";
import { studentLoginSchema, teacherLoginSchema } from "./schemas";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";


// ========================================
// STUDENT LOGIN
// POST /api/auth/student-login        (public)
//
// Body JSON: { "student_no": "2024-00123", "password": "password123" }
//
// Response 200: { "message": "Login successful", "token": "eyJhbGci...",
//                 "user": { "id": "...", "name": "Juan Dela Cruz", "type": "student", "number": "2024-00123" } }
// Response 400: student_no doesn't look like 2024-00123 (zod regex)
// Response 401: { "error": "Invalid student number or password" }
// ========================================

router.post(
  "/student-login",
  validateResource(studentLoginSchema),
  async (req, res) => {
    const { student_no, password } = req.body;

    try {
      // look in the STUDENTS table
      const result = await pool.query(
        `SELECT * FROM students
         WHERE student_no = $1`,
        [student_no]
      );

      const student = result.rows[0];

      if (!student) {
        return res.status(401).json({
          error: "Invalid student number or password",
        });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        student.password_hash
      );

      if (!isValidPassword) {
        return res.status(401).json({
          error: "Invalid student number or password",
        });
      }

      // NEW: "type" goes inside the token -> requireStudent / requireTeacher read it
      const token = jwt.sign(
        {
          userId: student.id,
          name: student.full_name,
          type: "student",
        },
        JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: student.id,
          name: student.full_name,
          type: "student",
          number: student.student_no,
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);


// ========================================
// TEACHER LOGIN
// POST /api/auth/teacher-login        (public)
//
// Body JSON: { "employee_no": "T-1001", "password": "password123" }
//
// Response 200: { "message": "Login successful", "token": "eyJhbGci...",
//                 "user": { "id": "...", "name": "Ms. Santos", "type": "teacher", "number": "T-1001" } }
// Response 401: { "error": "Invalid employee number or password" }
// ========================================

router.post(
  "/teacher-login",
  validateResource(teacherLoginSchema),
  async (req, res) => {
    const { employee_no, password } = req.body;

    try {
      // look in the TEACHERS table
      const result = await pool.query(
        `SELECT * FROM teachers
         WHERE employee_no = $1`,
        [employee_no]
      );

      const teacher = result.rows[0];

      if (!teacher) {
        return res.status(401).json({
          error: "Invalid employee number or password",
        });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        teacher.password_hash
      );

      if (!isValidPassword) {
        return res.status(401).json({
          error: "Invalid employee number or password",
        });
      }

      const token = jwt.sign(
        {
          userId: teacher.id,
          name: teacher.full_name,
          type: "teacher",
        },
        JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: teacher.id,
          name: teacher.full_name,
          type: "teacher",
          number: teacher.employee_no,
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);


export default router;
