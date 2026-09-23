# Start a full-stack project from zero

Express + TypeScript + PostgreSQL backend, React + TypeScript (Vite) frontend.
Same stack as the exam (Zod, JWT, bcryptjs, cors, Context + useReducer).

> What's in this repo:
> - `pulsedesk/` — the exam sample, done
> - `variations/` — 9 practice exams (see `variations/README.md`)
> - `CHEATSHEET.md` — error codes, Zod, auth, SQL, React methods and how to use them

Commands are for the **VS Code terminal (PowerShell)**. Paste each block as a whole.
`npm i` always installs the **latest** versions (when this was written: Express 5, Zod 4, TypeScript 7,
React 19, Vite 8).

---

## 0. Folder layout
```
myproject/
  backend/     <- its own npm project (port 5000)
  frontend/    <- its own npm project (port 5173)
```
Two separate projects on two ports -> the backend needs **cors**.

---

## 1. Backend — install everything
Run from the folder where you keep projects:
```powershell
mkdir myproject; cd myproject; mkdir backend; cd backend
npm init -y
npm i express pg dotenv zod jsonwebtoken bcryptjs cors
npm i -D typescript tsx @types/node @types/express @types/pg @types/jsonwebtoken @types/cors
npm pkg set "scripts.dev=tsx watch src/index.ts"
npx tsc --init --module commonjs --types node --verbatimModuleSyntax false --exactOptionalPropertyTypes false --rootDir src --outDir dist
mkdir src/types/express
ni src/index.ts, src/db.ts, src/types.ts, src/schemas.ts, src/validate.ts, src/authMiddleware.ts, src/authRoutes.ts, src/itemRoutes.ts, src/types/express/index.d.ts, .env, .gitignore, schema.sql
```
| Package | What it's for |
|---|---|
| `express` | the server + routes |
| `pg` | talk to PostgreSQL (`pool.query`) |
| `dotenv` | read `.env` into `process.env` |
| `zod` | validate the request (body / params / query) |
| `jsonwebtoken` | make + check JWT tokens |
| `bcryptjs` | hash + compare passwords (has its own types, no `@types/bcryptjs`) |
| `cors` | let the frontend (another port) call the backend |
| `typescript`, `tsx` | TypeScript + run it with auto-restart (`tsx watch`) |
| `@types/...` | TypeScript types for the packages above |

What the `tsc --init` flags do:
- `--module commonjs` → `import { pool } from "./db"` works **without** `.js` at the end
- `--types node` → `process.env` is known
- `--verbatimModuleSyntax false` → otherwise it fights with commonjs
- `--exactOptionalPropertyTypes false` → fewer confusing "optional" errors

### `.gitignore`
```
node_modules
.env
dist
```

### `.env`
```
PORT=5000
PGUSER=postgres
PGHOST=localhost
PGDATABASE=mydb
PGPASSWORD=your_postgres_password
PGPORT=5432
JWT_SECRET=paste_a_long_random_string_here
```
Make a random `JWT_SECRET`:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- `PGPASSWORD` = the password you chose when you installed PostgreSQL
- if port 5000 is busy -> use another number (and change the frontend `API_URL` too)
- **never** put `.env` on GitHub (that's what `.gitignore` is for)

---

## 2. Database

### `schema.sql` (starter — change the `items` table to your topic)
```sql
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    status VARCHAR(20) DEFAULT 'open'
        CHECK (status IN ('open', 'done')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- test account: admin@test.com / password123
INSERT INTO users (email, password_hash)
VALUES ('admin@test.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');
```
- `UUID` ids come back as **strings** (good when the frontend spec says `id: string`).
  With `SERIAL` they come back as **numbers**.
- Need a hash for another password? (run inside `backend/` after `npm i`)
  ```powershell
  node -e "console.log(require('bcryptjs').hashSync('password123', 10))"
  ```

### Create the database + run the file (from `backend/`)
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE mydb;"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d mydb -f ".\schema.sql"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d mydb -c "\dt"
```
- `CREATE DATABASE` only once (after that: "already exists" = fine)
- `-f schema.sql` again any time = **wipes the data** and starts fresh (because of `DROP TABLE`)
- `\dt` = list the tables (check it worked)
- the `&` is needed in PowerShell to run a program whose path has quotes

---

## 3. Backend — the files that are the SAME in every project

### `src/db.ts`
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

### `src/index.ts`
```ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./authRoutes";
import itemRoutes from "./itemRoutes";

dotenv.config();

const app = express();

app.use(cors());            // let the frontend call us
app.use(express.json());    // turn the JSON body into req.body

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}/`);
});

app.get("/", (_req, res) => {
  res.send("hello from server");
});
```

