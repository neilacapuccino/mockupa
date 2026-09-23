// project routes + the NESTED route for adding a task to a project
import { Router } from "express";
import { JwtPayload } from "jsonwebtoken";
import { pool } from "./db";
import { Project, Task } from "./types";
import { validateResource } from "./validate";
import { createProjectSchema, projectIdSchema, createTaskSchema } from "./schemas";
import { authenticateToken } from "./authMiddleware";

const router = Router();


// ========================================
// GET ALL PROJECTS (with how many tasks each one has)
// GET /api/projects
//
// Response 200:
// [ { "id": "...", "name": "Exam Prep", "description": "...", "deadline": "2026-10-15",
//     "task_count": 4, ... } ]
// ========================================

router.get("/", authenticateToken, async (_req, res) => {
  try {
    // NEW SQL:
    //   LEFT JOIN  -> projects with 0 tasks still show up (a normal JOIN would hide them)
    //   COUNT      -> how many tasks each project has
    //   GROUP BY   -> one row per project (needed when you use COUNT with a JOIN)
    //   ::int      -> COUNT returns a big number type that pg sends as a STRING ("4"),
    //                 ::int turns it into a normal number (4)
    const result = await pool.query(
      `SELECT p.*, COUNT(t.id)::int AS task_count
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       GROUP BY p.id
       ORDER BY p.created_at ASC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


// ========================================
// GET ONE PROJECT + ITS TASKS
// GET /api/projects/:id
//
// Response 200:
// { "id": "...", "name": "Exam Prep", ...,
//   "tasks": [ { "id": "...", "title": "Review Zod", "status": "done", "priority": "high" }, ... ] }
// Response 404: { "error": "Project not found" }
// ========================================

router.get(
  "/:id",
  authenticateToken,
  validateResource(projectIdSchema),
  async (req, res) => {
    const { id } = req.params;

    try {
      // 1. the project
      const projectResult = await pool.query(
        `SELECT * FROM projects
         WHERE id = $1`,
        [id]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          error: "Project not found",
        });
      }

      // 2. its tasks
      const taskResult = await pool.query(
        `SELECT * FROM tasks
         WHERE project_id = $1
         ORDER BY created_at ASC`,
        [id]
      );

      // 3. put them together in one object
      res.json({
        ...projectResult.rows[0],
        tasks: taskResult.rows,
      });
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// CREATE A PROJECT
// POST /api/projects
//
// Body JSON:
// { "name": "Thesis", "description": "Chapter 1-3", "deadline": "2026-12-01" }
//   name = required     description, deadline = optional
//
// Response 201: { ...the new project, "task_count": 0 }
// ========================================

router.post(
  "/",
  authenticateToken,
  validateResource(createProjectSchema),
  async (req, res) => {
    const userId = (req.user as JwtPayload).userId;
    const { name, description, deadline }: Project = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO projects (name, description, deadline, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, description ?? null, deadline ?? null, userId]
      );

      // a brand-new project has no tasks yet
      res.status(201).json({ ...result.rows[0], task_count: 0 });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// ADD A TASK TO A PROJECT   (NEW: nested route)
// POST /api/projects/:projectId/tasks
//
// Body JSON:
// { "title": "Write chapter 1", "priority": "high" }
//   title = required     priority = optional (low | medium | high, default medium)
//
// Response 201: { "id": "...", "project_id": "...", "title": "Write chapter 1",
//                 "status": "todo", "priority": "high", ... }
// Response 404: { "error": "Project not found" }
// ========================================

router.post(
  "/:projectId/tasks",
  authenticateToken,
  validateResource(createTaskSchema),
  async (req, res) => {
    const { projectId } = req.params;
    const { title, priority }: Task = req.body;

    try {
      // the project must exist first
      const projectResult = await pool.query(
        `SELECT id FROM projects
         WHERE id = $1`,
        [projectId]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          error: "Project not found",
        });
      }

      const result = await pool.query(
        `INSERT INTO tasks (project_id, title, priority)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [projectId, title, priority ?? "medium"]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// DELETE A PROJECT
// DELETE /api/projects/:id
//
// CONDITION: only allowed when ALL its tasks are done
//
// Response 200: { ...the deleted project }   (its tasks are deleted too - CASCADE)
// Response 404: { "error": "Project not found" }
// Response 409: { "error": "Project still has 3 unfinished task(s)" }
// ========================================

router.delete(
  "/:id",
  authenticateToken,
  validateResource(projectIdSchema),
  async (req, res) => {
    const { id } = req.params;

    try {
      // how many tasks are NOT done yet?   (<> means "not equal")
      const openResult = await pool.query(
        `SELECT COUNT(*)::int AS open_tasks
         FROM tasks
         WHERE project_id = $1 AND status <> 'done'`,
        [id]
      );

      const openTasks = openResult.rows[0].open_tasks;

      if (openTasks > 0) {
        return res.status(409).json({
          error: `Project still has ${openTasks} unfinished task(s)`,
        });
      }

      const result = await pool.query(
        `DELETE FROM projects
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Project not found",
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


export default router;
