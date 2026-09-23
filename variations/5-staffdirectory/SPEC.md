# Variation 5 — StaffDirectory (Big Table: Filter, Sort, Pages)

**Target Architecture:** Node.js (ExpressJS + TypeScript + DB) Backend & React (TypeScript) Frontend
**Core Assessment Criteria:** Zod Validation, JWT Authentication, Express Middlewares, Full CRUD Operations, React Context + useReducer, Global Dispatching.

## System Overview
HR keeps a directory of **24 employees** in 5 departments. Each employee has **11 fields**.
The list can be **searched, filtered, sorted and split into pages**, all on the server.
Employees are never really deleted, they are **deactivated** ("soft delete").

**Rules (the server must enforce these):**
- Email must be unique → **409**
- Deactivating someone who is already inactive (or reactivating someone active) → **409**
- Only `last_name`, `salary`, `hire_date` can be used for sorting (Zod enum → safe SQL)

## NEW concepts (compared to PulseDesk)
| Concept | Where |
|---|---|
| **Many columns** (11) + **lots of rows** (24), seeded with one `INSERT ... SELECT ... FROM (VALUES ...)` | `schema.sql` |
| Lookup table (`departments`) + `LEFT JOIN` to get `department_name` | `employeeRoutes.ts` |
| **Many optional query params**, all checked by Zod | `employeeQuerySchema` |
| Building the `WHERE` from an array of conditions (`$1, $2...` numbered as you go) | `GET /api/employees` |
| **Pagination**: `LIMIT` + `OFFSET`, plus a `COUNT(*)` for "page 1 of 5" | `GET /api/employees` |
| New response shape: `{ data, total, page, limit, totalPages }` | `GET /api/employees` |
| **Soft delete** (`is_active = false`) + reactivate | `DELETE`, `PATCH /:id/reactivate` |
| Helper function reused by many routes (`findEmployee`) | `employeeRoutes.ts` |
| **One form object + ONE `handleChange`** using `e.target.name` | `EmployeeForm.tsx` |
| Same form for **add AND edit** (`state.editing`) | `EmployeeForm.tsx` |
| **One action for every filter**: `SET_FILTER { name, value }` → `[name]: value` | `DirectoryContext.tsx` |
| `REFRESH` action → "load the list again" (the server decides what's on each page) | `DirectoryContext.tsx` |
| `URLSearchParams` to build the query string | `employeeService.ts` |

## API Endpoints
| Method | Endpoint | Protection | Middleware | Description |
|---|---|---|---|---|
| POST | /api/auth/login | Public | validate(loginSchema) | Returns JWT + user |
| GET | /api/departments | JWT Protected | None | **READ** departments (for dropdowns) |
| GET | /api/employees?search=&department_id=&status=&sort=&order=&page=&limit= | JWT Protected | validate(employeeQuerySchema) | **READ** one page of employees |
| GET | /api/employees/:id | JWT Protected | validate(employeeIdSchema) | **READ** one employee |
| POST | /api/employees | JWT Protected | validate(createEmployeeSchema) | **CREATE** (409 duplicate email) |
| PUT | /api/employees/:id | JWT Protected | validate(updateEmployeeSchema) | **UPDATE** any fields |
| PATCH | /api/employees/:id/reactivate | JWT Protected | validate(employeeIdSchema) | **UPDATE** is_active = true |
| DELETE | /api/employees/:id | JWT Protected | None | **soft DELETE** (is_active = false) |

## Frontend State & Actions (`src/types/index.ts`)
```ts
export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  employees: Employee[];
  departments: Department[];
  filters: { search: string; department_id: string; status: string; sort: string; order: string };
  page: number;
  totalPages: number;
  total: number;
  editing: Employee | null;
  refreshKey: number;
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: 'SET_AUTH'; payload: { user: any; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_DEPARTMENTS'; payload: Department[] }
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: { data: Employee[]; total: number; totalPages: number } }
  | { type: 'SET_FILTER'; payload: { name: string; value: string } }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'START_EDIT'; payload: Employee }
  | { type: 'CANCEL_EDIT' }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'REFRESH' }
  | { type: 'SET_ERROR'; payload: string };
```

## Test account (password: `password123`)
- hr@company.com

Things to try: sort by salary descending, filter Sales + "All", go to page 2,
add someone with `ana.reyes@company.com` (→ 409), deactivate someone while the filter is "Active".

## Run it
- **All 6 at once:** see `variations/README.md` (`npm run dev` in the variations folder).
- **On its own** (e.g. after copying `backend/` and `frontend/` into another project):
  - backend (port **5005**): `cd backend` → `npm i` → create the `staffdirectory` database and run `schema.sql` → `npm run dev`
  - frontend: `cd frontend` → `npm i` → `npm run dev`
