# Routes template - `yourRoutes.ts` for any project

Every route has the same 4 steps. Only the SQL, the fields and the middleware change.
Zod schemas for these routes -> `ZOD-TEMPLATE.md`.

**Part 1 - The general approach**
1. The shape of every route
2. Reading the request
3. Sending the answer

**Part 2 - Translate the spec table**
4. Spec table -> route, column by column
5. Worked example: the PulseDesk table -> `incidentRoutes.ts`

**Part 3 - CRUD route templates**
6. Create (POST)
7. Read all (GET)
8. Read one (GET /:id)
9. Update some fields (PATCH)
10. Replace everything (PUT)
11. Delete (DELETE)
12. The template file (all together)

**Part 4 - Special routes**
13. "My" data only
14. Owner only (403)
15. Action route with a rule (409)
16. Admin only
17. Duplicate values (UNIQUE -> 409)

**Part 5 - Styles compared**
18. ChatGPT style vs this repo's style

**Part 6 - Final check**
19. Before you run it

---

# Part 1 - The general approach

## 1. The shape of every route

```ts
router.METHOD(
  "PATH",
  MIDDLEWARE,              // authenticateToken, validateResource(schema), ... (or nothing)
  async (req, res) => {
    // 1. read the input (params / query / body / req.user)

    try {
      // 2. run the SQL

      // 3. check the result (not found -> 404)

      // 4. send the answer (200 / 201)
    } catch (error) {
      // anything crashed -> 500
    }
  }
);
```

Filled in:

```ts
router.get(
  "/:id",
  authenticateToken,
  validateResource(itemIdSchema),
  async (req, res) => {
    // 1. read the input
    const { id } = req.params;

    try {
      // 2. run the SQL
      const result = await pool.query(
        `SELECT * FROM items
         WHERE id = $1`,
        [id]
      );

      // 3. check the result
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      // 4. send the answer
      return res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
```

## 2. Reading the request

| Where it is | Example | Code |
|---|---|---|
| params (in the path) | `/api/items/3` | `const { id } = req.params;` |
| query (after `?`) | `/api/items?status=open` | `const { status } = req.query;` (always text) |
| body (the JSON) | `{ "title": "abc" }` | `const { title } = req.body;` |
| the logged-in user | after `authenticateToken` | `const userId = (req.user as JwtPayload).userId;` |

## 3. Sending the answer

| Status | When | Code |
|---|---|---|
| 200 | read / update / delete worked | `return res.json(result.rows[0]);` |
| 201 | create worked | `return res.status(201).json(result.rows[0]);` |
| 400 | bad input the route checks itself | `return res.status(400).json({ error: "No fields provided for update" });` |
| 403 | logged in but not allowed | `return res.status(403).json({ error: "You can only edit your own items" });` |
| 404 | no row with that id | `return res.status(404).json({ error: "Item not found" });` |
| 409 | duplicate / blocked by the current state | `return res.status(409).json({ error: "Item is already borrowed" });` |
| 500 | the catch | `return res.status(500).json({ error: "Internal server error" });` |

Always `return` when you send - otherwise the code keeps running and tries to send twice.
Wrong data (types, missing fields, bad id format) is answered by Zod with 400 before your code runs.

---

# Part 2 - Translate the spec table

## 4. Spec table -> route, column by column

| Spec column | Becomes | Example |
|---|---|---|
| **Method** | `router.post` / `get` / `patch` / `put` / `delete` | PATCH -> `router.patch(` |
| **Endpoint** | the path, WITHOUT the part in `index.ts` | `/api/incidents/:id` -> `"/:id"` (because of `app.use("/api/incidents", ...)`) |
| **Protection** | `authenticateToken` (JWT) or nothing (Public) | JWT Protected -> `authenticateToken,` |
| **Middleware** | `validateResource(schema)` or nothing ("None") | `validate(updateIncidentSchema)` -> `validateResource(updateIncidentSchema),` |
| **Description** | the SQL | "UPDATE Status/Severity" -> `UPDATE incidents SET status = ..., severity = ...` |

| Description word | SQL | Success status |
|---|---|---|
| CREATE | `INSERT ... RETURNING *` | 201 |
| READ All | `SELECT * ... ORDER BY ...` | 200 |
| READ one | `SELECT * ... WHERE id = $1` | 200 (404 if none) |
| UPDATE | `UPDATE ... SET ... WHERE id = $x RETURNING *` | 200 (404 if none) |
| DELETE | `DELETE ... WHERE id = $1 RETURNING *` | 200 (404 if none) |

