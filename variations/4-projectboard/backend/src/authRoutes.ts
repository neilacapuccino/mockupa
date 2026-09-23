// auth routes: login only (same as PulseDesk)
import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "./db";
import jwt from "jsonwebtoken";
import { validateResource } from "./validate";
import { loginSchema } from "./schemas";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";


// ========================================
// LOGIN
// POST /api/auth/login        (public)
//
// Body JSON: { "email": "lead@board.com", "password": "password123" }
//
// Response 200: { "message": "Login successful", "token": "eyJhbGci...",
//                 "user": { "id": "...", "email": "lead@board.com" } }
// Response 401: { "error": "Invalid email or password" }
// ========================================

router.post(
  "/login",
  validateResource(loginSchema),
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const result = await pool.query(
        `SELECT * FROM users
         WHERE email = $1`,
        [email]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isValidPassword) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
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
          id: user.id,
          email: user.email,
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
