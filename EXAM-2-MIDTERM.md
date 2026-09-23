# Exam 2 - Midterm guide (database + dotenv -> Express, Zod, JWT, CRUD, React)

The prelim was React up to Context. The midterm starts at **the database and dotenv** and builds the backend on top:
pg + `.env`, Express routes, middleware, Zod validation, JWT login, full CRUD, and then the React
frontend (Context + useReducer from the prelim) calling that backend.
The sample paper is **PulseDesk**: `pulsedesk/` is the full answer, `variations/1-9` are practice papers.

**Part 1 - What is on the midterm**
1. The topics, and where each one is in PulseDesk
2. What the paper looks like

**Part 2 - The plan**
3. The time plan
4. The build order (with a check after every step)

**Part 3 - Must know by heart (short versions)**
5. `.env` + `db.ts`
6. The shape of every route
7. Status codes
8. Zod + `validateResource`
9. JWT: login + `authenticateToken`
10. Frontend: service + dispatch

**Part 4 - Test the backend without the frontend**
11. PowerShell test commands

**Part 5 - Likely questions and changes**
12. "The paper says X" -> where the answer is

**Part 6 - When things go wrong**
13. Errors and fixes
14. If you run out of time

**Part 7 - Submit**
15. Final checklist + zip

---

# Part 1 - What is on the midterm

## 1. The topics, and where each one is in PulseDesk

| Topic | What you must be able to do | PulseDesk file | Guide |
|---|---|---|---|
| Database | write a table in `schema.sql` and run it with psql | `backend/schema.sql` | `BACKEND-1-SCHEMA.md` |
| dotenv | keep the DB password + JWT secret in `.env` | `backend/.env`, `src/db.ts` | `INSTALL.md` block 3 |
| pg | connect with `Pool`, run queries with `$1, $2` | `src/db.ts`, every route | `BACKEND-4-ROUTES.md` |
| Express | routers, `app.use`, `express.json()`, `cors()` | `src/index.ts` | `BACKEND-4-ROUTES.md` |
| Middleware | `validateResource(schema)`, `authenticateToken` | `src/validate.ts`, `src/authMiddleware.ts` | `REUSABLES.md` |
| Zod | a schema for body / params / query | `src/schemas.ts` | `BACKEND-3-ZOD.md` |
| JWT + bcrypt | login: compare the hash, sign a token; protect routes | `src/authRoutes.ts` | `BACKEND-4-ROUTES.md` |
| Full CRUD | GET, POST, PATCH/PUT, DELETE with the right status codes | `src/incidentRoutes.ts` | `BACKEND-4-ROUTES.md` |
| React + backend | services with `fetch`, dispatch the result | `frontend/src/api/`, `frontend/src/context/` | `FRONTEND-2`, `FRONTEND-3` |
| Global dispatching | `dispatch` in the Provider value, used by any component | `frontend/src/context/IncidentContext.tsx` | `FRONTEND-0-CONCEPTS.md` |

## 2. What the paper looks like

| Paper section (PulseDesk) | What it gives you | You write |
|---|---|---|
| System overview | the main thing (incidents), what users do | the table name + columns |
| Technology matrix | the packages | the `npm i` line (`INSTALL.md` block 2) |
| **API endpoints table** (Method, Endpoint, Protection, Body, Response) | every route | one route per row (`BACKEND-4-ROUTES.md`) |
| Frontend architecture: **State & Actions** (`src/types/index.ts`) | the frontend types | copy them (`FRONTEND-1-TYPES.md`) |
| Context / initial state | the reducer's starting values | the context file (`FRONTEND-2-CONTEXT.md`) |
| Components | the screens | forms + list + buttons that call services then dispatch |

---

# Part 2 - The plan

## 3. The time plan

Your exact exam length may differ. The **order** is what matters: backend first, test it, then frontend.

| Share of time | Do | Done when |
|---|---|---|
| 5% | read the spec, fill in the table in `ORDER.md` step 0 | you know the table, columns, routes, login field |
| 10% | install + config + database (`INSTALL.md` blocks 1-4) | `npm run dev` prints "server is running", `\dt` shows the tables |
| 35% | backend: schemas, routes, one route at a time | every row of the API table answers correctly (Part 4) |
| 35% | frontend: types, context, services, components | log in, see the list, add, edit, delete from the page |
| 10% | test the paper's rules and status codes again | everything on the checklist works |
| 5% | clean up + zip | submitted |

## 4. The build order (with a check after every step)

`ORDER.md` has the long version. Short version:

| Step | Do | Guide | Check |
|---|---|---|---|
| 1 | backend install + tsconfig | `INSTALL.md` block 1-2 | no errors |
| 2 | `.env`, `.gitignore`, `db.ts`, `validate.ts`, `authMiddleware.ts`, login route, `index.ts` | `INSTALL.md` block 3 | `npm run dev` starts |
| 3 | `schema.sql` (users + your table + seed user) and run it | `BACKEND-1-SCHEMA.md`, `INSTALL.md` block 4 | `\dt` shows both tables |
| 4 | test login | Part 4 below | you get a token |
| 5 | `src/types.ts` | `BACKEND-2-TYPES.md` | - |
| 6 | `src/schemas.ts` | `BACKEND-3-ZOD.md` | - |
| 7 | the routes file, **one route at a time** | `BACKEND-4-ROUTES.md` | test each route right after writing it |
| 8 | mount it in `index.ts` | `BACKEND-4-ROUTES.md` | GET returns `[]` or the seed rows |
| 9 | frontend install | `INSTALL.md` block 5 | `npm run dev` shows the Vite page |
| 10 | `types/index.ts` (copy from the paper) | `FRONTEND-1-TYPES.md` | no red underlines |
| 11 | the context file | `FRONTEND-2-CONTEXT.md` | no red underlines |
| 12 | the services | `FRONTEND-3-SERVICE.md` | - |
| 13 | the components + App.tsx | `pulsedesk/frontend/src/components/` | login -> list -> add -> edit -> delete |

---

# Part 3 - Must know by heart (short versions)

## 5. `.env` + `db.ts`

```env
PORT=5000
PGUSER=postgres
PGHOST=localhost
PGDATABASE=pulsedesk
PGPASSWORD=postgres
PGPORT=5432

JWT_SECRET=any_long_random_text
```
```ts
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT) || 5432,
});
```
- `dotenv.config()` must run before anything reads `process.env`.
- Change `PGDATABASE` to your database name, `PGPASSWORD` to your Postgres password.

## 6. The shape of every route

Every route has the same 5 parts. Only the SQL and the checks change.

```ts
router.patch(
  // 1. path
  "/:id",
  // 2. middleware (in this order: token first, then validation)
  authenticateToken,
  validateResource(updateIncidentSchema),
  async (req, res) => {
    // 3. take what you need from the request
    const { id } = req.params;
    const { severity, status } = req.body;

    try {
      // 4. the query, values as $1 $2 $3 (never put values inside the SQL string)
      const result = await pool.query(
        `UPDATE incidents
         SET severity = COALESCE($1, severity),
             status = COALESCE($2, status)
         WHERE id = $3
         RETURNING *`,
        [severity ?? null, status ?? null, id]
      );

      // 5. the answer: not found -> 404, otherwise the row
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Incident not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);
```

| Method | SQL | Success answer |
|---|---|---|
| GET all | `SELECT * FROM t ORDER BY created_at DESC` | `res.json(result.rows)` |
| GET one | `SELECT * FROM t WHERE id = $1` | `res.json(result.rows[0])` or 404 |
| POST | `INSERT INTO t (a, b) VALUES ($1, $2) RETURNING *` | `res.status(201).json(result.rows[0])` |
| PUT / PATCH | `UPDATE t SET a = COALESCE($1, a) WHERE id = $2 RETURNING *` | `res.json(result.rows[0])` or 404 |
| DELETE | `DELETE FROM t WHERE id = $1 RETURNING *` | `res.json(result.rows[0])` or 404 |

Route order: `/search`, `/stats`, `/mine` must come BEFORE `/:id`, or Express treats "search" as an id.

## 7. Status codes

| Code | When | Where it comes from |
|---|---|---|
| 200 | OK (GET, PUT, PATCH, DELETE) | `res.json(...)` |
| 201 | created (POST) | `res.status(201).json(...)` |
| 400 | wrong body / params / query | `validateResource` (automatic) or your own check |
| 401 | no token, or wrong email/password | `authenticateToken` / the login route |
| 403 | bad or expired token, or not allowed (not the owner, not admin) | `authenticateToken` / your own check |
| 404 | the id does not exist | `if (result.rows.length === 0)` |
| 409 | duplicate (email already used) or a rule is broken | `catch`: `error.code === "23505"` |
| 500 | anything else | the `catch` |

## 8. Zod + `validateResource`