Order the routes: GET first, then POST, PATCH / PUT, DELETE. Fixed paths (`/mine`) before `/:id`.

## 5. Worked example: the PulseDesk table -> `incidentRoutes.ts`

| Method | Endpoint | Protection | Middleware | Description |
|---|---|---|---|---|
| POST | /api/auth/login | Public | Zod Login | Returns JWT Token |
| POST | /api/incidents | JWT Protected | validate(createIncidentSchema) | CREATE Incident |
| GET | /api/incidents | JWT Protected | None | READ All Incidents |
| PATCH | /api/incidents/:id | JWT Protected | validate(updateIncidentSchema) | UPDATE Status/Severity |
| DELETE | /api/incidents/:id | JWT Protected | None | DELETE Incident |

The login row goes in `authRoutes.ts`. The other 4 rows become:

```ts
// src/incidentRoutes.ts
import { Router } from "express";
import { pool } from "./db";
import { authenticateToken } from "./authMiddleware";
import { validateResource } from "./validate";
import { createIncidentSchema, updateIncidentSchema } from "./schemas";

const router = Router();


// ========================================
// READ ALL
// GET /api/incidents  |  JWT  |  None
// ========================================

router.get(
  "/",
  authenticateToken,
  async (_req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM incidents
         ORDER BY created_at DESC`
      );

      return res.json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);


// ========================================
// CREATE
// POST /api/incidents  |  JWT  |  validate(createIncidentSchema)
// ========================================

router.post(
  "/",
  authenticateToken,
  validateResource(createIncidentSchema),
  async (req, res) => {
    const { title, description, severity, status } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO incidents (title, description, severity, status)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [title, description, severity ?? "low", status ?? "open"]
      );

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);


// ========================================
// UPDATE STATUS / SEVERITY
// PATCH /api/incidents/:id  |  JWT  |  validate(updateIncidentSchema)
// ========================================

