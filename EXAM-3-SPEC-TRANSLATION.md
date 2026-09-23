# Exam 3 - Translate the spec: schema.sql, interfaces, Zod schemas, types

You get a spec like PulseDesk: an overview, an API table, and the frontend `State` + `Action`.
This guide shows **the approach**: how to read it and turn it into the 4 "data" files, in order.

| # | File | What it describes |
|---|---|---|
| 1 | `backend/schema.sql` | the database tables |
| 2 | `backend/src/types.ts` | one row of each table, in TypeScript (`interface`) |
| 3 | `backend/src/schemas.ts` | what the client is allowed to send (Zod) |
| 4 | `frontend/src/types/index.ts` | the frontend `State`, `Action`, and item `interface` |

Detailed guides for each file: `BACKEND-1-SCHEMA.md`, `BACKEND-2-TYPES.md`, `BACKEND-3-ZOD.md`, `FRONTEND-1-TYPES.md`.

**Part 1 - The approach**
1. The idea: one field list -> four files
2. Where each answer hides in the spec
3. What the Actions tell you about the backend

**Part 2 - PulseDesk, step by step**
4. Step 1: the field list (on paper)
5. Step 2: `schema.sql`
6. Step 3: `src/types.ts` (backend interface)
7. Step 4: `src/schemas.ts` (Zod, from the Middleware column)
8. Step 5: `src/types/index.ts` (frontend interface + types)
9. One field, four places

**Part 3 - interface or type?**
10. When to use which
11. The symbols: `?`, `| null`, `[]`, `any`

**Part 4 - A different spec, same approach**
12. EquipLend (number ids)

**Part 5 - Final check**
13. Checklist

---

# Part 1 - The approach

## 1. The idea: one field list -> four files

Don't start with a file. Start with a **list of fields** on paper. All 4 files are the same list,
written in 4 languages:

```
                      field list (paper)
                             |
     +-----------------+-----+------------+----------------------+
     |                 |                  |                      |
 schema.sql        types.ts           schemas.ts          types/index.ts
 (SQL columns)     (backend           (Zod: what the      (frontend: what
                   interface)         client may send)    the screen uses)
```

The order is the order the data flows: **database -> backend -> validation -> frontend**.
Each file is copied from the one before, so the names stay the same everywhere.

Two rules for the whole approach:
- **Copy what the spec gives, exactly.** `State`, `Action`, schema names (`createIncidentSchema`), routes.
- **Invent only what is missing, and write it down once.** PulseDesk never lists the severity values
  or the `Incident` fields. You decide them in the field list, then use the same values in every file.

## 2. Where each answer hides in the spec

| Spec part | Sentence / cell | Tells you |
|---|---|---|
| Overview | "users **submit support tickets**" | main table = `incidents` (tickets) |
| Overview | "**authenticated** users" | a `users` table + login |
| Overview | "update ticket **severity/status**" | 2 columns: `severity`, `status` |
| Overview | "delete **resolved** tickets" | `status` has a value `resolved` |
| API table, Endpoint | `/api/incidents`, `/api/incidents/:id` | route paths, the table name |
| API table, Protection | "JWT Protected" | `authenticateToken` on that route |
| API table, Middleware | "Zod Login" | `loginSchema` |
| API table, Middleware | `validate(createIncidentSchema)` | a Zod schema with THAT exact name, for the body of POST |
| API table, Middleware | `validate(updateIncidentSchema)` | a Zod schema with THAT exact name, for PATCH |
| API table, Middleware | "None" | no Zod schema on that route |
| API table, Description | "UPDATE **Status/Severity**" | the update schema has ONLY `status` and `severity` |
| API table, Description | "Returns JWT Token" | login answers with a token |
| State | `user: { id: string; email: string }` | `users` has `id` + `email` -> login with **email** |
| State | `incidents: Incident[]` | you must write the `Incident` interface yourself |
| Action | `DELETE_SUCCESS; payload: string` | ids are **strings** -> `UUID` in the database |
| initialState | `token: localStorage.getItem('token')` | save the token in `localStorage` after login |

Fields the spec does not name but every ticket needs: `title` and `description` ("submit a ticket" = write what is wrong),
`id`, and `created_at` (to sort newest first).

## 3. What the Actions tell you about the backend

The frontend `Action` list tells you what each route must **answer**:

| Action | Payload | So the route must return | Code in the route |
|---|---|---|---|
| `SET_AUTH` | `{ user, token }` | login: the token AND the user | `res.json({ token, user: { id, email } })` |
| `FETCH_SUCCESS` | `Incident[]` | GET: an array of rows | `res.json(result.rows)` |
| `CREATE_SUCCESS` | `Incident` | POST: the new row (with its new id) | `RETURNING *` + `res.status(201).json(result.rows[0])` |
| `UPDATE_SUCCESS` | `Incident` | PATCH: the updated row | `RETURNING *` + `res.json(result.rows[0])` |
| `DELETE_SUCCESS` | `string` (the id) | DELETE: anything (the frontend already knows the id) | `res.json(result.rows[0])` or a message |
| `SET_ERROR` | `string` | errors: a message | `res.status(...).json({ error: "..." })` |

