// auth routes: login with a MOBILE NUMBER + "remember me"
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
// Body JSON: { "mobile": "09171234567", "password": "password123", "remember_me": true }
//
// Response 200: { "message": "Login successful", "token": "eyJhbGci...", "expires_in": "7d",
//                 "user": { "id": "...", "name": "Ana Reyes", "mobile": "09171234567" } }
// Response 400: mobile doesn't look like 09171234567
// Response 401: { "error": "Invalid mobile number or password" }
// ========================================

router.post(
  "/login",
  validateResource(loginSchema),
  async (req, res) => {
    const { mobile, password, remember_me } = req.body;

    try {
      const result = await pool.query(
        `SELECT * FROM users
         WHERE mobile = $1`,
        [mobile]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({
          error: "Invalid mobile number or password",
        });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isValidPassword) {
        return res.status(401).json({
          error: "Invalid mobile number or password",
        });
      }

      // NEW: "remember me" decides how long the token lasts
      //   checked   -> 7 days
      //   unchecked -> 15 minutes   (change it to "30s" to SEE the auto-logout quickly)
      const expiresIn = remember_me ? "7d" : "15m";

      const token = jwt.sign(
        {
          userId: user.id,
          name: user.full_name,
        },
        JWT_SECRET,
        {
          expiresIn,
        }
      );

      res.json({
        message: "Login successful",
        token,
        expires_in: expiresIn,
        user: {
          id: user.id,
          name: user.full_name,
          mobile: user.mobile,
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
