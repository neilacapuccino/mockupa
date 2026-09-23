// book routes - CRUD + borrow / return with business rules
import { Router } from "express";
import { JwtPayload } from "jsonwebtoken";
import { pool } from "./db";
import { Book } from "./types";
import { validateResource } from "./validate";
import { createBookSchema, bookQuerySchema, bookIdSchema } from "./schemas";
import { authenticateToken } from "./authMiddleware";

const router = Router();


// ========================================
// GET BOOKS (with optional filter)
// GET /api/books                    -> all books
// GET /api/books?available=true     -> only books you can borrow
// GET /api/books?available=false    -> only borrowed books
//
// Header: Authorization: Bearer <token>
//
// Response 200: [ { "id": "...", "title": "Clean Code", "author": "Robert C. Martin",
//                   "published_year": 2008, "is_available": true, "borrowed_by": null, ... } ]
// Response 400: ?available=maybe  -> zod error (only "true" or "false" allowed)
// ========================================

router.get(
  "/",
  authenticateToken,
  validateResource(bookQuerySchema),
  async (req, res) => {
    const { available } = req.query;

    try {
      let queryText = "SELECT * FROM books";
      const queryParams: boolean[] = [];

      if (available === "true" || available === "false") {
        queryText += " WHERE is_available = $1";
        // the query gives a STRING "true" -> turn it into a real boolean for the db
        queryParams.push(available === "true");
      }

      queryText += " ORDER BY title ASC";

      const result = await pool.query(queryText, queryParams);

      res.json(result.rows);
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// ADD A BOOK
// POST /api/books
//
// Header: Authorization: Bearer <token>
//
// Body JSON:
// { "title": "Refactoring", "author": "Martin Fowler", "published_year": 2018 }
//   published_year must be a NUMBER
//
// Response 201: { ...the new book (is_available: true) }
// Response 400: { "error": "Validation failed", "details": [...] }
// ========================================

router.post(
  "/",
  authenticateToken,
  validateResource(createBookSchema),
  async (req, res) => {
    const { title, author, published_year }: Book = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO books (title, author, published_year)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [title, author, published_year]
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
// BORROW A BOOK
// PATCH /api/books/:id/borrow
//
// Header: Authorization: Bearer <token>
// Body: none (the id in the URL is enough)
//
// Response 200: { ...the book (is_available: false, borrowed_by: your user id) }
// Response 404: { "error": "Book not found" }
// Response 409: { "error": "Book is already borrowed" }     <- business rule
// ========================================

router.patch(
  "/:id/borrow",
  authenticateToken,
  validateResource(bookIdSchema),
  async (req, res) => {
    const { id } = req.params;
    const userId = (req.user as JwtPayload).userId;

    try {
      // 1. find the book first
      const found = await pool.query(
        `SELECT * FROM books
         WHERE id = $1`,
        [id]
      );

      if (found.rows.length === 0) {
        return res.status(404).json({
          error: "Book not found",
        });
      }

      // 2. business rule: can't borrow a borrowed book
      if (!found.rows[0].is_available) {
        return res.status(409).json({
          error: "Book is already borrowed",
        });
      }

      // 3. ok -> mark it as borrowed by me
      const result = await pool.query(
        `UPDATE books
         SET is_available = false,
             borrowed_by = $1
         WHERE id = $2
         RETURNING *`,
        [userId, id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// RETURN A BOOK
// PATCH /api/books/:id/return
//
// Header: Authorization: Bearer <token>
// Body: none
//
// Response 200: { ...the book (is_available: true, borrowed_by: null) }
// Response 404: { "error": "Book not found" }
// Response 409: { "error": "Book is not borrowed" }         <- business rule
// ========================================

router.patch(
  "/:id/return",
  authenticateToken,
  validateResource(bookIdSchema),
  async (req, res) => {
    const { id } = req.params;

    try {
      const found = await pool.query(
        `SELECT * FROM books
         WHERE id = $1`,
        [id]
      );

      if (found.rows.length === 0) {
        return res.status(404).json({
          error: "Book not found",
        });
      }

      // business rule: can't return a book that is already on the shelf
      if (found.rows[0].is_available) {
        return res.status(409).json({
          error: "Book is not borrowed",
        });
      }

      const result = await pool.query(
        `UPDATE books
         SET is_available = true,
             borrowed_by = NULL
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// DELETE A BOOK
// DELETE /api/books/:id
//
// Header: Authorization: Bearer <token>
//
// Response 200: { ...the deleted book }
// Response 404: { "error": "Book not found" }
// Response 409: { "error": "Can't delete a borrowed book" }  <- business rule
// ========================================

router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const found = await pool.query(
      `SELECT * FROM books
       WHERE id = $1`,
      [id]
    );

    if (found.rows.length === 0) {
      return res.status(404).json({
        error: "Book not found",
      });
    }

    if (!found.rows[0].is_available) {
      return res.status(409).json({
        error: "Can't delete a borrowed book",
      });
    }

    const result = await pool.query(
      `DELETE FROM books
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


export default router;
