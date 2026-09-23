# 🧩 Zod template — `schemas.ts` for ANY project

`validate.ts` never changes. `schemas.ts` has the **same shape** in every project —
only the **fields** change. Copy the template, then swap in the blocks you need.

**Legend:** 🟥 `CHANGE` = edit this line for your project · 🟦 body · 🟩 params · 🟨 query

---

## 1. 🚦 How to use it (4 steps)
1. Copy the **template** (section 2) into `src/schemas.ts`
2. Open your **`schema.sql`** → make the fields match the table columns
3. Open the **spec table** → make the update schema allow only what the Description says
4. Check the **names** match what your routes import (`createItemSchema`, `updateItemSchema`...)

---

## 2. 📄 The template (copy this)
```ts
import { z } from "zod";


// ========================================
// AUTH
// ========================================

export const loginSchema = z.object({
  body: z.object({
    email: z.email("Must be a valid email"),                                  // CHANGE: login field (section 3)
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});


// ========================================
// ITEMS                                                                        // CHANGE: your topic
// ========================================

// 🟦 the fields of ONE item (what the client sends when creating)
export const itemBodySchema = z.object({
  title: z.string().min(1, "title is required"),                               // CHANGE: your fields (section 5)
  description: z.string().min(1, "description is required"),
  status: z.enum(["open", "done"]).default("open"),                            // CHANGE: same values as schema.sql
});

// POST /api/items
export const createItemSchema = z.object({
  body: itemBodySchema,
});

// PATCH or PUT /api/items/:id
export const updateItemSchema = z.object({
  body: itemBodySchema.partial(),                                              // CHANGE: see section 6

  params: z.object({
    id: z.uuid("ID must be a valid id"),                                       // CHANGE: see section 7
  }),
});
```
Use it in the routes:
```ts
import { createItemSchema, updateItemSchema } from "./schemas";

router.post("/", authenticateToken, validateResource(createItemSchema), async (req, res) => { ... });
router.patch("/:id", authenticateToken, validateResource(updateItemSchema), async (req, res) => { ... });
```

---

## 3. 🔑 Login field — pick ONE
```ts
// ========================================
// LOGIN WITH ...
// ========================================

// email
email: z.email("Must be a valid email"),

// username (letters, numbers, _ , 3-20 characters)
username: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/, "Username must be 3-20 letters, numbers or _"),

// student number  -> 2024-00123
student_no: z.string().regex(/^\d{4}-\d{5}$/, "Student number must look like 2024-00123"),

// employee number -> T-1001
employee_no: z.string().regex(/^T-\d{4}$/, "Employee number must look like T-1001"),

// mobile number   -> 09171234567
mobile: z.string().regex(/^09\d{9}$/, "Mobile number must look like 09171234567"),
```
> The route uses the same name: `WHERE username = $1`, `WHERE student_no = $1` ...

---

## 4. 📝 Register
```ts
// ========================================
// REGISTER
// ========================================

export const registerSchema = z.object({
  body: z.object({
    email: z.email("Must be a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  }),
});
```
In the route (compare 2 fields):
```ts
if (password !== confirm_password) {
  return res.status(400).json({ error: "Passwords do not match" });
}
```
Need a role? add `role: z.enum(["user", "admin"]).default("user"),`

---

## 5. 📦 Field types — match your `schema.sql` column
| `schema.sql` column | Zod field |
|---|---|
| `VARCHAR(150) NOT NULL` | `z.string().min(1, "x is required").max(150, "x is too long")` |
| `TEXT` (can be empty/missing) | `z.string().optional()` |
| `INT NOT NULL` | `z.number().int("x must be a whole number")` |
| `INT CHECK (x BETWEEN 0 AND 100)` | `z.number().int().min(0).max(100)` |
| `NUMERIC(10,2)` (money) | `z.number().min(0, "price can't be negative")` |
| `BOOLEAN DEFAULT FALSE` | `z.boolean().default(false)` |
| `VARCHAR ... CHECK (status IN ('a','b'))` | `z.enum(["a", "b"])` (+ `.default("a")` if it has a DEFAULT) |
| `DATE` | `z.iso.date("x must look like 2026-10-15")` |
| `TIMESTAMPTZ` (date + time from a form) | `z.iso.datetime({ local: true })` |
| `VARCHAR ... UNIQUE` (email) | `z.email("Must be a valid email")` |
| `UUID REFERENCES other(id)` | `z.uuid("other_id must be a valid id")` |
| `SERIAL` / `INT REFERENCES other(id)` | `z.number().int()` |

Example — a table turned into a body schema:
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
> Columns the database fills itself (`id`, `created_at`, `user_id` from the token) are **never** in the body schema.

---

