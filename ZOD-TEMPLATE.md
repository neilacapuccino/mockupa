# Zod template - `schemas.ts` for any project

`validate.ts` never changes.
`schemas.ts` has the same shape in every project - only the fields change.

Every block below is a **complete `schemas.ts` file**. Pick the one closest to your
exam, copy all of it, then edit the lines marked `// CHANGE`.

1. Template (start here)
2. Translate a table: schema.sql -> every schema (step by step)
3. Full example: PulseDesk
4. Full example: SERIAL (number) ids
5. Full example: username login + register
6. Full example: query, params only, nested route, list in the body
7. Tables: schema.sql column -> Zod, spec Description -> update schema, login fields
8. Final check

---

## 1. Template (start here)

```ts
import { z } from "zod";


// ========================================
// AUTH
// ========================================

// CHANGE: the login field (email / username / student_no / mobile)
export const loginSchema = z.object({
  body: z.object({
    email: z.email("Must be a valid email"),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  }),
});


// ========================================
// ITEMS
// CHANGE: rename "item" to your topic
// ========================================

// CHANGE: one field per column in schema.sql
// (NOT id, created_at or user_id - the database / token gives those)
export const itemBodySchema = z.object({
  title: z
    .string()
    .min(1, "title is required"),

  description: z
    .string()
    .min(1, "description is required"),

  // CHANGE: the same values as the CHECK (...) in schema.sql
  status: z
    .enum(["open", "done"])
    .default("open"),
});


// POST /api/items
export const createItemSchema = z.object({
  body: itemBodySchema,
});


// PATCH /api/items/:id
export const updateItemSchema = z.object({
  // CHANGE: .partial() = any field can change
  // if the spec says "UPDATE x/y", list only x and y (see section 3)
  body: itemBodySchema.partial(),

  params: z.object({
    // CHANGE: UUID ids   -> z.uuid(...)
    //         SERIAL ids -> z.string().regex(/^\d+$/, "ID must be a number")
    id: z.uuid("ID must be a valid id"),
  }),
});
```

How the routes use it:

```ts
import { createItemSchema, updateItemSchema } from "./schemas";

router.post(
  "/",
  authenticateToken,
  validateResource(createItemSchema),
  async (req, res) => {
    // ...
  }
);

router.patch(
  "/:id",
  authenticateToken,
  validateResource(updateItemSchema),
  async (req, res) => {
    const { title, description, status } = req.body;

    // .partial() lets {} pass, so check it here
    if (title === undefined && description === undefined && status === undefined) {
      return res.status(400).json({
        error: "No fields provided for update",
      });
    }

    // ...
  }
);
```

---

## 2. Translate a table: schema.sql -> every schema (step by step)

### Step 1 - the table

