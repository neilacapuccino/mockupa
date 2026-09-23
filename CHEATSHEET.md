# Cheat sheet — the methods you need, and how to use them

Same style as `practice-c` and the `variations/`. Every example is copy-paste ready.

1. [HTTP status codes](#1-http-status-codes)
2. [PostgreSQL error codes](#2-postgresql-error-codes-in-catch)
3. [Express](#3-express)
4. [SQL with `pg`](#4-sql-with-pg)
5. [Zod (v4)](#5-zod-v4)
6. [Auth: bcrypt + JWT](#6-auth-bcrypt--jwt)
7. [CRUD route template](#7-crud-route-template-copy-this)
8. [React: Context + useReducer](#8-react-context--usereducer)
9. [React: fetching + forms](#9-react-fetching--forms)
10. [Frontend auth](#10-frontend-auth)

---

## 1. HTTP status codes
| Code | Name | Use it when | Example |
|---|---|---|---|
| **200** | OK | GET / PUT / PATCH / DELETE worked | `res.json(result.rows[0])` |
| **201** | Created | POST made something new | `res.status(201).json(result.rows[0])` |
| **400** | Bad Request | the data is wrong (Zod failed, rule broken, "no fields") | `res.status(400).json({ error: "No fields provided for update" })` |
| **401** | Unauthorized | **no token**, or wrong email/password at login | `res.status(401).json({ error: "Invalid email or password" })` |
| **403** | Forbidden | token is bad/expired, **or** you're logged in but **not allowed** (role, not the owner) | `res.status(403).json({ error: "Admins only." })` |
| **404** | Not Found | the id doesn't exist (`result.rows.length === 0`) | `res.status(404).json({ error: "Item not found" })` |
| **409** | Conflict | duplicate (email/sku taken) or the current state blocks it (already borrowed, full) | `res.status(409).json({ error: "Email already exists" })` |
| **423** | Locked | account locked (too many wrong passwords) | see ForumBoard |
| **500** | Server Error | something crashed (your `catch`) | `res.status(500).json({ error: (error as Error).message })` |

**401 vs 403:** 401 = "who are you?" (no/incorrect login). 403 = "I know who you are, but no."
**Always `return`** when you send an error inside an `if`, or the code keeps running:
```ts
if (result.rows.length === 0) {
  return res.status(404).json({ error: "Item not found" });   // <- return!
}
```

---

## 2. PostgreSQL error codes (in `catch`)
| `error.code` | Means | Send |
|---|---|---|
| `23505` | UNIQUE broken (duplicate email / sku / student+subject) | **409** |
| `23503` | FOREIGN KEY broken (the id you point to doesn't exist) | **404** or **400** |
| `23502` | NOT NULL broken (a required column got null) | **400** |
| `23514` | CHECK broken (e.g. `status IN (...)`, `score BETWEEN 0 AND 100`) | **400** |
| `22P02` | wrong format for the column (e.g. `"abc"` for a UUID) | **400** |

```ts
} catch (error: any) {
  console.error(error);

  if (error.code === "23505") {
    return res.status(409).json({ error: "Email already exists" });
  }

  if (error.code === "23503") {
    return res.status(404).json({ error: "Student not found" });
  }

  res.status(500).json({ error: "Internal server error" });
}
```
Tip: Zod catches most bad input **before** the database, so you mostly need `23505`.

---

## 3. Express

### Router + methods
```ts
import { Router } from "express";
const router = Router();

router.get("/", handler);            // READ all
router.get("/:id", handler);         // READ one
router.post("/", handler);           // CREATE
router.put("/:id", handler);         // UPDATE (the course uses it as a partial update)
router.patch("/:id", handler);       // UPDATE a few fields
router.delete("/:id", handler);      // DELETE

export default router;
// index.ts:  app.use("/api/items", itemRoutes);   -> "/" becomes /api/items
```

### What's inside `req`
| You want | Use | Example URL / body |
|---|---|---|
| URL part `/:id` | `const { id } = req.params;` | `/api/items/7c9e...` |
| query `?search=` | `const { search } = req.query;` (always a **string**) | `/api/items?search=abc` |
| JSON body | `const { title } = req.body;` | `{ "title": "abc" }` |
| a header | `req.header("Authorization")` | `Bearer eyJ...` |
| the logged-in user | `(req.user as JwtPayload).userId` | set by `authenticateToken` |

### Sending back
```ts
res.json(data);                          // 200
res.status(201).json(data);              // other code
res.status(404).json({ error: "..." });  // errors: always { error: "..." }
```

### Middleware = `(req, res, next)`
It either **stops** (sends a response) or **continues** with `next()`.
```ts
router.post("/", authenticateToken, requireAdmin, validateResource(createItemSchema), async (req, res) => { ... });
//               1st: logged in?     2nd: admin?    3rd: body valid?                    4th: your code
```
Order in `index.ts`: `app.use(cors())` → `app.use(express.json())` → `app.use("/api/...", routes)`.

### Route order matters
Express checks routes **top to bottom**, and `/:id` matches **anything**:
```ts
router.get("/mine", ...);   // fixed paths FIRST
router.get("/search", ...);
router.get("/:id", ...);    // /:id LAST, or "/mine" would be treated as id = "mine"
```

### Every async route: try / catch
```ts
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM items ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
```

---

## 4. SQL with `pg`

### The basics
```ts
const result = await pool.query(`SELECT * FROM items WHERE id = $1`, [id]);
result.rows          // array of rows
result.rows[0]       // first row (undefined if none)
result.rows.length   // how many
```
**Always `$1, $2...` + an array. NEVER build SQL with user text** (`"... WHERE id = " + id` = SQL injection).

### Recipes
```sql
-- READ all
SELECT * FROM items ORDER BY created_at DESC

-- READ one
SELECT * FROM items WHERE id = $1

-- CREATE (RETURNING * gives back the new row, with its id)
INSERT INTO items (title, status) VALUES ($1, $2) RETURNING *

-- UPDATE only what was sent (null = keep the old value)
UPDATE items
SET title = COALESCE($1, title),
    status = COALESCE($2, status)
WHERE id = $3
RETURNING *
-- in JS: [title ?? null, status ?? null, id]

-- DELETE
DELETE FROM items WHERE id = $1 RETURNING *

-- only MY rows
SELECT * FROM items WHERE user_id = $1
UPDATE items SET ... WHERE id = $2 AND user_id = $3   -- someone else's -> 0 rows -> 404

-- search (case-insensitive "contains")
SELECT * FROM items WHERE title ILIKE $1          -- value: `%${search}%`

-- join: rows + the name from another table
SELECT i.*, u.email AS owner_email
FROM items i
JOIN users u ON u.id = i.user_id

-- LEFT JOIN keeps rows with no match (projects with 0 tasks); COUNT needs GROUP BY
SELECT p.*, COUNT(t.id)::int AS task_count
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id

-- average + if/else inside SQL
SELECT ROUND(AVG(score), 1)::float AS average FROM grades WHERE student_id = $1
SELECT subject, CASE WHEN score >= 75 THEN 'Passed' ELSE 'Failed' END AS remarks FROM grades

-- many ids at once
SELECT * FROM menu_items WHERE id = ANY($1)        -- value: an array of ids

-- pages
SELECT * FROM employees ORDER BY last_name LIMIT $1 OFFSET $2   -- offset = (page - 1) * limit

-- time
WHERE starts_at < NOW()
NOW() + INTERVAL '7 days'
```

### Build the WHERE from optional filters
```ts
const conditions: string[] = [];
const values: string[] = [];

if (typeof search === "string" && search !== "") {
  values.push(`%${search}%`);
  conditions.push(`title ILIKE $${values.length}`);      // $1
}
if (typeof status === "string") {
  values.push(status);
  conditions.push(`status = $${values.length}`);         // $2
}

const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
const result = await pool.query(`SELECT * FROM items ${where} ORDER BY created_at DESC`, values);
```

### Things pg gives back as STRINGS (surprise!)
| Column / function | Comes back as | Fix |
|---|---|---|
| `NUMERIC(10,2)` (money) | `"9.99"` | show it as is, or `Number(x)` |
| `COUNT(*)` | `"4"` | `COUNT(*)::int` |
| `AVG(...)` / `ROUND(...)` | `"85.5"` | `ROUND(AVG(x), 1)::float` |
| `DATE` | a JS Date (can show the **previous day**) | `types.setTypeParser(1082, (v) => v)` in `db.ts` |
| `UUID` | string | ✓ |
| `INT`, `BOOLEAN` | number / boolean | ✓ |

---

## 5. Zod (v4)

### Building blocks
```ts
import { z } from "zod";

z.string().min(1, "title is required")                     // required text
z.string().max(150, "title is too long")
z.email("Must be a valid email")
z.uuid("ID must be a valid id")
z.string().regex(/^\d{4}-\d{5}$/, "Student number must look like 2024-00123")
z.number().int("must be a whole number").min(0).max(100)   // body must send 5, not "5"
z.boolean()
z.enum(["open", "in_progress", "resolved"])                // only these values
z.iso.date("must look like 2026-10-15")                    // <input type="date">
z.iso.datetime({ local: true })                            // <input type="datetime-local">
z.array(z.object({ id: z.uuid(), quantity: z.number() })).min(1, "at least 1 item")

.optional()                  // may be missing
.optional().default("low")   // missing -> "low" (but see the note below)
schema.partial()             // every field optional (for updates)
```
> Our `validateResource` only **checks**; it doesn't put the parsed data back into `req.body`,
> so defaults don't reach the route. In the route use `severity ?? "low"`.

### Wrap it: what part of the request to check
```ts
export const itemBodySchema = z.object({
  title: z.string().min(1, "title is required"),
  status: z.enum(["open", "done"]).optional().default("open"),
});

export const createItemSchema = z.object({
  body: itemBodySchema,
});

export const updateItemSchema = z.object({
  body: itemBodySchema.partial(),
  params: z.object({ id: z.uuid("ID must be a valid id") }),
});

// GET /api/items?status=open   (query values are ALWAYS strings)
export const itemQuerySchema = z.object({
  query: z.object({
    status: z.enum(["open", "done"]).optional(),
    page: z.string().regex(/^\d+$/, "page must be a number").optional(),
  }),
});

// auto TypeScript type from a schema
export type ItemInput = z.infer<typeof itemBodySchema>;
```
Use it: `router.post("/", authenticateToken, validateResource(createItemSchema), handler)`

### Failed validation → 400 like this
```json
{ "error": "Validation failed",
  "details": [ { "path": "body.title", "message": "title is required" } ] }
```

### Comparing two fields (confirm password) — do it in the route
```ts
if (password !== confirm_password) {
  return res.status(400).json({ error: "Passwords do not match" });
}
```

### Zod v3 (Discord / old tutorials) → v4 (what you have)
| v3 | v4 |
|---|---|
| `import { AnyZodObject } from "zod/v3"` | `import { z } from "zod"` → `z.ZodType` |
| `error.errors` | `error.issues` |
| `z.string().email()` | `z.email()` |
| `z.string().uuid()` | `z.uuid()` |

---

## 6. Auth: bcrypt + JWT

### Register (save the HASH, never the password)
```ts
const userCheck = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
if (userCheck.rows.length > 0) {
  return res.status(409).json({ error: "Email already registered" });
}

const passwordHash = await bcrypt.hash(password, 10);

const result = await pool.query(
  `INSERT INTO users (email, password_hash) VALUES ($1, $2)
   RETURNING id, email, created_at`,                 // NOT password_hash
  [email, passwordHash]
);
res.status(201).json({ message: "User registered successfully", user: result.rows[0] });
```

### Login (compare, then sign a token)
```ts
const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
const user = result.rows[0];

if (!user) {
  return res.status(401).json({ error: "Invalid email or password" });   // same message both times
}

const isValidPassword = await bcrypt.compare(password, user.password_hash);
if (!isValidPassword) {
  return res.status(401).json({ error: "Invalid email or password" });
}

const token = jwt.sign(
  { userId: user.id, email: user.email },   // payload: what routes need later (+ role/type if any)
  JWT_SECRET,
  { expiresIn: "1h" }                       // "30s", "15m", "1h", "7d"
);

res.json({ message: "Login successful", token, user: { id: user.id, email: user.email } });
```
Login with something else? Only the column changes: `WHERE username = $1`, `WHERE student_no = $1`, `WHERE mobile = $1`.

### Using the logged-in user in a route
```ts
import { JwtPayload } from "jsonwebtoken";

const userId = (req.user as JwtPayload).userId;   // after authenticateToken
```

### Extra middlewares (put them AFTER `authenticateToken`)
```ts
// role / account type
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as JwtPayload;
  if (user.role !== "admin") {
    return res.status(403).json({ error: "Admins only." });
  }
  next();
};

// optional: guests continue, logged-in users get req.user
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch (error) { /* guest */ }
  }
  next();
};
```

### "Is this mine?" — two ways
| Way | Code | Someone else's item gives |
|---|---|---|
| filter in SQL | `WHERE id = $1 AND user_id = $2` | **404** (private data: StudyNotes) |
| check in JS | `if (post.user_id !== userId) return 403` | **403** (public data: ForumBoard) |

### `/me` — get the user back after a refresh
```ts
router.get("/me", authenticateToken, async (req, res) => {
  const userId = (req.user as JwtPayload).userId;
  const result = await pool.query(`SELECT id, email FROM users WHERE id = $1`, [userId]);
  if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
  res.json(result.rows[0]);
});
```

---

## 7. CRUD route template (copy this)
```ts
import { Router } from "express";
import { JwtPayload } from "jsonwebtoken";
import { pool } from "./db";
import { Item } from "./types";
import { validateResource } from "./validate";
import { createItemSchema, updateItemSchema } from "./schemas";
import { authenticateToken } from "./authMiddleware";

const router = Router();


// GET /api/items
router.get("/", authenticateToken, async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM items ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});


// POST /api/items      body: { "title": "..." }
router.post("/", authenticateToken, validateResource(createItemSchema), async (req, res) => {
  const userId = (req.user as JwtPayload).userId;
  const { title, status }: Item = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO items (user_id, title, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, title, status ?? "open"]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});


// PATCH /api/items/:id      body: { "status": "done" }
router.patch("/:id", authenticateToken, validateResource(updateItemSchema), async (req, res) => {
  const { id } = req.params;
  const { title, status }: Item = req.body;

  if (title === undefined && status === undefined) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  try {
    const result = await pool.query(
      `UPDATE items
       SET title = COALESCE($1, title),
           status = COALESCE($2, status)
       WHERE id = $3
       RETURNING *`,
      [title ?? null, status ?? null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});


// DELETE /api/items/:id
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`DELETE FROM items WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});


export default router;
```
Business rule? Read the row first, check, then update:
```ts
const found = await pool.query(`SELECT * FROM books WHERE id = $1`, [id]);
if (found.rows.length === 0) return res.status(404).json({ error: "Book not found" });
if (!found.rows[0].is_available) return res.status(409).json({ error: "Book is already borrowed" });
// ...now the UPDATE
```

---

## 8. React: Context + useReducer

### `src/types/index.ts`
```ts
export interface Item {
  id: string;
  title: string;
  status: string;
}

export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  items: Item[];
  loading: boolean;
  error: string | null;
}

// DISCRIMINATED UNION: "type" tells TypeScript which payload it is
export type Action =
  | { type: "SET_AUTH"; payload: { user: any; token: string } }
  | { type: "LOGOUT" }
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Item[] }
  | { type: "CREATE_SUCCESS"; payload: Item }
  | { type: "UPDATE_SUCCESS"; payload: Item }
  | { type: "DELETE_SUCCESS"; payload: string }
  | { type: "SET_ERROR"; payload: string };
```

### `src/context/AppContext.tsx`
```tsx
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { State, Action } from "../types";

const initialState: State = {
  user: null,
  token: localStorage.getItem("token"),
  items: [],
  loading: false,
  error: null,
};

const appReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, user: action.payload.user, token: action.payload.token, error: null };
    case "LOGOUT":
      return { ...state, user: null, token: null, items: [] };
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, items: action.payload };
    case "CREATE_SUCCESS":
      return { ...state, items: [action.payload, ...state.items] };
    case "UPDATE_SUCCESS":
      return {
        ...state,
        items: state.items.map((item) => (item.id === action.payload.id ? action.payload : item)),
      };
    case "DELETE_SUCCESS":
      return { ...state, items: state.items.filter((item) => item.id !== action.payload) };
    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const AppContext = createContext<
  { state: State; dispatch: Dispatch<Action> } | undefined
>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
```

### Reducer rules
- **pure**: no fetch, no localStorage inside the reducer
- always return a **NEW** object: `{ ...state, x: ... }` — never `state.items.push(...)`

| Goal | Code |
|---|---|
| add | `items: [...state.items, action.payload]` (end) / `[action.payload, ...state.items]` (top) |
| replace one | `items: state.items.map((i) => i.id === action.payload.id ? action.payload : i)` |
| remove one | `items: state.items.filter((i) => i.id !== action.payload)` |
| change one field | `items: state.items.map((i) => i.id === id ? { ...i, quantity: i.quantity + 1 } : i)` |
| change one key by name | `filters: { ...state.filters, [action.payload.name]: action.payload.value }` |
| toggle | `showForm: !state.showForm` |
| nested | `selected: state.selected ? { ...state.selected, tasks: [...state.selected.tasks, t] } : null` |
| a const inside a case | wrap the case in `{ }`: `case "ADD": { const x = ...; return ...; }` |

### Use it in any component ("global dispatching")
```tsx
const context = useContext(AppContext);
if (!context) throw new Error("ItemList must be used within AppProvider");
const { state, dispatch } = context;

dispatch({ type: "DELETE_SUCCESS", payload: id });
```

### `App.tsx`
```tsx
function MainApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("MainApp must be used within AppProvider");
  const { state, dispatch } = context;

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <div>
      {state.error && <p>Error: {state.error}</p>}
      {state.token ? (
        <>
          <button onClick={handleLogout}>Logout</button>
          <ItemForm />
          <ItemList />
        </>
      ) : (
        <AuthForm />
      )}
    </div>
  );
}

// separate component: MainApp can't useContext a Provider it renders itself
function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
```

---

## 9. React: fetching + forms

### Service function (`src/api/itemService.ts`)
```ts
import { API_URL } from "./config";
import type { Item } from "../types";

// GET with the token
export const fetchItems = async (token: string | null): Promise<Item[]> => {
  const res = await fetch(`${API_URL}/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  // fetch does NOT throw on 400/401/404/500 -> check res.ok yourself
  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);   // Zod message or our error
  }

  return data;
};

// POST with a JSON body
export const createItem = async (token: string | null, item: { title: string }): Promise<Item> => {
  const res = await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
// PATCH / PUT: same as POST with method: "PATCH" and `${API_URL}/items/${id}`
// DELETE: method: "DELETE", only the Authorization header
```

### Load on screen open (`useEffect`)
```tsx
useEffect(() => {
  const loadItems = async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const data = await fetchItems(state.token);
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  loadItems();
}, [dispatch, state.token]);   // runs again when these change (add filters/page here too)
```
- the effect itself can't be `async` → make an inner async function
- in dev, StrictMode runs it **twice** on purpose (two requests = normal)

### Button → API → dispatch
```tsx
const handleDelete = async (id: string) => {
  try {
    await deleteItem(state.token, id);
    dispatch({ type: "DELETE_SUCCESS", payload: id });
  } catch (error) {
    dispatch({ type: "SET_ERROR", payload: (error as Error).message });
  }
};
```

### Forms
```tsx
const [title, setTitle] = useState("");

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();                 // stop the page from reloading
  // ...call the API, dispatch, then clear: setTitle("")
};

<form onSubmit={handleSubmit}>
  <input value={title} onChange={(e) => setTitle(e.target.value)} required />
  <button type="submit">Save</button>
</form>
```
| Input | Read it with | Watch out |
|---|---|---|
| text / select / date | `e.target.value` | |
| number | `e.target.value` | it's a **string** → send `Number(value)` or Zod says 400 |
| checkbox | `e.target.checked` | not `.value` |
| optional field left empty | `value || undefined` | `""` would be sent otherwise |

Many fields → one object + one handler (the input's `name` picks the field):
```tsx
const [form, setForm] = useState({ first_name: "", salary: "" });

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  setForm({ ...form, [e.target.name]: e.target.value });
};

<input name="first_name" value={form.first_name} onChange={handleChange} />
```

### Showing things
```tsx
{state.loading && <p>Loading...</p>}                        // show if true
{state.items.length === 0 && <p>Nothing yet.</p>}
{isAdmin ? <AdminPanel /> : <p>Read only</p>}               // if / else
{state.items.map((item) => <li key={item.id}>{item.title}</li>)}   // key = the id, never the index

const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);   // derived value
const doneCount = tasks.filter((t) => t.status === "done").length;
```

---

## 10. Frontend auth
```tsx
// after login
const data = await login(email, password);              // { token, user }
localStorage.setItem("token", data.token);
dispatch({ type: "SET_AUTH", payload: { user: data.user, token: data.token } });

// logout
localStorage.removeItem("token");
dispatch({ type: "LOGOUT" });

// save an OBJECT (localStorage only stores strings)
localStorage.setItem("user", JSON.stringify(data.user));
const user = JSON.parse(localStorage.getItem("user") || "null");

// "remember me": localStorage stays, sessionStorage is gone when the tab closes
const storage = rememberMe ? localStorage : sessionStorage;

// read the token's expiry (the frontend can READ a JWT, only the server can VERIFY it)
const payload = JSON.parse(atob(token.split(".")[1]));
const expiresAt = new Date(payload.exp * 1000);           // exp is in seconds

// role-based UI (the server must ALSO check with a middleware)
{state.user?.role === "admin" && <button>Delete</button>}
```
| Situation | Where to look |
|---|---|
| login with email | PulseDesk, variations 1–6 |
| register + login in one form | 1-studynotes `AuthForm.tsx` |
| student number / employee number | 7-classportal |
| username + lockout + `/me` + change password | 8-forumboard |
| mobile + remember me + auto-logout + guests | 9-eventpass |
| roles (admin/staff) | 3-stockroom |