## 6. ✏️ Update schema — read the Description column
```ts
// ========================================
// A) "UPDATE Item"  -> any field can change
// ========================================
export const updateItemSchema = z.object({
  body: itemBodySchema.partial(),
  params: z.object({ id: z.uuid("ID must be a valid id") }),
});


// ========================================
// B) "UPDATE Status/Severity"  -> ONLY those fields
// ========================================
export const updateIncidentSchema = z.object({
  body: z.object({
    status: z.enum(["open", "in_progress", "resolved"]).optional(),
    severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  }),
  params: z.object({ id: z.uuid("ID must be a valid id") }),
});

// same as B, shorter: take 2 fields from the body schema, make them optional
//   body: incidentBodySchema.pick({ status: true, severity: true }).partial(),


// ========================================
// C) PUT "UPDATE all details"  -> every field required
// ========================================
export const replaceItemSchema = z.object({
  body: itemBodySchema,                  // no .partial()
  params: z.object({ id: z.uuid("ID must be a valid id") }),
});
```
With A or B, `{}` passes → add this in the route:
```ts
if (status === undefined && severity === undefined) {
  return res.status(400).json({ error: "No fields provided for update" });
}
```

---

## 7. 🟩 params — the id in the URL
```ts
// ========================================
// ID TYPE  (look at schema.sql)
// ========================================

// id UUID PRIMARY KEY ...      -> /api/items/3cf1bffc-7dc2-...
params: z.object({
  id: z.uuid("ID must be a valid id"),
}),

// id SERIAL PRIMARY KEY        -> /api/items/3
params: z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),    // params are always strings
}),
```

For routes with **no body** (DELETE, or action routes like `/:id/borrow`):
```ts
export const itemIdSchema = z.object({
  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),
});
// router.patch("/:id/borrow", authenticateToken, validateResource(itemIdSchema), ...)
```

**Nested** route `/api/projects/:projectId/tasks` → the param name must match the route:
```ts
export const createTaskSchema = z.object({
  params: z.object({
    projectId: z.uuid("projectId must be a valid id"),     // same name as :projectId
  }),
  body: z.object({
    title: z.string().min(1, "title is required"),
  }),
});
```

---

## 8. 🟨 query — filters after `?`
Query values are **always strings** (`?page=2` → `"2"`, `?available=true` → `"true"`).
```ts
// ========================================
// GET /api/items?search=abc&status=open&page=2
// ========================================

export const itemQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    status: z.enum(["open", "done"]).optional(),
    available: z.enum(["true", "false"]).optional(),                       // NOT z.boolean()
    page: z.string().regex(/^\d+$/, "page must be a number").optional(),   // NOT z.number()
  }),
});
```
In the route, turn them into real values:
```ts
const { status, available, page } = req.query;
const isAvailable = available === "true";        // "true" -> true
const pageNumber = Number(page ?? "1");          // "2"    -> 2
```

---

## 9. 📋 Body with a list (array)
```ts
// ========================================
// POST /api/orders
// { "customer_name": "Ana", "items": [ { "menu_item_id": "...", "quantity": 2 } ] }
// ========================================

export const createOrderSchema = z.object({
  body: z.object({
    customer_name: z.string().min(1, "customer_name is required"),

    items: z
      .array(
        z.object({
          menu_item_id: z.uuid("menu_item_id must be a valid id"),
          quantity: z.number().int().min(1, "quantity must be at least 1"),
        })
      )
      .min(1, "An order needs at least 1 item"),
  }),
});
```

---

## 10. 🔁 Worked example — spec table → `schemas.ts`
The PulseDesk table, one row at a time:

| Spec row | Schema you write |
|---|---|
| POST `/api/auth/login` · **Zod Login** | `loginSchema` → `body: { email, password }` |
| POST `/api/incidents` · **validate(createIncidentSchema)** | `createIncidentSchema` → `body: incidentBodySchema` |
| GET `/api/incidents` · **None** | nothing |
| PATCH `/api/incidents/:id` · **validate(updateIncidentSchema)** · **Status/Severity** | `updateIncidentSchema` → `body: { status?, severity? }` + `params: { id }` (section 6 B) |
| DELETE `/api/incidents/:id` · **None** | nothing |

```ts
import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.email("Must be a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const incidentBodySchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required"),
  severity: z.enum(["low", "medium", "high", "critical"]).default("low"),
  status: z.enum(["open", "in_progress", "resolved"]).default("open"),
});

export const createIncidentSchema = z.object({
  body: incidentBodySchema,
});

export const updateIncidentSchema = z.object({
  body: z.object({
    status: z.enum(["open", "in_progress", "resolved"]).optional(),
    severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  }),
  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),
});
```

---

## 11. ✅ Final check (before `npm run dev`)
| Check | Why |
|---|---|
| Names match the imports in your routes (`updateIncidentSchema`, not `updateIncidinteSchema`) | a typo = the server won't start |
| Every field name = the **column** in `schema.sql` = the **key** the frontend sends | `description` vs `desc` → 400 or a null column |
| Enum values = the `CHECK (... IN (...))` in `schema.sql` = the frontend `<option>`s | otherwise 400 or error 23514 |
| `id` check matches the id type (`UUID` → `z.uuid()`, `SERIAL` → `regex(/^\d+$/)`) | wrong one = every PATCH/DELETE gets 400 |
| Numbers: the frontend sends `Number(value)` | inputs give strings → 400 |
| Update schema allows only what the Description says | "Status/Severity" → only those 2 |
| Wrapped in `{ body }` / `{ params }` / `{ query }` | `validateResource` passes all three |