```sql
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    author VARCHAR(100) NOT NULL,
    published_year INT NOT NULL,
    genre VARCHAR(20) DEFAULT 'fiction' CHECK (genre IN ('fiction', 'science', 'history')),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2 - decide where each column goes

| Column | Goes in | Why |
|---|---|---|
| `id` | **params** (`/api/books/:id`) | the database makes it; the client only sends it in the URL |
| `title` | **body** (required) | `NOT NULL`, the client types it |
| `author` | **body** (required) | `NOT NULL` |
| `published_year` | **body** (required) | `NOT NULL` |
| `genre` | **body** (optional) | has a `DEFAULT` |
| `is_available` | **body** (optional) | has a `DEFAULT` |
| `created_at` | nowhere | the database fills it |

Rule: `NOT NULL` without a default = required. Has a `DEFAULT` = `.default(...)`.
`id`, `created_at`, and `user_id` (from the token) are never in the body.

### Step 3 - the body schema (one line per column)

```ts
export const bookBodySchema = z.object({
  title: z.string().min(1, "title is required").max(150, "title is too long"),
  author: z.string().min(1, "author is required").max(100, "author is too long"),
  published_year: z.number().int("year must be a whole number").min(1450).max(2100),
  genre: z.enum(["fiction", "science", "history"]).default("fiction"),
  is_available: z.boolean().default(true),
  // NOT here: id, created_at  (the database makes them)
});
```

### Step 4 - the create schema (POST /api/books)

Wrap the body schema in `body`:

```ts
export const createBookSchema = z.object({
  body: bookBodySchema,
});
```

What the client sends:

```json
{ "title": "Refactoring", "author": "Martin Fowler", "published_year": 2018 }
```

### Step 5 - the update schema (PATCH / PUT /api/books/:id)

The body depends on the spec's **Description** column. The `params` part comes from the `id` column:
`id UUID` -> `z.uuid(...)`, `id SERIAL` -> `z.string().regex(/^\d+$/, ...)`.

**A) "UPDATE Book" - any field can change**

```ts
export const updateBookSchema = z.object({
  body: bookBodySchema.partial(),
  params: z.object({ id: z.uuid("ID must be a valid id") }),
});
```

```json
{ "published_year": 2019 }
```

**B) "UPDATE Availability" - only one field**

```ts
export const updateAvailabilitySchema = z.object({
  body: z.object({ is_available: z.boolean() }),
  params: z.object({ id: z.uuid("ID must be a valid id") }),
});
```

```json
{ "is_available": false }
```

**C) PUT "UPDATE all book details" - every field required**

```ts
export const replaceBookSchema = z.object({
  body: bookBodySchema,
  params: z.object({ id: z.uuid("ID must be a valid id") }),
});
```

```json
{ "title": "Refactoring 2nd Ed.", "author": "Martin Fowler", "published_year": 2018, "genre": "science", "is_available": true }
```

### Step 6 - id only (DELETE, or action routes like /:id/borrow)

No body, so only the `params` part:

```ts
export const bookIdSchema = z.object({
  params: z.object({ id: z.uuid("ID must be a valid id") }),
});
```

### Step 7 - the query schema (GET /api/books?genre=science&available=true)

Filters also come from the columns - but query values are always **text**:

```ts
export const bookQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),                                  // title ILIKE
    genre: z.enum(["fiction", "science", "history"]).optional(),    // same values as the CHECK
    available: z.enum(["true", "false"]).optional(),                // BOOLEAN column -> "true" / "false"
  }),
});
```

### Step 8 - the finished file

```ts
import { z } from "zod";


// ========================================
// BOOKS
// ========================================

export const bookBodySchema = z.object({
  title: z.string().min(1, "title is required").max(150, "title is too long"),
  author: z.string().min(1, "author is required").max(100, "author is too long"),
  published_year: z.number().int("year must be a whole number").min(1450).max(2100),
  genre: z.enum(["fiction", "science", "history"]).default("fiction"),
  is_available: z.boolean().default(true),
});

// GET /api/books?search=&genre=&available=
export const bookQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    genre: z.enum(["fiction", "science", "history"]).optional(),
    available: z.enum(["true", "false"]).optional(),
  }),
});

// POST /api/books
export const createBookSchema = z.object({
  body: bookBodySchema,
});

// PATCH /api/books/:id
export const updateBookSchema = z.object({
  body: bookBodySchema.partial(),
  params: z.object({ id: z.uuid("ID must be a valid id") }),
});

// DELETE /api/books/:id
export const bookIdSchema = z.object({
  params: z.object({ id: z.uuid("ID must be a valid id") }),
});
```

How the routes use it:

```ts
router.get("/", authenticateToken, validateResource(bookQuerySchema), async (req, res) => { ... });
router.post("/", authenticateToken, validateResource(createBookSchema), async (req, res) => { ... });
router.patch("/:id", authenticateToken, validateResource(updateBookSchema), async (req, res) => { ... });
router.delete("/:id", authenticateToken, validateResource(bookIdSchema), async (req, res) => { ... });
```

### Same steps, another table: SERIAL id + user_id

```sql
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    title VARCHAR(100) NOT NULL,
    content TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Goes in |
|---|---|
| `id SERIAL` | params -> `z.string().regex(/^\d+$/, ...)` (the URL is text) |
| `user_id` | nowhere - the route takes it from the token |
| `title` | body, required |
| `content` | body, `.optional()` (no `NOT NULL`, no default) |
| `is_pinned` | body, `.default(false)` |
| `created_at` | nowhere |

```ts
import { z } from "zod";


// ========================================
// NOTES
// ========================================

export const noteBodySchema = z.object({
  title: z.string().min(1, "title is required").max(100, "title is too long"),
  content: z.string().optional(),
  is_pinned: z.boolean().default(false),
  // NOT here: id, user_id (from the token), created_at
});

// POST /api/notes
export const createNoteSchema = z.object({
  body: noteBodySchema,
});

// PUT /api/notes/:id
export const updateNoteSchema = z.object({
  body: noteBodySchema.partial(),
  params: z.object({ id: z.string().regex(/^\d+$/, "ID must be a number") }),
});

// DELETE /api/notes/:id
export const noteIdSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/, "ID must be a number") }),
});
```

