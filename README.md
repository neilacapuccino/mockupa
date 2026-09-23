# Start a full-stack project from zero

mkdir pulsedesk; cd pulsedesk; mkdir backend; cd backend
npm init -y
npm i express pg dotenv zod jsonwebtoken bcryptjs cors
npm i -D typescript tsx @types/node @types/express @types/pg @types/jsonwebtoken @types/cors
npm pkg set "scripts.dev=tsx watch src/index.ts"
npx tsc --init --module commonjs --types node --verbatimModuleSyntax false --exactOptionalPropertyTypes false --rootDir src --outDir dist
mkdir src/types/express

ni src/index.ts, src/db.ts, src/types.ts, src/schemas.ts, src/validate.ts, src/authMiddleware.ts, src/authRoutes.ts, src/incidentRoutes.ts, src/types/express/index.d.ts, .env, schema.sql

& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE pulsedesk;" <-change name
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d pulsedesk -f ".\schema.sql"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d pulsedesk -c "\dt"

dotenv
schemasql
db.ts
types
schema ts
validate
auth route
jwt middlewaare
inc

---

## The steps in order

### Backend (terminal 1)
1. Run the commands at the top (from the folder where you keep projects)
2. Fill `.env`:
   ```
   PORT=5000
   PGUSER=postgres
   PGHOST=localhost
   PGDATABASE=pulsedesk
   PGPASSWORD=your_postgres_password
   PGPORT=5432
   JWT_SECRET=any_long_random_text
   ```
3. Write `schema.sql`, then run the 3 `psql` lines at the top
4. Write the files in this order (copy from `pulsedesk/backend/src/`):
   `db.ts` → `index.ts` → `types.ts` → `schemas.ts` → `validate.ts` → `types/express/index.d.ts` → `authMiddleware.ts` → `authRoutes.ts` → `incidentRoutes.ts`
5. `npm run dev` → open http://localhost:5000

### Frontend (terminal 2, from the project folder)
```powershell
npx -y create-vite@latest frontend --template react-ts --no-interactive
cd frontend
npm i
npm run dev
```
Write the files in this order (copy from `pulsedesk/frontend/src/`):
`types/index.ts` → `context/...Context.tsx` → `api/config.ts` → `api/...Service.ts` → `components/...` → `App.tsx`

Open http://localhost:5173

---

## If something breaks
| You see | Fix |
|---|---|
| `EADDRINUSE` | the port is busy → stop the other server (Ctrl+C) or change `PORT` |
| `password authentication failed` | wrong `PGPASSWORD` in `.env` |
| `database ... does not exist` / `relation ... does not exist` | run the `psql` lines again |
| `Failed to fetch` (frontend) | the backend isn't running, or `API_URL` has the wrong port |
| `must be imported using a type-only import` | write `import type { X } from ...` |
| red squiggles everywhere | Ctrl+Shift+P → "TypeScript: Restart TS Server" |

---

## Where to find things
| I need... | Look at |
|---|---|
| a finished example | `pulsedesk/` (the exam sample) |
| more practice exams | `variations/` → read its `README.md` |
| status codes, SQL, auth, React patterns | `CHEATSHEET.md` |
| Zod rules with examples | `ZOD.md` |
