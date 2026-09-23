// auth routes: register + login
import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "./db";
import jwt from "jsonwebtoken";
import { validateResource } from "./validate";
import { registerSchema, loginSchema } from "./schemas";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";


// ========================================
// REGISTER  (NEW in this variation)
// POST /api/auth/register        (public)
//
// Body JSON: { "email": "carl@notes.com", "password": "password123" }
//
// Response 201: { "message": "User registered successfully",
//                 "user": { "id": "...", "email": "carl@notes.com", "created_at": "..." } }
// Response 409: { "error": "Email already registered" }
// ========================================

router.post(
  "/register",
  validateResource(registerSchema),
  async (req, res) => {
    const { email, password } = req.body;

    try {
      // 1. is the email already used?
      const userCheck = await pool.query(
        `SELECT email FROM users
         WHERE email = $1`,
        [email]
      );

      if (userCheck.rows.length > 0) {
        return res.status(409).json({
          error: "Email already registered",
        });
      }

      // 2. never save the real password -> save the hash
      const saltRounds = 10;

      const passwordHash = await bcrypt.hash(
        password,
        saltRounds
      );

      // 3. save the user (RETURNING without password_hash!)
      const result = await pool.query(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email, created_at`,
        [email, passwordHash]
      );

      res.status(201).json({
        message: "User registered successfully",
        user: result.rows[0],
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
// LOGIN
// POST /api/auth/login        (public)
//
// Body JSON: { "email": "alice@notes.com", "password": "password123" }
//
// Response 200: { "message": "Login successful", "token": "eyJhbGci...",
//                 "user": { "id": "...", "email": "alice@notes.com" } }
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

      // userId goes INSIDE the token -> noteRoutes reads it back with req.user
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
