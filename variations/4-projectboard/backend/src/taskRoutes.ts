// task routes (update + delete a single task)
import { Router } from "express";
import { pool } from "./db";
import { Task } from "./types";
import { validateResource } from "./validate";
import { updateTaskSchema } from "./schemas";
import { authenticateToken } from "./authMiddleware";

const router = Router();

// the order a task moves through
const STATUS_ORDER = ["todo", "doing", "done"];


// ========================================
// UPDATE A TASK
// PATCH /api/tasks/:id
//
// Body JSON (any of them):
// { "status": "doing" }
// { "priority": "high" }
// { "title": "New title" }
//
// CONDITION: status can only move FORWARD  (todo -> doing -> done)
//            done -> todo is NOT allowed
//
// Response 200: { ...the updated task }
// Response 400: { "error": "A task can only move forward (todo -> doing -> done)" }
// Response 404: { "error": "Task not found" }
// ========================================

router.patch(
  "/:id",
  authenticateToken,
  validateResource(updateTaskSchema),
  async (req, res) => {
    const { id } = req.params;
    const { title, status, priority }: Task = req.body;

    if (title === undefined && status === undefined && priority === undefined) {
      return res.status(400).json({
        error: "No fields provided for update",
      });
    }

    try {
      // 1. get the task as it is now
      const found = await pool.query(
        `SELECT * FROM tasks
         WHERE id = $1`,
        [id]
      );

      if (found.rows.length === 0) {
        return res.status(404).json({
          error: "Task not found",
        });
      }

      // 2. the rule: compare positions in STATUS_ORDER
      //    todo = 0, doing = 1, done = 2  ->  new position can't be smaller
      if (status !== undefined) {
        const currentPosition = STATUS_ORDER.indexOf(found.rows[0].status);
        const newPosition = STATUS_ORDER.indexOf(status);

        if (newPosition < currentPosition) {
          return res.status(400).json({
            error: "A task can only move forward (todo -> doing -> done)",
          });
        }
      }

      // 3. update
      const result = await pool.query(
        `UPDATE tasks
         SET title = COALESCE($1, title),
             status = COALESCE($2, status),
             priority = COALESCE($3, priority)
         WHERE id = $4
         RETURNING *`,
        [title ?? null, status ?? null, priority ?? null, id]
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
// DELETE A TASK
// DELETE /api/tasks/:id
//
// Response 200: { ...the deleted task }
// Response 404: { "error": "Task not found" }
// ========================================

router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM tasks
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found",
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
