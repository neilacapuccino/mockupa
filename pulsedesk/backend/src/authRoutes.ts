// STEP 3 - login route (same as practice-c login, but with email)
import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "./db";
import jwt from "jsonwebtoken";
import { validateResource } from "./validate";      // STEP 4
import { loginSchema } from "./schemas";            // STEP 4

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";


// ========================================
// LOGIN
// POST /api/auth/login        (public, no token needed)
//
// Body JSON:
// { "email": "admin@pulsedesk.com", "password": "password123" }
//
// Response 200:
// { "message": "Login successful", "token": "eyJhbGci...",
//   "user": { "id": "3cf1bffc-...", "email": "admin@pulsedesk.com" } }
// Response 400: wrong format (zod)      Response 401: wrong email/password
// ========================================

router.post(
  "/login",
  validateResource(loginSchema),   // STEP 4: added after making validate.ts + schemas.ts
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

      // the frontend needs the token AND the user (for SET_AUTH)
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