---

# Part 2 - PulseDesk, step by step

## 4. Step 1: the field list (on paper)

Make this table first. Every column of it is used by one of the files.

| Field | SQL | TS type | Sent on create? | Changed on update? | Allowed values | Default |
|---|---|---|---|---|---|---|
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | `string` | no (DB makes it) | no | - | automatic |
| `title` | `VARCHAR(150) NOT NULL` | `string` | **required** | no | not empty | - |
| `description` | `TEXT NOT NULL` | `string` | **required** | no | not empty | - |
| `severity` | `VARCHAR(20) DEFAULT 'low'` | `string` | optional | **yes** | low, medium, high, critical | `low` |
| `status` | `VARCHAR(20) DEFAULT 'open'` | `string` | optional | **yes** | open, in_progress, resolved | `open` |
| `created_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | `string` | no | no | - | automatic |

And the users table (the same in almost every exam):

| Field | SQL | TS type | Notes |
|---|---|---|---|
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | `string` | same id type as the main table |
| `email` | `VARCHAR(255) UNIQUE NOT NULL` | `string` | the login field (from `State.user`) |
| `password_hash` | `VARCHAR(255) NOT NULL` | `string` | never sent to the frontend |
| `created_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | `string` | |

How to fill in each column:

| Column | Question | PulseDesk answer |
|---|---|---|
| Field | what does the overview / the forms mention? | title, description, severity, status |
| SQL | text -> `VARCHAR(n)` or `TEXT`, whole number -> `INTEGER`, money -> `NUMERIC(10,2)`, yes/no -> `BOOLEAN`, date -> `DATE` / `TIMESTAMP` | all text |
| TS type | `VARCHAR` / `TEXT` / `UUID` / dates -> `string`, `INTEGER` / `SERIAL` -> `number`, `BOOLEAN` -> `boolean` | all `string` |
| Sent on create? | does the user type it in the "new" form? | title, description (+ severity, status optional) |
| Changed on update? | read the update row's Description | only "Status/Severity" |
| Allowed values | is it a "type / level / status"? then it is a fixed list | severity, status |
| Default | what should it be when the user does not choose? | `low`, `open` |

## 5. Step 2: `schema.sql`

One line per field, straight from the SQL column of the list.

```sql
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS users;

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
    severity VARCHAR(20) DEFAULT 'low',
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- login account: admin@pulsedesk.com / password123
INSERT INTO users (email, password_hash)
VALUES ('admin@pulsedesk.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');
```

| From the list | Becomes |
|---|---|
| "DB makes it" | `DEFAULT gen_random_uuid()` / `DEFAULT CURRENT_TIMESTAMP` |
| "required" | `NOT NULL` |
| a default value | `DEFAULT 'low'` |
| "no duplicates" (email) | `UNIQUE` |
| allowed values (optional extra safety) | `CHECK (severity IN ('low', 'medium', 'high', 'critical'))` |

Order of the `DROP` lines: the table that points to the other one is dropped first.
More (foreign keys, `user_id`, `SERIAL`): `BACKEND-1-SCHEMA.md`.

## 6. Step 3: `src/types.ts` (backend interface)

One `interface` per table. Same names as the columns. Same types as the TS column of the list.

```ts
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

Why `?` here: the backend uses this for `req.body` too. The client does not send `id` or `created_at`,
and may skip `severity` / `status`. So: **required on create -> no `?`, everything else -> `?`**.

Used in a route like this:
```ts
const { title, description, severity, status }: Incident = req.body;
```

## 7. Step 4: `src/schemas.ts` (Zod, from the Middleware column)

Go down the Middleware column. **Each name in it = one exported schema, with that exact name.**

| API row | Middleware cell | Schema | Parts it checks |
|---|---|---|---|
| POST `/api/auth/login` | "Zod Login" | `loginSchema` | `body`: email, password |
| POST `/api/incidents` | `validate(createIncidentSchema)` | `createIncidentSchema` | `body`: the "sent on create" fields |
| GET `/api/incidents` | None | - | - |
| PATCH `/api/incidents/:id` | `validate(updateIncidentSchema)` | `updateIncidentSchema` | `body`: the "changed on update" fields, all optional + `params`: id |
| DELETE `/api/incidents/:id` | None | - | - |

```ts
import { z } from "zod";

