// note routes (CRUD) - every route only touches the LOGGED-IN user's notes
import { Router } from "express";
import { JwtPayload } from "jsonwebtoken";
import { pool } from "./db";
import { Note } from "./types";
import { validateResource } from "./validate";
import { createNoteSchema, updateNoteSchema } from "./schemas";
import { authenticateToken } from "./authMiddleware";

const router = Router();

// NEW CONCEPT: who is logged in?
// authenticateToken does  req.user = jwt.verify(token)  ->  { userId, email, iat, exp }
// so in every route:      const userId = (req.user as JwtPayload).userId;
// ("as JwtPayload" = tell TypeScript req.user is the object version, not a string)


// ========================================
// GET MY NOTES
// GET /api/notes
// GET /api/notes?search=zod       (optional search by title)
//
// Header: Authorization: Bearer <token>
//
// Response 200: [ { "id": "...", "user_id": "...", "title": "Zod", "content": "...",
//                   "is_pinned": true, "created_at": "..." } ]
// ========================================

router.get("/", authenticateToken, async (req, res) => {
  const userId = (req.user as JwtPayload).userId;
  const { search } = req.query;

  try {
    // only MY notes
    let queryText = "SELECT * FROM notes WHERE user_id = $1";
    const queryParams: string[] = [userId];

    if (search && typeof search === "string") {
      queryText += " AND title ILIKE $2";
      queryParams.push(`%${search}%`);
    }

    // pinned notes first, then newest first
    queryText += " ORDER BY is_pinned DESC, created_at DESC";

    const result = await pool.query(queryText, queryParams);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


// ========================================
// CREATE A NOTE
// POST /api/notes
//
// Header: Authorization: Bearer <token>
//
// Body JSON:
// { "title": "Express", "content": "app.use runs on every request", "is_pinned": false }
//   title, content = required     is_pinned = optional (default false)
//
// user_id is NOT in the body -> it comes from the token
//
// Response 201: { ...the new note }
// ========================================

router.post(
  "/",
  authenticateToken,
  validateResource(createNoteSchema),
  async (req, res) => {
    const userId = (req.user as JwtPayload).userId;
    const { title, content, is_pinned }: Note = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO notes (user_id, title, content, is_pinned)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, title, content, is_pinned ?? false]
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
// UPDATE A NOTE
// PUT /api/notes/:id
//
// Header: Authorization: Bearer <token>
//
// Body JSON (send any of them):
// { "title": "New title" }
// { "is_pinned": true }
// { "title": "New title", "content": "New content", "is_pinned": false }
//
// Response 200: { ...the updated note }
// Response 404: { "error": "Note not found" }   <- also when it's SOMEONE ELSE'S note
// ========================================

router.put(
  "/:id",
  authenticateToken,
  validateResource(updateNoteSchema),
  async (req, res) => {
    const userId = (req.user as JwtPayload).userId;
    const { id } = req.params;
    const { title, content, is_pinned }: Note = req.body;

    if (title === undefined && content === undefined && is_pinned === undefined) {
      return res.status(400).json({
        error: "No fields provided for update",
      });
    }

    try {
      // "AND user_id = $5" -> you can only edit YOUR note
      const result = await pool.query(
        `UPDATE notes
         SET title = COALESCE($1, title),
             content = COALESCE($2, content),
             is_pinned = COALESCE($3, is_pinned)
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [title ?? null, content ?? null, is_pinned ?? null, id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Note not found",
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
// DELETE A NOTE
// DELETE /api/notes/:id
//
// Header: Authorization: Bearer <token>
//
// Response 200: { ...the deleted note }
// Response 404: { "error": "Note not found" }   <- also when it's SOMEONE ELSE'S note
// ========================================

router.delete("/:id", authenticateToken, async (req, res) => {
  const userId = (req.user as JwtPayload).userId;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM notes
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Note not found",
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