### `src/validate.ts` (Zod v4)
```ts
import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const validateResource =
  (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      next(error);
    }
  };
```

### `src/types/express/index.d.ts`
```ts
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    export interface Request {
      user?: string | JwtPayload;
    }
  }
}
```

### `src/authMiddleware.ts`
```ts
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header("Authorization");     // "Bearer eyJhbGci..."
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token." });
  }
};
```

### What you write per project
`types.ts` → `schemas.ts` → `authRoutes.ts` → `itemRoutes.ts`.
Copy the patterns from `CHEATSHEET.md` (login/register, CRUD route template, Zod schemas)
or from any `variations/*/backend/src`.

### Start it
```powershell
npm run dev
```
Open http://localhost:5000 -> "hello from server".

### Test without a frontend (second terminal)
```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login -ContentType "application/json" -Body '{"email":"admin@test.com","password":"password123"}'
$h = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod -Uri http://localhost:5000/api/items -Headers $h
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/items -Headers $h -ContentType "application/json" -Body '{"title":"First item"}'
```
(Thunder Client / Postman work too: same URL, method, JSON body and `Authorization: Bearer <token>` header.)

---

## 4. Frontend — install everything
Open a **second terminal** (keep the backend running), go to `myproject/`:
```powershell
npx -y create-vite@latest frontend --template react-ts --no-interactive
cd frontend
npm i
mkdir src/types, src/context, src/api, src/components
ni src/types/index.ts, src/context/AppContext.tsx, src/api/config.ts, src/api/authService.ts, src/api/itemService.ts, src/components/AuthForm.tsx, src/components/ItemForm.tsx, src/components/ItemList.tsx
Clear-Content src/App.css, src/index.css
npm run dev
```
- `-y` and `--no-interactive` = it won't stop to ask questions (safe to paste as a block)
- `Clear-Content` empties Vite's demo CSS
- optional styling: `npm i styled-components`
- no tsconfig to write: Vite already made it

Two rules from Vite's TypeScript settings:
- type-only imports need `type`: `import type { State } from "../types";`
- unused variables/imports = red squiggle (the app still runs)

### `src/api/config.ts`
```ts
// the backend address - change it here if the backend port changes
export const API_URL = "http://localhost:5000/api";
```

### Then write, in this order
`types/index.ts` (State + Action from the spec) → `context/AppContext.tsx` (reducer + Provider)
→ `api/authService.ts` + `AuthForm.tsx` → `api/itemService.ts` + `ItemList.tsx` → `ItemForm.tsx` → `App.tsx`.
All the patterns are in `CHEATSHEET.md` → "React".

Open http://localhost:5173.

---

## 5. When something goes wrong at the start
| You see | It means | Fix |
|---|---|---|
| `EADDRINUSE :::5000` | the port is already used (another server still running) | stop it (Ctrl+C in its terminal) or change `PORT` |
| `password authentication failed for user "postgres"` | wrong `PGPASSWORD` | fix `.env` |
| `database "mydb" does not exist` | forgot `CREATE DATABASE` or typo in `PGDATABASE` | create it / fix `.env` |
| `relation "items" does not exist` | the table isn't there | run `schema.sql` in the **right** database |
| `column "x" does not exist` | your code and your `schema.sql` don't match | fix one of them, re-run `schema.sql` |
| `Failed to fetch` (frontend) | the backend isn't running, wrong port, or CORS | start the backend, check `API_URL`, `app.use(cors())` |
| `...is a type and must be imported using a type-only import` | Vite's `verbatimModuleSyntax` | `import type { X } from ...` |
| red squiggles everywhere in a `.tsx` | VS Code can't find the `tsconfig.json` | open the right folder / Ctrl+Shift+P → "TypeScript: Restart TS Server" |
| `Cannot find module 'express'` | forgot `npm i` in that folder | `npm i` |
| every protected route says 403 | token signed with a different secret, or expired | log in again; `JWT_SECRET` must be the same everywhere |
