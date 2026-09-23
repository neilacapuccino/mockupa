// auth routes: me, register, login (with lockout), change password
import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "./db";
import jwt, { JwtPayload } from "jsonwebtoken";
import { validateResource } from "./validate";
import { registerSchema, loginSchema, changePasswordSchema } from "./schemas";
import { authenticateToken } from "./authMiddleware";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// NEW: lockout rules
const MAX_ATTEMPTS = 3;        // wrong passwords allowed in a row
const LOCK_MINUTES = 5;        // how long the account stays locked


// ========================================
// WHO AM I  (NEW: restore the login after a page refresh)
// GET /api/auth/me                  (needs token)
//
// The frontend only saves the TOKEN. After a refresh it calls this route
// to get the user back. If the token expired -> 403 -> the frontend logs out.
//
// Response 200: { "id": "...", "username": "juan_dev", "display_name": "Juan", "created_at": "..." }
// Response 401 / 403: no token / bad or expired token
// ========================================

router.get("/me", authenticateToken, async (req, res) => {
  const userId = (req.user as JwtPayload).userId;

  try {
    const result = await pool.query(
      `SELECT id, username, display_name, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


// ========================================
// REGISTER
// POST /api/auth/register           (public)
//
// Body JSON:
// { "username": "pedro_99", "display_name": "Pedro",
//   "password": "secret123", "confirm_password": "secret123" }
//
// Response 201: { "message": "Account created", "user": { "id": "...", "username": "pedro_99", ... } }
// Response 400: { "error": "Passwords do not match" }
// Response 409: { "error": "Username is already taken" }
// ========================================

router.post(
  "/register",
  validateResource(registerSchema),
  async (req, res) => {
    const { username, display_name, password, confirm_password } = req.body;

    // NEW: compare two fields of the body
    if (password !== confirm_password) {
      return res.status(400).json({
        error: "Passwords do not match",
      });
    }

    try {
      const userCheck = await pool.query(
        `SELECT id FROM users
         WHERE username = $1`,
        [username]
      );

      if (userCheck.rows.length > 0) {
        return res.status(409).json({
          error: "Username is already taken",
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO users (username, display_name, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, username, display_name, created_at`,
        [username, display_name, passwordHash]
      );

      res.status(201).json({
        message: "Account created",
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
// LOGIN  (NEW: 3 wrong passwords -> locked for 5 minutes)
// POST /api/auth/login              (public)
//
// Body JSON: { "username": "juan_dev", "password": "password123" }
//
// Response 200: { "message": "Login successful", "token": "eyJhbGci...",
//                 "user": { "id": "...", "username": "juan_dev", "display_name": "Juan" } }
// Response 401: { "error": "Invalid username or password (2 tries left)" }
// Response 423: { "error": "Account locked. Try again in 5 minute(s)." }   <- 423 = "Locked"
// ========================================

router.post(
  "/login",
  validateResource(loginSchema),
  async (req, res) => {
    const { username, password } = req.body;

    try {
      // let the DATABASE do the time math (no timezone problems):
      //   is_locked    -> true if locked_until is still in the future
      //   minutes_left -> how many minutes until it unlocks
      const result = await pool.query(
        `SELECT *,
                (locked_until IS NOT NULL AND locked_until > NOW()) AS is_locked,
                CEIL(EXTRACT(EPOCH FROM (locked_until - NOW())) / 60)::int AS minutes_left
         FROM users
         WHERE username = $1`,
        [username]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({
          error: "Invalid username or password",
        });
      }

      // 1. locked? stop here (don't even check the password)
      if (user.is_locked) {
        return res.status(423).json({
          error: `Account locked. Try again in ${user.minutes_left} minute(s).`,
        });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash
      );

      // 2. wrong password -> count it, lock on the 3rd
      if (!isValidPassword) {
        const attempts = user.failed_attempts + 1;

        if (attempts >= MAX_ATTEMPTS) {
          await pool.query(
            `UPDATE users
             SET failed_attempts = 0,
                 locked_until = NOW() + $1 * INTERVAL '1 minute'
             WHERE id = $2`,
            [LOCK_MINUTES, user.id]
          );

          return res.status(423).json({
            error: `Too many wrong passwords. Account locked for ${LOCK_MINUTES} minutes.`,
          });
        }

        await pool.query(
          `UPDATE users
           SET failed_attempts = $1
           WHERE id = $2`,
          [attempts, user.id]
        );

        return res.status(401).json({
          error: `Invalid username or password (${MAX_ATTEMPTS - attempts} tries left)`,
        });
      }

      // 3. correct password -> reset the counter
      await pool.query(
        `UPDATE users
         SET failed_attempts = 0,
             locked_until = NULL
         WHERE id = $1`,
        [user.id]
      );

      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
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
          username: user.username,
          display_name: user.display_name,
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
// CHANGE PASSWORD
// PATCH /api/auth/password           (needs token)
//
// Body JSON: { "current_password": "password123", "new_password": "newpass456" }
//
// Response 200: { "message": "Password changed" }
// Response 400: { "error": "Current password is wrong" }
// Response 400: { "error": "New password must be different" }
// ========================================

router.patch(
  "/password",
  authenticateToken,
  validateResource(changePasswordSchema),
  async (req, res) => {
    const userId = (req.user as JwtPayload).userId;
    const { current_password, new_password } = req.body;

    try {
      const result = await pool.query(
        `SELECT * FROM users
         WHERE id = $1`,
        [userId]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      // 1. prove you know the old password
      const isValidPassword = await bcrypt.compare(current_password, user.password_hash);

      if (!isValidPassword) {
        return res.status(400).json({
          error: "Current password is wrong",
        });
      }

      // 2. the new one can't be the same
      if (current_password === new_password) {
        return res.status(400).json({
          error: "New password must be different",
        });
      }

      // 3. save the HASH of the new password
      const newHash = await bcrypt.hash(new_password, 10);

      await pool.query(
        `UPDATE users
         SET password_hash = $1
         WHERE id = $2`,
        [newHash, userId]
      );

      res.json({
        message: "Password changed",
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
