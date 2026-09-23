# Types template - `types.ts` for any project

`types.ts` = one TypeScript **interface per table**, with the same names as the columns in `schema.sql`.
Write it right after `schema.sql` (-> `SCHEMA-TEMPLATE.md`).

**Part 1 - The general approach**
1. The shape of every types.ts
2. When a field gets `?`

**Part 2 - Translate**
3. schema.sql type -> TypeScript type
4. Worked example: PulseDesk
5. A different project: Books
6. More tables (user_id, relations, SERIAL)

**Part 3 - Using it**
7. Where the backend uses types.ts
8. Frontend `types/index.ts` - what's different

**Part 4 - Final check**
9. Before you run it

---

# Part 1 - The general approach

## 1. The shape of every types.ts

```ts
// one interface per table, named in singular (table "incidents" -> interface Incident)
export interface Item {
  id?: string;              // the database makes it
  title: string;            // NOT NULL -> required
  description?: string;     // can be NULL -> optional
  status?: string;          // has a DEFAULT -> optional
  created_at?: string;      // the database makes it
}
```

Rules:
- the interface name = the table name in **singular, capital first letter** (`books` -> `Book`)
- every **column** = one field, **same spelling** (`published_year`, not `publishedYear`)
- `password_hash` goes in `User` with `?` - but never send it to the frontend

## 2. When a field gets `?`

| Column in schema.sql | Field | Why |
|---|---|---|
| `id ... DEFAULT gen_random_uuid()` / `SERIAL` | `id?: string` / `id?: number` | the client doesn't send it when creating |
| `created_at ... DEFAULT CURRENT_TIMESTAMP` | `created_at?: string` | the database fills it |
| `... DEFAULT 'open'` / `DEFAULT TRUE` | `status?: string` / `is_available?: boolean` | can be left out |
| no `NOT NULL` (can be NULL) | `content?: string` | can be left out |
| `NOT NULL` without a default | `title: string` (no `?`) | always needed |
| `user_id` (from the token) | `user_id?: string` | the client never sends it |

---

# Part 2 - Translate

## 3. schema.sql type -> TypeScript type

| schema.sql | TypeScript | Note |
|---|---|---|
| `UUID` | `string` | |
| `SERIAL` / `INT` | `number` | |
| `VARCHAR(n)` / `TEXT` | `string` | |
| `BOOLEAN` | `boolean` | |
| `NUMERIC(10, 2)` | `number` | the client sends a number; pg sends it back as text `"9.99"` |
| `DATE` | `string` | `"2026-10-15"` |
| `TIMESTAMP` / `TIMESTAMPTZ` | `string` | |
| `VARCHAR ... CHECK (status IN ('a', 'b'))` | `string` | stricter option: `status?: "a" \| "b"` |
| `... REFERENCES users(id)` | same type as that id (`string` for UUID) | |

## 4. Worked example: PulseDesk

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Field | Reason |
|---|---|---|
| `id UUID ... DEFAULT` | `id?: string` | UUID = string, the database makes it |
| `email ... NOT NULL` | `email: string` | required |
| `password_hash ... NOT NULL` | `password_hash?: string` | only used inside the backend |
| `title ... NOT NULL` | `title: string` | required |
| `description TEXT NOT NULL` | `description: string` | required |
| `severity ... DEFAULT 'low'` | `severity?: string` | has a default |
| `status ... DEFAULT 'open'` | `status?: string` | has a default |
| `created_at ... DEFAULT` | `created_at?: string` | the database makes it |

```ts
// FULL FILE: pulsedesk
export interface User {
  id?: string;
  email: string;
  password_hash?: string;
  created_at?: string;
}

export interface Incident {
  id?: string;
  title: string;
  description: string;
  severity?: string;
  status?: string;
  created_at?: string;
}
```

## 5. A different project: Books

```sql
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    author VARCHAR(100) NOT NULL,
    published_year INT NOT NULL,
    genre VARCHAR(20) DEFAULT 'fiction' CHECK (genre IN ('fiction', 'science', 'history')),
    is_available BOOLEAN DEFAULT TRUE,
    borrowed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

```ts
// FULL FILE: books
export interface User {
  id?: string;
  email: string;
  password_hash?: string;
  created_at?: string;
}

export interface Book {
  id?: string;
  title: string;
  author: string;
  published_year: number;      // INT -> number
  genre?: string;              // has a DEFAULT
  is_available?: boolean;      // BOOLEAN with a DEFAULT
  borrowed_by?: string | null; // UUID that can be NULL
  created_at?: string;
}
```

## 6. More tables (user_id, relations, SERIAL)

```ts
// FULL FILE: more
// ========================================
// user_id -> the row belongs to a user (comes from the token, never the body)
// ========================================
export interface Note {
  id?: string;
  user_id?: string;
  title: string;
  content?: string;
  created_at?: string;
}


// ========================================
// project -> many tasks (task has project_id)
// ========================================
export interface Project {
  id?: string;
  name: string;
  created_at?: string;
}

export interface Task {
  id?: string;
  project_id?: string;     // from the URL (/api/projects/:projectId/tasks)
  title: string;
  status?: string;
  created_at?: string;
}


// ========================================
// money -> number in the body
// ========================================
export interface Product {
  id?: string;
  name: string;
  price: number;           // NUMERIC -> the client sends a number
  stock?: number;
}


// ========================================
// SERIAL ids -> number (like practice-c)
// ========================================
export interface Pie {
  id?: number;
  name: string;
  crust_type: string;
  filling: string;
  is_baked?: boolean;
  slice_count?: number;
}
```

---

# Part 3 - Using it

## 7. Where the backend uses types.ts

Pull fields out of the body with the type:

```ts
import { Incident } from "./types";

const { title, description, severity, status }: Incident = req.body;
```

Type the rows that come back from the database:

```ts
const result = await pool.query<Incident>(
  `SELECT * FROM incidents
   WHERE id = $1`,
  [id]
);

const incident = result.rows[0];   // Incident | undefined
```

## 8. Frontend `types/index.ts` - what's different

The frontend gets **rows back from the server**, so every row HAS an id and its defaults are filled in.

| | Backend `types.ts` | Frontend `types/index.ts` |
|---|---|---|
| Describes | what the client sends + a row | what the server sends back |
| `id` | `id?: string` (not sent when creating) | `id: string` (always there) |
| fields with a DEFAULT | `status?: string` | `status: string` (always filled) |
| `password_hash` | `password_hash?: string` | never there |
| `State` / `Action` | - | copy them **exactly** from the spec |

```ts
// frontend src/types/index.ts
export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at?: string;
}

// + State and Action copied from the spec
```

---

# Part 4 - Final check

## 9. Before you run it

| Check | What goes wrong if you skip it |
|---|---|
| Field names are spelled exactly like the columns | `req.body.publishedYear` is `undefined` -> NULL saved |
| UUID ids are `string`, SERIAL ids are `number` | TypeScript errors comparing ids |
| `NOT NULL` columns without a default have **no** `?` | you forget to send them |
| Columns with a DEFAULT / made by the database have `?` | the create form must send `id` / `created_at` |
| `export` in front of every interface | "has no exported member" |
| The import is `import { Incident } from "./types";` (backend) | "Cannot find module" |
