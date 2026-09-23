# Build order - a new (different) project, step by step

Follow the steps top to bottom. Each step says what to **copy**, what to **change**,
which guide to open, and how to **check** it works before moving on.

| Guide | For | Used in step |
|---|---|---|
| `INSTALL.md` | install + config (copy-paste blocks) | 1-4, 10 |
| `REUSABLES.md` | which files are copy-as-is | 4, 11 |
| **Backend** | | |
| `BACKEND-1-SCHEMA.md` | `schema.sql` | 3 |
| `BACKEND-2-TYPES.md` | `src/types.ts` | 6 |
| `BACKEND-3-ZOD.md` | `src/schemas.ts` | 7 |
| `BACKEND-4-ROUTES.md` | `src/...Routes.ts` | 9 |
| **Frontend** | | |
| `FRONTEND-0-CONCEPTS.md` | the ideas: state, action, reducer, context, global dispatch | read before 12 |
| `FRONTEND-1-TYPES.md` | `src/types/index.ts` | 12 |
| `FRONTEND-2-CONTEXT.md` | `src/context/...Context.tsx` | 13 |
| `FRONTEND-4-ACTIONS.md` | an action table -> Action line + case + dispatch | 12, 13, 15 |
| `FRONTEND-5-REDUCER-RULES.md` | rules in the reducer (limits, if / else, alerts) | 13 |
| `FRONTEND-3-SERVICE.md` | `src/api/...Service.ts` | 14 |

Frontend-only paper (no backend, like the SkyControl prelim)? Skip steps 1-11 and 14,
and follow `EXAM-1-HOW-TO-ANSWER.md` instead. The midterm plan is `EXAM-2-MIDTERM.md`.
Step 0 (reading the spec) in more detail, with the field list that feeds steps 3, 6, 7 and 12:
`EXAM-3-SPEC-TRANSLATION.md`.

---

## Step 0 - Read the spec (before typing anything)

Write these down on paper:

| Question | Look at | Example (PulseDesk) |
|---|---|---|
| What is the main table? | the title / overview | `incidents` |
| What are its fields? | the forms, the State's type | title, description, severity, status |
| Which fields have a fixed list of values? | the description ("low/medium/high") | severity, status |
| Login with what? | `/api/auth/login` row + the State's `user` | email |
| `id: string` or `id: number`? | the frontend types in the spec | string -> UUID |
| Which routes, which middleware? | the API table | 5 rows |
| Anything special? | Protection column, "my", "admin", "only if" | none |

---

# BACKEND

## Step 1 - Install (terminal 1)

Open: `INSTALL.md` - Blocks 1-3 also write `.env`, `.gitignore` and the step 4 files for you.
Change: the 3 names in Block 1.

Check: `package.json` has the packages, `src/` has the empty files.

## Step 2 - `.env`

**Used `INSTALL.md`? Already done by Block 3 - skip.**


Copy: `pulsedesk/backend/.env`
Change: `PGDATABASE` (new name). `PORT` only if 5000 is busy.

## Step 3 - `schema.sql` + create the database

Open: `BACKEND-1-SCHEMA.md` (section 6 = PulseDesk, section 7 = a different project).
Copy: `pulsedesk/backend/schema.sql`
Change: the main table name + its columns + the CHECK values + the test rows.

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE mydb;"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d mydb -f ".\schema.sql"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d mydb -c "\dt"
```

Check: `\dt` lists your tables.

## Step 4 - Copy the files that never change

**Used `INSTALL.md`? Already done by Block 3 - skip.**


Copy (no changes): `db.ts`, `validate.ts`, `authMiddleware.ts`, `types/express/index.d.ts`, `.gitignore`.
Run this from your new `backend/` folder:

```powershell
$P = "C:\Users\Higurashi\OneDrive\Documents\task force\mockupa\pulsedesk\backend"
Copy-Item "$P\src\db.ts", "$P\src\validate.ts", "$P\src\authMiddleware.ts" -Destination .\src\
Copy-Item "$P\src\types\express\index.d.ts" -Destination .\src\types\express\
Copy-Item "$P\.gitignore" -Destination .\
```

## Step 5 - `index.ts`

**Used `INSTALL.md`? Already written by Block 3 - just rename `itemRoutes` / `/api/items` later.**


Copy: `pulsedesk/backend/src/index.ts`
Change: `incidentRoutes` -> your routes name, `"/api/incidents"` -> your path.
For now, put `//` in front of the 2 lines of the routes file you haven't written yet.

Check: `npm run dev` -> open http://localhost:5000 -> "hello from server".

## Step 6 - `types.ts`

Open: `BACKEND-2-TYPES.md`
Copy: `pulsedesk/backend/src/types.ts`
Change: `Incident` -> your table (singular), the fields = your columns.

## Step 7 - `schemas.ts`