// "Zod Login"
export const loginSchema = z.object({
  body: z.object({
    email: z.email("Must be a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

// validate(createIncidentSchema) -> the "sent on create" fields
export const createIncidentSchema = z.object({
  body: z.object({
    title: z.string().min(1, "title is required"),
    description: z.string().min(1, "description is required"),
    severity: z.enum(["low", "medium", "high", "critical"]).optional().default("low"),
    status: z.enum(["open", "in_progress", "resolved"]).optional().default("open"),
  }),
});

// validate(updateIncidentSchema) -> "UPDATE Status/Severity" -> only these 2, both optional
export const updateIncidentSchema = z.object({
  body: z.object({
    status: z.enum(["open", "in_progress", "resolved"]).optional(),
    severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  }),
  params: z.object({
    // UUID ids -> z.uuid()
    // SERIAL ids -> z.string().regex(/^\d+$/, "ID must be a number")
    id: z.uuid("ID must be a valid id"),
  }),
});
```

From the field list to Zod:

| Field list says | Zod |
|---|---|
| required text | `z.string().min(1, "x is required")` |
| optional with a default | `.optional().default("low")` |
| optional, no default (update) | `.optional()` |
| allowed values | `z.enum([...])` (the same values as the list) |
| a number | `z.number()` (+ `.int()`, `.min(0)`) |
| an email | `z.email("...")` |
| the id in the URL | `params: z.object({ id: z.uuid() })` |

The spec writes `validate(...)`. Your middleware is called `validateResource`.
Add this one line to `validate.ts` so both names work (`INSTALL.md` already does it):
```ts
export const validate = validateResource;
```
More Zod methods: `BACKEND-3-ZOD.md`.

## 8. Step 5: `src/types/index.ts` (frontend interface + types)

Two parts: what you **copy** from the spec, and what you **write**.

```ts
// WRITE: the spec uses Incident[] but never shows it -> make it from the field list
export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at?: string;
}

// COPY: exactly as the spec shows it
export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  incidents: Incident[];
  loading: boolean;
  error: string | null;
}

// COPY: exactly as the spec shows it
export type Action =
  | { type: "SET_AUTH"; payload: { user: any; token: string } }
  | { type: "FETCH_SUCCESS"; payload: Incident[] }
  | { type: "CREATE_SUCCESS"; payload: Incident }
  | { type: "UPDATE_SUCCESS"; payload: Incident }
  | { type: "DELETE_SUCCESS"; payload: string }
  | { type: "SET_ERROR"; payload: string };
```

Why the frontend `Incident` has fewer `?` than the backend one: the frontend gets rows FROM the database,
and the database always fills `id`, `severity`, and `status`. Only `created_at` is optional in case you don't show it.

Optional extras (write a comment that says they are extra):
```ts
  // extra (not in the spec)
  | { type: "FETCH_START" }
  | { type: "LOGOUT" };

// the dropdown values = the Zod enums
export const SEVERITIES = ["low", "medium", "high", "critical"];
export const STATUSES = ["open", "in_progress", "resolved"];
```

## 9. One field, four places

Follow `severity` through all 4 files. The name and the values never change.

| File | `severity` |
|---|---|
| `schema.sql` | `severity VARCHAR(20) DEFAULT 'low',` |
| `src/types.ts` | `severity?: string;` |
| `src/schemas.ts` | `severity: z.enum(["low", "medium", "high", "critical"]).optional().default("low"),` |
| `src/types/index.ts` | `severity: string;` + `SEVERITIES = ["low", "medium", "high", "critical"]` |

And `id`:

| File | `id` |
|---|---|
| `schema.sql` | `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),` |
| `src/types.ts` | `id?: string;` |
| `src/schemas.ts` | `params: z.object({ id: z.uuid("ID must be a valid id") })` |
| `src/types/index.ts` | `id: string;` and `DELETE_SUCCESS; payload: string` |

If a name is spelled differently in one file (`createdAt` vs `created_at`), that field shows as empty on the page.

---

# Part 3 - interface or type?

## 10. When to use which

| Use | For | Example |
|---|---|---|
| `interface` | the shape of ONE object (a row, the state) | `interface Incident { ... }`, `interface State { ... }` |
| `type` | "one of these" (a union) | `type Action = \| {...} \| {...}` |
| `type` | a list of allowed text values | `type Severity = "low" \| "medium" \| "high" \| "critical";` |

Simple rule: **object -> `interface`, "one of these" -> `type`**.
An `interface` can't be a union, so `Action` must be a `type`.
If the spec uses `type` for an object, or `interface` for something, **copy the spec**. Both work for objects.

The strict version of a field (optional, more typing):
```ts
export type Severity = "low" | "medium" | "high" | "critical";

export interface Incident {
  id: string;
  severity: Severity;
}
```
A value from a `<select>` then needs a cast: `e.target.value as Severity`. The simple version (`severity: string`) needs no cast.

## 11. The symbols: `?`, `| null`, `[]`, `any`

| Symbol | Means | Example |
|---|---|---|
| `field?: string` | the field may be **missing** | `created_at?: string` |
| `field: string \| null` | the field is always there but may be **empty** | `token: string \| null` (not logged in yet) |
| `Incident[]` | a **list** of incidents | `incidents: Incident[]` |
| `{ id: string; email: string }` | an object written inline (no name) | `user: { id: string; email: string } \| null` |
| `any` | anything, no checking | `user: any` in `SET_AUTH` (copy it if the spec has it) |

---

# Part 4 - A different spec, same approach

## 12. EquipLend (number ids)

The spec:
- Overview: "Lab staff record equipment (name, category, quantity), update the **quantity and condition**
  (good, damaged, repair), and remove retired equipment."
- API table: login (Zod Login), GET `/api/equipment` (None), POST (`validate(createEquipmentSchema)`),
  PATCH `/api/equipment/:id` (`validate(updateEquipmentSchema)`, "UPDATE Quantity/Condition"), DELETE (None)
- State: `equipment: Equipment[]`. Action: `DELETE_SUCCESS; payload: number`

**Step 1 - the field list.** `payload: number` -> ids are numbers -> `SERIAL`.

| Field | SQL | TS | Create? | Update? | Values | Default |
|---|---|---|---|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | `number` | no | no | - | automatic |
| `name` | `VARCHAR(100) NOT NULL` | `string` | required | no | not empty | - |
| `category` | `VARCHAR(50) NOT NULL` | `string` | required | no | not empty | - |
| `quantity` | `INTEGER NOT NULL DEFAULT 1` | `number` | optional | **yes** | 0 or more | `1` |
| `condition` | `VARCHAR(20) DEFAULT 'good'` | `string` | optional | **yes** | good, damaged, repair | `good` |
| `created_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | `string` | no | no | - | automatic |

**Step 2 - `schema.sql`** (users uses `SERIAL` too, to match)
```sql
CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    condition VARCHAR(20) DEFAULT 'good',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Step 3 - `src/types.ts`**
```ts
export interface Equipment {
  id?: number;
  name: string;
  category: string;
  quantity?: number;
  condition?: string;
  created_at?: string;
}
```

**Step 4 - `src/schemas.ts`**
```ts
export const createEquipmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, "name is required"),
    category: z.string().min(1, "category is required"),
    quantity: z.number().int().min(0, "quantity cannot be negative").optional().default(1),
    condition: z.enum(["good", "damaged", "repair"]).optional().default("good"),
  }),
});

