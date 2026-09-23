// post routes - READING is PUBLIC, writing needs a token, editing is AUTHOR ONLY
import { Router } from "express";
import { JwtPayload } from "jsonwebtoken";
import { pool } from "./db";
import { Post } from "./types";
import { validateResource } from "./validate";
import { createPostSchema, updatePostSchema } from "./schemas";
import { authenticateToken } from "./authMiddleware";

const router = Router();


// helper: one post + its author's username / display name (JOIN)
const findPost = async (id: string) => {
  const result = await pool.query(
    `SELECT p.*, u.username, u.display_name
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.id = $1`,
    [id]
  );

  return result.rows[0];
};


// ========================================
// GET ALL POSTS                     (PUBLIC - no token needed)
// GET /api/posts
//
// Response 200: [ { "id": "...", "user_id": "...", "title": "JWT tip", "body": "...",
//                   "username": "maria_codes", "display_name": "Maria", ... } ]
// ========================================

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.username, u.display_name
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


// ========================================
// CREATE A POST                     (needs token)
// POST /api/posts
//
// Body JSON: { "title": "Hello", "body": "My first post" }
//
// Response 201: { ...the new post with username + display_name }
// ========================================

router.post(
  "/",
  authenticateToken,
  validateResource(createPostSchema),
  async (req, res) => {
    const userId = (req.user as JwtPayload).userId;
    const { title, body }: Post = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO posts (user_id, title, body)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [userId, title, body]
      );

      res.status(201).json(await findPost(result.rows[0].id));
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// EDIT A POST                       (needs token + must be the AUTHOR)
// PUT /api/posts/:id
//
// Body JSON: { "title": "New title" }  and/or  { "body": "New text" }
//
// Response 200: { ...the updated post }
// Response 403: { "error": "You can only edit your own posts" }
// Response 404: { "error": "Post not found" }
//
// NOTE the difference with StudyNotes (variation 1):
//   there, someone else's note gave 404 ("it doesn't exist FOR YOU")
//   here posts are PUBLIC, so it exists -> 403 ("you're not allowed")
// ========================================

router.put(
  "/:id",
  authenticateToken,
  validateResource(updatePostSchema),
  async (req, res) => {
    const userId = (req.user as JwtPayload).userId;
    const id = req.params.id as string;
    const { title, body }: Post = req.body;

    if (title === undefined && body === undefined) {
      return res.status(400).json({
        error: "No fields provided for update",
      });
    }

    try {
      const post = await findPost(id);

      if (!post) {
        return res.status(404).json({
          error: "Post not found",
        });
      }

      // the owner check
      if (post.user_id !== userId) {
        return res.status(403).json({
          error: "You can only edit your own posts",
        });
      }

      await pool.query(
        `UPDATE posts
         SET title = COALESCE($1, title),
             body = COALESCE($2, body),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [title ?? null, body ?? null, id]
      );

      res.json(await findPost(id));
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// DELETE A POST                     (needs token + must be the AUTHOR)
// DELETE /api/posts/:id
//
// Response 200: { ...the deleted post }
// Response 403: { "error": "You can only delete your own posts" }
// Response 404: { "error": "Post not found" }
// ========================================

router.delete("/:id", authenticateToken, async (req, res) => {
  const userId = (req.user as JwtPayload).userId;
  const id = req.params.id as string;

  try {
    const post = await findPost(id);

    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({
        error: "You can only delete your own posts",
      });
    }

    await pool.query(
      `DELETE FROM posts
       WHERE id = $1`,
      [id]
    );

    res.json(post);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


export default router;