Open: `BACKEND-3-ZOD.md` (section 2 = translate a table, section 9 = PulseDesk)
Copy: `pulsedesk/backend/src/schemas.ts`
Change:
- the login field (only if it's not email)
- the body schema fields = your columns (not `id`, `created_at`, `user_id`)
- the enum values = your CHECK values
- the update schema = what the spec's Description says
- the names = what the spec's Middleware column says (`createXSchema`, `updateXSchema`)

## Step 8 - `authRoutes.ts` (login)

**Used `INSTALL.md`? Already written by Block 3 - only change it if the login is not email.**


Copy: `pulsedesk/backend/src/authRoutes.ts`
Change: only if the login is not email -> `email` becomes `username` / `student_no` / ... in 3 places
(the destructuring, `WHERE email = $1`, and the `user` it sends back).

Check (second terminal):

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login -ContentType "application/json" -Body '{"email":"admin@test.com","password":"password123"}'
```

You should see a `token`.

## Step 9 - the routes file

Open: `BACKEND-4-ROUTES.md` (section 4 = spec table -> route, section 5 = PulseDesk)
Copy: `pulsedesk/backend/src/incidentRoutes.ts` -> rename it (`bookRoutes.ts`)
Change, **one spec row at a time**:
- the table name in the SQL
- the fields in the destructuring, the SQL, and the `[...]` array (same order)
- the middleware = the spec's Protection + Middleware columns
- remove the `//` you added in `index.ts` in step 5

Check each route after you write it:

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login -ContentType "application/json" -Body '{"email":"admin@test.com","password":"password123"}'
$h = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod -Uri http://localhost:5000/api/books -Headers $h
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/books -Headers $h -ContentType "application/json" -Body '{"title":"Test","author":"Me","published_year":2020}'
```

---

# FRONTEND

## Step 10 - Install (terminal 2, from the project folder)

**Or use `INSTALL.md` Block 5 (it also writes `config.ts` and the empty files).**


```powershell
npx -y create-vite@latest frontend --template react-ts --no-interactive
cd frontend
npm i
npm i styled-components
mkdir src/types, src/context, src/api, src/components
```

(`styled-components` only because the PulseDesk components use it.)

## Step 11 - Copy the frontend files that barely change

Run from the new `frontend/` folder:

```powershell
$F = "C:\Users\Higurashi\OneDrive\Documents\task force\mockupa\pulsedesk\frontend\src"
Copy-Item "$F\api\config.ts", "$F\api\authService.ts" -Destination .\src\api\
Copy-Item "$F\components\styles.ts", "$F\components\AuthForm.tsx" -Destination .\src\components\
```

Change: `config.ts` -> the port (only if not 5000).
`authService.ts` + `AuthForm.tsx` -> only if the login is not email.

## Step 12 - `types/index.ts`

Open: `FRONTEND-1-TYPES.md` (section 5 = PulseDesk, section 6 = a different project)
Copy: `pulsedesk/frontend/src/types/index.ts`
Change: `State` and `Action` = **copy them exactly from the spec**, the item interface = your fields
(`id: string`, no `?` on fields the server always fills), the dropdown lists = your CHECK values.

## Step 13 - the context

Open: `FRONTEND-2-CONTEXT.md` (section 3 = action -> case recipes, section 5 = a different project)
Copy: `pulsedesk/frontend/src/context/IncidentContext.tsx` -> rename it (`BookContext.tsx`)
Change: `Incident` -> `Book`, `incidents` -> `books`, and **one `case` per action** in the spec's `Action`.
The spec has an action table with rules ("must stay between", "if ... then")? Use `FRONTEND-4-ACTIONS.md`
for each row and `FRONTEND-5-REDUCER-RULES.md` for each rule.

## Step 14 - the service

Open: `FRONTEND-3-SERVICE.md` (section 5 = PulseDesk -> a different project)
Copy: `pulsedesk/frontend/src/api/incidentService.ts` -> rename it (`bookService.ts`)
Change: the URLs, the function names, the types, and the fields of each body = your Zod schemas.
Add a function for any extra row in the spec table.

## Step 15 - the components

Copy: `IncidentList.tsx` and `IncidentForm.tsx` from `pulsedesk/frontend/src/components/` -> rename them
Change:
- `IncidentList` -> what each card shows + the update / delete buttons (they call your service, then dispatch)
- `IncidentForm` -> one input per field of the create body (numbers -> `Number(value)`)
- `AuthForm` -> the context name

## Step 16 - `App.tsx`

Copy: `pulsedesk/frontend/src/App.tsx`
Change: the Provider name, the title, the component names.

Check: `npm run dev` -> http://localhost:5173 -> log in -> create, update, delete.

---

## Rename in one go (VS Code Find & Replace)

Inside a copied file press **Ctrl+H**, turn on **Match Case** (the `Aa` button), and replace in this order:

| Find | Replace | Changes |
|---|---|---|
| `Incident` | `Book` | `Incident`, `Incidents`, `IncidentContext`, `createIncidentSchema` ... |
| `incident` | `book` | `incident`, `incidents`, `/incidents`, `fetchIncidents` ... |

Then fix by hand only the **fields** (title/description/severity/status -> your columns).

---

## Final check (before you hand it in)

| Check | Where |
|---|---|
| Every spec row has a route with the same method, path, protection and middleware | `BACKEND-4-ROUTES.md` section 4 |
| Column names are the same in `schema.sql`, `types.ts`, `schemas.ts`, the SQL in the routes, and the frontend body | all files |
| The CHECK values = the Zod enums = the frontend dropdown options | `schema.sql`, `schemas.ts`, `types/index.ts` |
| `State` and `Action` are copied exactly from the spec | `frontend/src/types/index.ts` |
| Backend and frontend both run with no red errors in the terminal | both terminals |
| Log in, create, update, delete all work in the browser | http://localhost:5173 |