router.patch(
  "/:id",
  authenticateToken,
  validateResource(updateIncidentSchema),
  async (req, res) => {
    const { id } = req.params;
    const { status, severity } = req.body;

    if (status === undefined && severity === undefined) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    try {
      const result = await pool.query(
        `UPDATE incidents
         SET status = COALESCE($1, status),
             severity = COALESCE($2, severity)
         WHERE id = $3
         RETURNING *`,
        [status ?? null, severity ?? null, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Incident not found" });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);


// ========================================
// DELETE
// DELETE /api/incidents/:id  |  JWT  |  None
// ========================================

router.delete(
  "/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        `DELETE FROM incidents
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Incident not found" });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);


export default router;
```

---

# Part 3 - CRUD route templates

Examples use an `items` table: `id UUID, user_id UUID, title, description, status, created_at`.
Replace `items` / `Item` / the fields with yours.

## 6. Create (POST)

```ts
router.post(
  "/",
  authenticateToken,
  validateResource(createItemSchema),
  async (req, res) => {
    const { title, description, status } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO items (title, description, status)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [title, description, status ?? "open"]
      );

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
```

The table has a `user_id` column? Take it from the token (never from the body):

```ts
const userId = (req.user as JwtPayload).userId;

// INSERT INTO items (user_id, title, description, status) VALUES ($1, $2, $3, $4)
// [userId, title, description, status ?? "open"]
```

## 7. Read all (GET)

Plain:

```ts
router.get(
  "/",
  authenticateToken,
  async (_req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM items
         ORDER BY created_at DESC`
      );

      return res.json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
```

With a search (`?search=abc`) and a filter (`?status=open`):

```ts
router.get(
  "/",
  authenticateToken,
  validateResource(itemQuerySchema),
  async (req, res) => {
    const { search, status } = req.query;

    try {
      const conditions: string[] = [];
      const values: string[] = [];

      if (typeof search === "string" && search !== "") {
        values.push(`%${search}%`);
        conditions.push(`title ILIKE $${values.length}`);
      }

      if (typeof status === "string") {
        values.push(status);
        conditions.push(`status = $${values.length}`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const result = await pool.query(
        `SELECT * FROM items ${where} ORDER BY created_at DESC`,
        values
      );

      return res.json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
```

## 8. Read one (GET /:id)

```ts
router.get(
  "/:id",
  authenticateToken,
  validateResource(itemIdSchema),
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        `SELECT * FROM items
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
```

## 9. Update some fields (PATCH)

`COALESCE($1, title)` = "use the new value, or keep the old one if $1 is null".

```ts
router.patch(
  "/:id",
  authenticateToken,
  validateResource(updateItemSchema),
  async (req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body;

    if (title === undefined && description === undefined && status === undefined) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    try {
      const result = await pool.query(
        `UPDATE items
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             status = COALESCE($3, status)
         WHERE id = $4
         RETURNING *`,
        [title ?? null, description ?? null, status ?? null, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
```

Spec says "UPDATE status" only? Keep just that field in the `SET` and in the array.

## 10. Replace everything (PUT)

Every field is required (the Zod schema has no `.partial()`), so no COALESCE:

```ts
router.put(
  "/:id",
  authenticateToken,
  validateResource(replaceItemSchema),
  async (req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body;

    try {
      const result = await pool.query(
        `UPDATE items
         SET title = $1,
             description = $2,
             status = $3
         WHERE id = $4
         RETURNING *`,
        [title, description, status ?? "open", id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
```

## 11. Delete (DELETE)

```ts
router.delete(
  "/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        `DELETE FROM items
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
```

Spec says `validate(...)` for DELETE? Add `validateResource(itemIdSchema),` after `authenticateToken,`.

## 12. The template file (all together)

Copy, rename `item` to your topic, edit the lines marked `// CHANGE`.

```ts
// src/itemRoutes.ts
import { Router } from "express";
import { pool } from "./db";
import { authenticateToken } from "./authMiddleware";
import { validateResource } from "./validate";
// CHANGE: your schema names
import {
  itemQuerySchema,
  itemIdSchema,
  createItemSchema,
  updateItemSchema,
} from "./schemas";

const router = Router();


// ========================================
// READ ALL
// GET /api/items?search=&status=
// ========================================

router.get(
  "/",
  authenticateToken,
  validateResource(itemQuerySchema),
  async (req, res) => {
    const { search, status } = req.query;

    try {
      const conditions: string[] = [];
      const values: string[] = [];

      if (typeof search === "string" && search !== "") {
        values.push(`%${search}%`);
        // CHANGE: the column to search in
        conditions.push(`title ILIKE $${values.length}`);
      }

      if (typeof status === "string") {
        values.push(status);
        conditions.push(`status = $${values.length}`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // CHANGE: table name + order
      const result = await pool.query(
        `SELECT * FROM items ${where} ORDER BY created_at DESC`,
        values
      );

      return res.json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);


// ========================================
// READ ONE
// GET /api/items/:id
// ========================================

router.get(
  "/:id",
  authenticateToken,
  validateResource(itemIdSchema),
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        `SELECT * FROM items
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);


// ========================================
// CREATE
// POST /api/items
// ========================================

router.post(
  "/",
  authenticateToken,
  validateResource(createItemSchema),
  async (req, res) => {
    // CHANGE: your fields (the same as the body schema)
    const { title, description, status } = req.body;

    try {
      // CHANGE: columns, $1..$n, and the array - same order in all 3
      const result = await pool.query(
        `INSERT INTO items (title, description, status)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [title, description, status ?? "open"]
      );

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);


// ========================================
// UPDATE
// PATCH /api/items/:id
// ========================================

router.patch(
  "/:id",
  authenticateToken,
  validateResource(updateItemSchema),
  async (req, res) => {
    const { id } = req.params;
    // CHANGE: only the fields the spec lets you update
    const { title, description, status } = req.body;

    if (title === undefined && description === undefined && status === undefined) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    try {
      const result = await pool.query(
        `UPDATE items
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             status = COALESCE($3, status)
         WHERE id = $4
         RETURNING *`,
        [title ?? null, description ?? null, status ?? null, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);


// ========================================
// DELETE
// DELETE /api/items/:id
// ========================================

router.delete(
  "/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        `DELETE FROM items
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);


export default router;
```

In `index.ts`:

```ts
import itemRoutes from "./itemRoutes";

app.use("/api/items", itemRoutes);
```

---

# Part 4 - Special routes

Each block replaces one route from Part 3.

## 13. "My" data only

The spec says "READ my items". Add `WHERE user_id = $1` with the id from the token.

```ts
router.get(
  "/",
  authenticateToken,
  async (req, res) => {
    const userId = (req.user as JwtPayload).userId;

    try {
      const result = await pool.query(
        `SELECT * FROM items
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      return res.json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
```

Same idea for update / delete: `WHERE id = $1 AND user_id = $2` - someone else's item finds 0 rows -> 404.

## 14. Owner only (403)

The item is visible to everyone, but only its owner may change it. Read it first, then compare.

```ts
router.delete(
  "/:id",
  authenticateToken,
  async (req, res) => {
    const userId = (req.user as JwtPayload).userId;
    const { id } = req.params;

    try {
      const found = await pool.query(
        `SELECT * FROM items
         WHERE id = $1`,
        [id]
      );

      if (found.rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      if (found.rows[0].user_id !== userId) {
        return res.status(403).json({ error: "You can only delete your own items" });
      }

      await pool.query(
        `DELETE FROM items
         WHERE id = $1`,
        [id]
      );

      return res.json(found.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
```

## 15. Action route with a rule (409)

`PATCH /api/books/:id/borrow` - read the row, check the rule, then update.

```ts
router.patch(
  "/:id/borrow",
  authenticateToken,
  validateResource(bookIdSchema),
  async (req, res) => {
    const { id } = req.params;

    try {
      // 1. find it
      const found = await pool.query(
        `SELECT * FROM books
         WHERE id = $1`,
        [id]
      );

      if (found.rows.length === 0) {
        return res.status(404).json({ error: "Book not found" });
      }

      // 2. the rule
      if (!found.rows[0].is_available) {
        return res.status(409).json({ error: "Book is already borrowed" });
      }

      // 3. change it
      const result = await pool.query(
        `UPDATE books
         SET is_available = false
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
```

## 16. Admin only

Add `requireAdmin` right after `authenticateToken` (the token must contain `role`):

```ts
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    // ... same as the normal delete
  }
);
```

`requireAdmin` itself -> `variations/3-stockroom/backend/src/authMiddleware.ts`.

## 17. Duplicate values (UNIQUE -> 409)

A column with `UNIQUE` (email, sku, code): catch Postgres error `23505` in the `catch`.

```ts
    } catch (error: any) {
      console.error(error);

      if (error.code === "23505") {
        return res.status(409).json({ error: "Code already exists" });
      }

      return res.status(500).json({ error: "Internal server error" });
    }
```

---

# Part 5 - Styles compared

## 18. ChatGPT style vs this repo's style

Both work. Pick one and use it everywhere.

| Thing | ChatGPT style | This repo (practice-c) style | Notes |
|---|---|---|---|
| default values | `const { severity = "low" } = req.body;` | `severity ?? "low"` inside the array | same result when the field is missing |
| `return` | `return res.status(201).json(...)` | `res.status(201).json(...)` (return only in `if`s) | always `return` is safer |
| 500 message | `"Internal server error"` + `console.error(error)` | `(error as Error).message` | ChatGPT's hides database details from the client - better for a real app |
| SQL columns | one per line | on one line | only looks |
| `user_id` | inserted from the token | only when the table has it | **the column must exist in `schema.sql`** |

ChatGPT's POST from the chat, and what to check before using it in PulseDesk:

```ts
const {
  title,
  description,
  severity = "low",     // default if missing - fine
  status = "open",
} = req.body;

const userId = (req.user as JwtPayload).userId;

// INSERT INTO incidents (title, description, severity, status, user_id)
//                                                               ^^^^^^^
// PulseDesk's incidents table has NO user_id column
// -> "column user_id does not exist" (500)
// fix: add  user_id UUID REFERENCES users(id)  to schema.sql and re-run it,
//      or remove user_id from the INSERT
```

---

# Part 6 - Final check

## 19. Before you run it

| Check | What goes wrong if you skip it |
|---|---|
| The path doesn't repeat the `index.ts` part (`"/:id"`, not `"/api/items/:id"`) | 404 "Cannot GET" |
| `/mine`, `/search` are above `/:id` | `/mine` is treated as an id |
| Every column in the SQL exists in `schema.sql` | `column "x" does not exist` (500) |
| `$1, $2, ...` and the array are in the same order | values saved in the wrong columns |
| Every `res.status(...)` inside an `if` has `return` | "Cannot set headers after they are sent" |
| The schema names match the imports | the server won't start |
| `export default router;` + `app.use("/api/...", router)` in `index.ts` | 404 for every route |