In the route, `user_id` comes from the token, not the body:

```ts
const userId = (req.user as JwtPayload).userId;
const { title, content, is_pinned } = req.body;

await pool.query(
  `INSERT INTO notes (user_id, title, content, is_pinned) VALUES ($1, $2, $3, $4) RETURNING *`,
  [userId, title, content ?? null, is_pinned ?? false]
);
```

---

## 3. Full example: PulseDesk

Spec: login = "Zod Login", POST = `createIncidentSchema`,
PATCH = `updateIncidentSchema` that updates **Status/Severity** only.

```ts
import { z } from "zod";


// ========================================
// AUTH
// ========================================

export const loginSchema = z.object({
  body: z.object({
    email: z.email("Must be a valid email"),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  }),
});


// ========================================
// INCIDENTS
// ========================================

export const incidentBodySchema = z.object({
  title: z
    .string()
    .min(1, "title is required"),

  description: z
    .string()
    .min(1, "description is required"),

  severity: z
    .enum(["low", "medium", "high", "critical"])
    .default("low"),

  status: z
    .enum(["open", "in_progress", "resolved"])
    .default("open"),
});


// POST /api/incidents
export const createIncidentSchema = z.object({
  body: incidentBodySchema,
});


// PATCH /api/incidents/:id  ->  "UPDATE Status/Severity"
// only these 2 fields are allowed
export const updateIncidentSchema = z.object({
  body: z.object({
    status: z
      .enum(["open", "in_progress", "resolved"])
      .optional(),

    severity: z
      .enum(["low", "medium", "high", "critical"])
      .optional(),
  }),

  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),
});
```

---

## 4. Full example: SERIAL (number) ids

Same as practice-c. Use this when `schema.sql` has `id SERIAL PRIMARY KEY`.

```ts
import { z } from "zod";


// ========================================
// AUTH
// ========================================

export const loginSchema = z.object({
  body: z.object({
    email: z.email("Must be a valid email"),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  }),
});


// ========================================
// TASKS
// ========================================

export const taskBodySchema = z.object({
  title: z
    .string()
    .min(1, "title is required"),

  completed: z
    .boolean()
    .default(false),
});


// POST /api/tasks
export const createTaskSchema = z.object({
  body: taskBodySchema,
});


// PUT /api/tasks/:id
export const updateTaskSchema = z.object({
  body: taskBodySchema.partial(),

  params: z.object({
    // the URL is always text, so check "only digits"
    id: z
      .string()
      .regex(/^\d+$/, "ID must be a number"),
  }),
});
```

---

## 5. Full example: username login + register

```ts
import { z } from "zod";


// ========================================
// REGISTER
// POST /api/auth/register
// ========================================

export const registerSchema = z.object({
  body: z.object({
    // letters, numbers and _ only, 3 to 20 characters
    username: z
      .string()
      .regex(/^[a-zA-Z0-9_]{3,20}$/, "Username must be 3-20 letters, numbers or _"),

    display_name: z
      .string()
      .min(1, "display_name is required"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),

    confirm_password: z
      .string()
      .min(1, "Please confirm your password"),

    role: z
      .enum(["user", "admin"])
      .default("user"),
  }),
});


// ========================================
// LOGIN
// POST /api/auth/login
// ========================================

export const loginSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(1, "username is required"),

    password: z
      .string()
      .min(1, "password is required"),
  }),
});


// ========================================
// CHANGE PASSWORD
// PATCH /api/auth/password
// ========================================

export const changePasswordSchema = z.object({
  body: z.object({
    current_password: z
      .string()
      .min(1, "current_password is required"),

    new_password: z
      .string()
      .min(8, "New password must be at least 8 characters"),
  }),
});
```

Zod checks each field alone. "Both passwords must match" goes in the register route:

```ts
const { password, confirm_password } = req.body;

if (password !== confirm_password) {
  return res.status(400).json({
    error: "Passwords do not match",
  });
}
```

---

## 6. Full example: query, params only, nested route, list in the body

A shop with categories, products and orders.