// "UPDATE Quantity/Condition" -> only these 2
export const updateEquipmentSchema = z.object({
  body: z.object({
    quantity: z.number().int().min(0, "quantity cannot be negative").optional(),
    condition: z.enum(["good", "damaged", "repair"]).optional(),
  }),
  params: z.object({
    // SERIAL id -> the URL is text, so check that it is digits
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});
```

**Step 5 - `src/types/index.ts`**
```ts
export interface Equipment {
  id: number;
  name: string;
  category: string;
  quantity: number;
  condition: string;
  created_at?: string;
}

export interface State {
  user: { id: number; email: string } | null;
  token: string | null;
  equipment: Equipment[];
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: "SET_AUTH"; payload: { user: any; token: string } }
  | { type: "FETCH_SUCCESS"; payload: Equipment[] }
  | { type: "CREATE_SUCCESS"; payload: Equipment }
  | { type: "UPDATE_SUCCESS"; payload: Equipment }
  | { type: "DELETE_SUCCESS"; payload: number }
  | { type: "SET_ERROR"; payload: string };
```

What changed compared to PulseDesk: only the field list. The approach and the shape of each file stayed the same.

---

# Part 5 - Final check

## 13. Checklist

- [ ] Every field has the **same name** in all 4 files (`created_at`, not `createdAt` in one of them)
- [ ] Every fixed list has the **same values** in Zod `z.enum`, the frontend dropdown list, and (if used) the SQL `CHECK`
- [ ] The id type matches everywhere: UUID + `string` + `z.uuid()`, or SERIAL + `number` + `regex(/^\d+$/)`
- [ ] Every name in the Middleware column exists in `schemas.ts` with the **exact** spelling
- [ ] The update schema has only the fields the Description names, all `.optional()`
- [ ] `State` and `Action` are copied from the spec exactly (extras marked with a comment)
- [ ] The `Incident` interface exists (the spec uses it but doesn't show it)
- [ ] `schema.sql` runs with no errors: `psql ... -f schema.sql`, then `\d incidents`

Next: the routes (`BACKEND-4-ROUTES.md`) and the context (`FRONTEND-2-CONTEXT.md`).
