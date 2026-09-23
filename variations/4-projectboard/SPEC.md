# Variation 4 — ProjectBoard (Projects → Tasks)

**Target Architecture:** Node.js (ExpressJS + TypeScript + DB) Backend & React (TypeScript) Frontend
**Core Assessment Criteria:** Zod Validation, JWT Authentication, Express Middlewares, Full CRUD Operations, React Context + useReducer, Global Dispatching.

## System Overview
A team lead manages **projects**, and every project has many **tasks**.
Tasks move through `todo → doing → done`.

**Rules (the server must enforce these):**
- A task can only move **forward** (done → todo is not allowed) → **400**
- A project can only be deleted when **all its tasks are done** → **409**
- Adding a task to a project that doesn't exist → **404**

## NEW concepts (compared to PulseDesk)
| Concept | Where |
|---|---|
| **3 tables linked together**: users → projects → tasks (`project_id` foreign key, `ON DELETE CASCADE`) | `schema.sql` |
| `LEFT JOIN` + `COUNT(...)::int` + `GROUP BY` → each project with its task count | `GET /api/projects` |
| GET one project **+ its tasks** in one response (`{ ...project, tasks: [...] }`) | `GET /api/projects/:id` |
| **Nested route**: `POST /api/projects/:projectId/tasks` (Zod checks params **and** body) | `projectRoutes.ts` |
| **Two route files** mounted on different paths | `index.ts` |
| Rule with an array: `STATUS_ORDER.indexOf(...)` → can't move backwards | `taskRoutes.ts` |
| `DATE` column + `z.iso.date()` + keeping dates as `"2026-10-15"` strings | `db.ts`, `schemas.ts` |
| **Nested state**: tasks live inside `state.selected` | `BoardContext.tsx` |
| **One action changes two places**: `ADD_TASK` adds the task **and** +1 to the project's count | `BoardContext.tsx` |
| Derived value (`doneCount`) calculated from state, not stored | `ProjectDetail.tsx` |

## API Endpoints
| Method | Endpoint | Protection | Middleware | Description |
|---|---|---|---|---|
| POST | /api/auth/login | Public | validate(loginSchema) | Returns JWT + user |
| GET | /api/projects | JWT Protected | None | **READ** projects + task_count |
| GET | /api/projects/:id | JWT Protected | validate(projectIdSchema) | **READ** one project + its tasks |
| POST | /api/projects | JWT Protected | validate(createProjectSchema) | **CREATE** project |
| DELETE | /api/projects/:id | JWT Protected | validate(projectIdSchema) | **DELETE** (409 if unfinished tasks) |
| POST | /api/projects/:projectId/tasks | JWT Protected | validate(createTaskSchema) | **CREATE** task in a project |
| PATCH | /api/tasks/:id | JWT Protected | validate(updateTaskSchema) | **UPDATE** title/status/priority (400 backwards) |
| DELETE | /api/tasks/:id | JWT Protected | None | **DELETE** task |

## Frontend State & Actions (`src/types/index.ts`)
```ts
export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  projects: ProjectSummary[];        // the list (with task_count)
  selected: ProjectDetail | null;    // the OPEN project (with its tasks)
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: 'SET_AUTH'; payload: { user: any; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'FETCH_START' }
  | { type: 'FETCH_PROJECTS_SUCCESS'; payload: ProjectSummary[] }
  | { type: 'ADD_PROJECT'; payload: ProjectSummary }
  | { type: 'REMOVE_PROJECT'; payload: string }
  | { type: 'OPEN_PROJECT'; payload: ProjectDetail }
  | { type: 'CLOSE_PROJECT' }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'REMOVE_TASK'; payload: Task }
  | { type: 'SET_ERROR'; payload: string };
```

## Test account (password: `password123`)
- lead@board.com

Things to try:
- Delete **Exam Prep** → 409 (it has unfinished tasks). Delete **Finished Project** → works.
- Open a project and move a **done** task back to **todo** → 400.

## Run it
- **All 6 at once:** see `variations/README.md` (`npm run dev` in the variations folder).
- **On its own** (e.g. after copying `backend/` and `frontend/` into another project):
  - backend (port **5004**): `cd backend` → `npm i` → create the `projectboard` database and run `schema.sql` → `npm run dev`
  - frontend: `cd frontend` → `npm i` → `npm run dev`
