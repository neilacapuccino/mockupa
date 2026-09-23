# Install - backend + frontend, ready to use

Paste each block into the **VS Code terminal (PowerShell)**, one block at a time.
The blocks install everything (latest versions) **and** write the config + base files,
so the backend runs and login works right away.

| Block | Does |
|---|---|
| 1 | your names (project, database, Postgres password) |
| 2 | backend: packages + `package.json` script + `tsconfig.json` |
| 3 | backend: `.env`, `.gitignore`, and the files that are the same in every project |
| 4 | database: create it + run `schema.sql` |
| 5 | frontend: Vite + React + folders + `API_URL` |
| 6 | run both |

Before you start: Node.js and PostgreSQL are installed, and you know your Postgres password.
Open the terminal in the folder where you keep projects.

---

## Block 1 - your names

Change the 3 values, then paste. The next blocks use them.

```powershell
$PROJECT = "myproject"
$DB = "mydb"
$PGPASS = "your_postgres_password"
```

---

## Block 2 - backend: packages + config

```powershell
mkdir $PROJECT; cd $PROJECT; mkdir backend; cd backend
npm init -y
npm i express pg dotenv zod jsonwebtoken bcryptjs cors
npm i -D typescript tsx @types/node @types/express @types/pg @types/jsonwebtoken @types/cors
npm pkg set "scripts.dev=tsx watch src/index.ts"
npx tsc --init --module commonjs --types node --verbatimModuleSyntax false --exactOptionalPropertyTypes false --rootDir src --outDir dist
mkdir src/types/express
ni src/types.ts, src/itemRoutes.ts
```

What it set up:

| Command | Result |
|---|---|
| `npm i express pg dotenv zod jsonwebtoken bcryptjs cors` | the packages the app uses |
| `npm i -D typescript tsx @types/...` | TypeScript + running `.ts` files + types |
| `npm pkg set "scripts.dev=..."` | `npm run dev` = start the server and restart on every save |
| `npx tsc --init --module commonjs ...` | `tsconfig.json` that works with `import { pool } from "./db"` (no `.js` endings) |
| `ni src/types.ts, src/itemRoutes.ts` | empty files you fill in for your project |

---

## Block 3 - backend: `.env`, `.gitignore`, base files

Writes 9 files. Paste the whole block at once.

```powershell
$SECRET = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Set-Content -Encoding ascii -Path .env -Value @"
PORT=5000
PGUSER=postgres
PGHOST=localhost
PGDATABASE=$DB
PGPASSWORD=$PGPASS
PGPORT=5432
JWT_SECRET=$SECRET
"@

Set-Content -Encoding ascii -Path .gitignore -Value @'
node_modules
dist
'@

Set-Content -Encoding ascii -Path src\db.ts -Value @'
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
'@

Set-Content -Encoding ascii -Path src\validate.ts -Value @'
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

// the spec may call it validate(...)
export const validate = validateResource;
'@

Set-Content -Encoding ascii -Path src\types\express\index.d.ts -Value @'
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    export interface Request {
      user?: string | JwtPayload;
    }
  }
}
'@

Set-Content -Encoding ascii -Path src\authMiddleware.ts -Value @'
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header("Authorization");

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    res.status(403).json({
      error: "Invalid or expired token.",
    });
  }
};
'@

Set-Content -Encoding ascii -Path src\schemas.ts -Value @'
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
// ITEMS - add your schemas here (BACKEND-3-ZOD.md)
// ========================================
'@

Set-Content -Encoding ascii -Path src\authRoutes.ts -Value @'
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "./db";
import { validateResource } from "./validate";
import { loginSchema } from "./schemas";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";


// POST /api/auth/login  (public)
router.post(
  "/login",
  validateResource(loginSchema),
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const result = await pool.query(
        `SELECT * FROM users
         WHERE email = $1`,
        [email]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.json({
        message: "Login successful",
        token,
        user: { id: user.id, email: user.email },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);


export default router;
'@

Set-Content -Encoding ascii -Path src\index.ts -Value @'
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./authRoutes";
// import itemRoutes from "./itemRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
// app.use("/api/items", itemRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}/`);
});