```ts
import { z } from "zod";


// ========================================
// GET /api/products?search=latte&category=coffee&available=true&page=2
// query values are ALWAYS text
// ========================================

export const productQuerySchema = z.object({
  query: z.object({
    search: z
      .string()
      .optional(),

    category: z
      .enum(["coffee", "tea", "pastry"])
      .optional(),

    // "true" / "false" as text - NOT z.boolean()
    available: z
      .enum(["true", "false"])
      .optional(),

    // "2" as text - NOT z.number()
    page: z
      .string()
      .regex(/^\d+$/, "page must be a number")
      .optional(),
  }),
});


// ========================================
// PATCH /api/products/:id/restock
// DELETE /api/products/:id
// no body -> only the id is checked
// ========================================

export const productIdSchema = z.object({
  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),
});


// ========================================
// POST /api/categories/:categoryId/products
// nested route -> the name must match ":categoryId"
// ========================================

export const createProductSchema = z.object({
  params: z.object({
    categoryId: z.uuid("categoryId must be a valid id"),
  }),

  body: z.object({
    name: z
      .string()
      .min(1, "name is required")
      .max(100, "name is too long"),

    price: z
      .number()
      .min(0, "price can't be negative"),

    stock: z
      .number()
      .int("stock must be a whole number")
      .min(0, "stock can't be negative")
      .default(0),
  }),
});


// ========================================
// POST /api/orders
// {
//   "customer_name": "Ana",
//   "items": [ { "product_id": "...", "quantity": 2 } ]
// }
// ========================================

export const createOrderSchema = z.object({
  body: z.object({
    customer_name: z
      .string()
      .min(1, "customer_name is required"),

    items: z
      .array(
        z.object({
          product_id: z.uuid("product_id must be a valid id"),

          quantity: z
            .number()
            .int("quantity must be a whole number")
            .min(1, "quantity must be at least 1"),
        })
      )
      .min(1, "An order needs at least 1 item"),
  }),
});
```

In the routes, the query values are turned into real values:

```ts
const { available, page } = req.query;

// "true" -> true
const isAvailable = available === "true";

// "2" -> 2
const pageNumber = Number(page ?? "1");
```

---

## 7. Tables

### schema.sql column -> Zod field

| schema.sql column | Zod field |
|---|---|
| `VARCHAR(150) NOT NULL` | `z.string().min(1, "...").max(150, "...")` |
| `TEXT` that can be empty | `z.string().optional()` |
| `INT NOT NULL` | `z.number().int("...")` |
| `INT CHECK (x BETWEEN 0 AND 100)` | `z.number().int().min(0).max(100)` |
| `NUMERIC(10,2)` (money) | `z.number().min(0, "...")` |
| `BOOLEAN DEFAULT FALSE` | `z.boolean().default(false)` |
| `CHECK (status IN ('a', 'b'))` | `z.enum(["a", "b"])` |
| `... DEFAULT 'a'` | add `.default("a")` |
| `DATE` | `z.iso.date("...")` |
| `TIMESTAMPTZ` from a form | `z.iso.datetime({ local: true })` |
| email column | `z.email("...")` |
| `UUID REFERENCES other(id)` | `z.uuid("...")` |
| `id`, `created_at`, `user_id` | not in the body schema |

### Spec "Description" -> update schema

| Description says | Update body |
|---|---|
| UPDATE Item (anything) | `itemBodySchema.partial()` |
| UPDATE Status/Severity | `z.object({ status: ...optional(), severity: ...optional() })` |
| PUT all details | `itemBodySchema` (no `.partial()`) |
| an action like `/:id/borrow` | no body, only `params: { id }` |

### Login field options

| Login with | Zod field | Example value |
|---|---|---|
| email | `z.email("Must be a valid email")` | `ana@mail.com` |
| username | `z.string().regex(/^[a-zA-Z0-9_]{3,20}$/, "...")` | `juan_dev` |
| student number | `z.string().regex(/^\d{4}-\d{5}$/, "...")` | `2024-00123` |
| employee number | `z.string().regex(/^T-\d{4}$/, "...")` | `T-1001` |
| mobile number | `z.string().regex(/^09\d{9}$/, "...")` | `09171234567` |

The route searches the same column: `WHERE username = $1`, `WHERE student_no = $1`, ...

---

## 8. Final check

| Check | What goes wrong if you skip it |
|---|---|
| Schema names match the imports in your routes | a typo means the server won't start |
| Field names = `schema.sql` columns = the keys the frontend sends | 400, or a column saved as null |
| Enum values = the `CHECK (...)` in `schema.sql` = the frontend options | 400, or database error 23514 |
| The id check matches the id type (UUID or SERIAL) | every PATCH / DELETE returns 400 |
| The frontend sends numbers with `Number(value)` | "expected number, received string" |
| The update allows only what the Description says | extra fields get through |
| Every schema is wrapped in `body` / `params` / `query` | the validation checks nothing |