The schema always wraps the parts in `body` / `params` / `query`, because `validateResource` checks all three.
```ts
import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.email("Must be a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const createIncidentSchema = z.object({
  body: z.object({
    title: z.string().min(1, "title is required"),
    description: z.string().min(1, "description is required"),
    severity: z.enum(["low", "medium", "high", "critical"]).optional().default("low"),
    status: z.enum(["open", "in_progress", "resolved"]).optional().default("open"),
  }),
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
Use it in the route: `validateResource(createIncidentSchema)`. Wrong data -> 400 automatically.
More methods (numbers, dates, regex, refine): `BACKEND-3-ZOD.md`.

## 9. JWT: login + `authenticateToken`

Login, the 4 steps:
```ts
// 1. find the user
const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
const user = result.rows[0];
if (!user) return res.status(401).json({ error: "Invalid email or password" });

// 2. compare the password with the hash
const isValidPassword = await bcrypt.compare(password, user.password_hash);
if (!isValidPassword) return res.status(401).json({ error: "Invalid email or password" });

// 3. make the token (what you put here is what req.user has later)
const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

// 4. send the token and the user
res.json({ message: "Login successful", token, user: { id: user.id, email: user.email } });
```

Protect a route: put `authenticateToken` before the handler.
Get the logged-in user inside a route: `(req.user as JwtPayload).userId` (import `type JwtPayload` from `"jsonwebtoken"`).
The middleware itself is copy-as-is: `pulsedesk/backend/src/authMiddleware.ts`.

## 10. Frontend: service + dispatch

A service calls the backend and throws the error message. A component calls it, then dispatches.
```ts
// src/api/incidentService.ts
export const fetchIncidents = async (token: string | null): Promise<Incident[]> => {
  const res = await fetch(`${API_URL}/incidents`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
```
```tsx
// a component (IncidentList.tsx)
dispatch({ type: "FETCH_START" });

try {
  const data = await fetchIncidents(state.token);
  dispatch({ type: "FETCH_SUCCESS", payload: data });
} catch (error) {
  dispatch({ type: "SET_ERROR", payload: (error as Error).message });
}
```
The reducer side (`FETCH_SUCCESS`, `CREATE_SUCCESS`, `UPDATE_SUCCESS`, `DELETE_SUCCESS`) is in `FRONTEND-2-CONTEXT.md`.
The ideas (state, action, global dispatch) are in `FRONTEND-0-CONCEPTS.md`.

---

# Part 4 - Test the backend without the frontend

## 11. PowerShell test commands

Run these in a second terminal while `npm run dev` is running. Change the URL, the email, and the body to your project's.

```powershell
$API = "http://localhost:5000/api"

# 1. login -> keep the token in $H
$login = Invoke-RestMethod -Method Post -Uri "$API/auth/login" -ContentType "application/json" -Body '{"email":"admin@pulsedesk.com","password":"password123"}'
$H = @{ Authorization = "Bearer " + $login.token }

# 2. GET all
Invoke-RestMethod -Uri "$API/incidents" -Headers $H

# 3. POST (keep the new row in $new)
$new = Invoke-RestMethod -Method Post -Uri "$API/incidents" -Headers $H -ContentType "application/json" -Body '{"title":"VPN down","description":"Error 809 since 9am","severity":"high"}'
$new

# 4. PATCH the new row
Invoke-RestMethod -Method Patch -Uri "$API/incidents/$($new.id)" -Headers $H -ContentType "application/json" -Body '{"status":"resolved"}'

# 5. DELETE the new row
Invoke-RestMethod -Method Delete -Uri "$API/incidents/$($new.id)" -Headers $H
```

Errors (400 / 401 / 403 / 404 / 409) make `Invoke-RestMethod` stop with red text.
To see the status code and the JSON the server sent, wrap it like this:
```powershell
# 400: empty title
try { Invoke-RestMethod -Method Post -Uri "$API/incidents" -Headers $H -ContentType "application/json" -Body '{"title":""}' } catch { $_.Exception.Response.StatusCode.value__; $_.ErrorDetails.Message }

# 401: no token
try { Invoke-RestMethod -Uri "$API/incidents" } catch { $_.Exception.Response.StatusCode.value__; $_.ErrorDetails.Message }

# 404: an id that does not exist
try { Invoke-RestMethod -Method Delete -Uri "$API/incidents/00000000-0000-0000-0000-000000000000" -Headers $H } catch { $_.Exception.Response.StatusCode.value__; $_.ErrorDetails.Message }
```

Check the table in psql too (`README.md` has the psql commands): `SELECT * FROM incidents;`

---

# Part 5 - Likely questions and changes

## 12. "The paper says X" -> where the answer is

| The paper says | What changes | Practice in |
|---|---|---|
| "users can register" | `POST /register`: `bcrypt.hash(password, 10)`, INSERT, 409 on duplicate email | `variations/1-studynotes` |
| "users only see their own items" | `user_id` column, `WHERE user_id = $1` with `(req.user as JwtPayload).userId` | `1-studynotes` |
| "filter by status" / "search" (`?status=` / `?search=`) | Zod `query: z.object({...})`, `WHERE status = $1` / `ILIKE $1` | `2-libraryhub`, `1-studynotes` |
| "cannot borrow if already borrowed" (a rule) | check the row first, return 409 with a message | `2-libraryhub` |
| "only admins can delete" | `role` in the token, a `requireAdmin` middleware, 403 | `3-stockroom` |
| "GET one item by id" | `GET /:id` with `z.uuid()` params, 404 | `3-stockroom` |
| "show the count of tasks per project" | `LEFT JOIN` + `COUNT` + `GROUP BY` | `4-projectboard` |
| "pagination / sort" | `LIMIT $1 OFFSET $2`, a whitelist for `ORDER BY` | `5-staffdirectory` |
| "an order has many items" | 2 tables, a loop of INSERTs, total calculated on the server | `6-cafeorders` |
| "log in with student number" | `WHERE student_no = $1` instead of email, Zod regex | `7-classportal` |
| "log in with username" / "lock after 3 tries" / "GET /me" | `username`, 423 Locked, a `/me` route | `8-forumboard` |
| "guests can view, users can book" | an `optionalAuth` middleware | `9-eventpass` |
| "PUT (replace all fields)" instead of PATCH | all fields required in Zod, `SET a = $1, b = $2` | `1-studynotes` |
| different field names / enums | only `schema.sql`, `types.ts`, `schemas.ts`, the SQL column names | `BACKEND-3-ZOD.md` |
| different error message text | copy the paper's text exactly into `res.status(...).json({ error: "..." })` | - |

What the middleware may look like on a different paper: `REUSABLES.md`.

---

# Part 6 - When things go wrong

## 13. Errors and fixes

| Error | Cause | Fix |
|---|---|---|
| `password authentication failed for user "postgres"` | wrong `PGPASSWORD` | fix `.env`, restart `npm run dev` |
| `database "x" does not exist` | the database was not created | `CREATE DATABASE x;` in psql (`INSTALL.md` block 4) |
| `relation "incidents" does not exist` | `schema.sql` was not run | `psql ... -f schema.sql` |
| `EADDRINUSE: address already in use :::5000` | another server is still running | close the other terminal, or change `PORT` in `.env` |
| `req.body` is `undefined` | `app.use(express.json())` is missing or after the routes | put it before `app.use("/api/...")` |
| every route is 404 | the router is not mounted, or the path is wrong | `app.use("/api/incidents", incidentRoutes)` |
| always 401 | the header is not `Authorization: Bearer <token>` | check the header / the service |
| always 403 | the token was made with another secret (you changed `JWT_SECRET`) | log in again |
| `invalid input syntax for type uuid` (500) | a bad id reached the SQL | add `params: z.object({ id: z.uuid() })` -> 400 instead |
| `duplicate key value violates unique constraint` (500) | same email / name twice | catch `error.code === "23505"` -> 409 |
| `Failed to fetch` (frontend) | the backend is not running, wrong port in `API_URL`, or no `cors()` | start the backend, check `API_URL`, `app.use(cors())` |
| the page shows the old list after adding | the case forgot to add the new row | `CREATE_SUCCESS`: `[action.payload, ...state.items]` |

## 14. If you run out of time

1. The backend running with login + GET + POST working and tested
2. PATCH/PUT + DELETE with 404
3. Zod on every body + the right 400 / 401 / 403 codes
4. Frontend: login + list
5. Frontend: add / edit / delete
6. Looks

A backend that runs and is tested with Part 4 is worth more than a frontend that can't reach it.

---

# Part 7 - Submit

## 15. Final checklist + zip

- [ ] `schema.sql` is in the backend folder (the checker needs it to make the tables)
- [ ] `.env` has the right values (or the paper's values)
- [ ] every row of the API table tested (Part 4), with the paper's status codes and messages
- [ ] no route works without a token when the paper says "Protected"
- [ ] the frontend: login, list, add, edit, delete all work from the page
- [ ] F12 Console has no red errors

Stop both servers (Ctrl+C), then from the project folder (the one with `backend` and `frontend` inside):
```powershell
Remove-Item -Recurse -Force backend\node_modules, frontend\node_modules
cd ..
Compress-Archive -Path pulsedesk -DestinationPath Lastname1_Lastname2.zip
```
Use your project folder name and the zip name the paper asks for.