app.get("/", (_req, res) => {
  res.send("hello from server");
});
'@

Set-Content -Encoding ascii -Path schema.sql -Value @'
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- change this table to your project (BACKEND-1-SCHEMA.md)
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    status VARCHAR(20) DEFAULT 'open'
        CHECK (status IN ('open', 'done')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- login: admin@test.com / password123
INSERT INTO users (email, password_hash)
VALUES ('admin@test.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');
'@

Get-ChildItem .env, .gitignore, schema.sql, src -Recurse -File | ForEach-Object { $_.FullName.Replace("$PWD\", "") }
```

The files it wrote:

| File | Ready? |
|---|---|
| `.env` | yes - your database, password, and a random `JWT_SECRET` |
| `.gitignore` | yes - `node_modules`, `dist` (`.env` is kept) |
| `src/db.ts`, `src/validate.ts`, `src/authMiddleware.ts`, `src/types/express/index.d.ts` | yes - never change |
| `src/authRoutes.ts` + `loginSchema` in `src/schemas.ts` | yes - login with email (change the field if the spec logs in with something else) |
| `src/index.ts` | yes - the items routes are commented out until you write them |
| `schema.sql` | starter - change the `items` table to your project |
| `src/types.ts`, `src/itemRoutes.ts` | empty - you write them |

---

## Block 4 - database

From the `backend` folder (it asks for your Postgres password each time):

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE $DB;"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d $DB -f ".\schema.sql"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d $DB -c "\dt"
```

`\dt` should list `items` and `users`. Changed `schema.sql` later? Run only the second line again.
The first time, `NOTICE: table "items" does not exist, skipping` is normal (the `DROP ... IF EXISTS` lines).

---

## Block 5 - frontend

Opens from the project folder (next to `backend`):

```powershell
cd ..
npx -y create-vite@latest frontend --template react-ts --no-interactive
cd frontend
npm i
mkdir src/types, src/context, src/api, src/components
Set-Content -Encoding ascii -Path src\api\config.ts -Value @'
// the backend address - change the port here if the backend port changes
export const API_URL = "http://localhost:5000/api";
'@
ni src/types/index.ts, src/context/AppContext.tsx, src/api/authService.ts, src/api/itemService.ts, src/components/AuthForm.tsx, src/components/ItemForm.tsx, src/components/ItemList.tsx
Clear-Content src/App.css, src/index.css
```

| What | Result |
|---|---|
| `create-vite ... --no-interactive` | React + TypeScript project, no questions asked |
| `src/api/config.ts` | ready - points to the backend on port 5000 |
| the other new files | empty - fill them with `FRONTEND-1-TYPES.md`, `FRONTEND-2-CONTEXT.md`, `FRONTEND-3-SERVICE.md` |
| `Clear-Content` | removes Vite's demo styles |

Using the PulseDesk components (they use styled-components)? Also run `npm i styled-components`.

---

## Block 6 - run both

Terminal 1:

```powershell
cd "..\backend"
npm run dev
```

Terminal 2 (click `+` in the terminal panel, then go to your project's `frontend` folder):

```powershell
npm run dev
```

Check:

| Open / run | You should see |
|---|---|
| http://localhost:5000 | `hello from server` |
| the login test below | a `token` |
| http://localhost:5173 | the Vite page (until you write `App.tsx`) |

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login -ContentType "application/json" -Body '{"email":"admin@test.com","password":"password123"}'
```

---

## After installing

Build the rest in this order -> `ORDER.md` (from step 6 for the backend, step 12 for the frontend).

| Problem | Fix |
|---|---|
| `EADDRINUSE` | port 5000 is busy -> change `PORT` in `.env` and `API_URL` in `config.ts` |
| `password authentication failed` | wrong `PGPASSWORD` in `.env` |
| `database ... does not exist` | run Block 4 |
| `$DB` / `$PROJECT` is empty | you opened a new terminal - paste Block 1 again |
| login says "Invalid email or password" | run the `-f schema.sql` line again (it adds the test user) |
