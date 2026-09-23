# Variation 7 — ClassPortal (Student ID / Employee No login)

**Target Architecture:** Node.js (ExpressJS + TypeScript + DB) Backend & React (TypeScript) Frontend
**Core Assessment Criteria:** Zod Validation, JWT Authentication, Express Middlewares, Full CRUD Operations, React Context + useReducer, Global Dispatching.

## System Overview
A school grade portal with **two kinds of accounts stored in two different tables**:
- **Students** log in with their **student number** (`2024-00123`) and can only see **their own** grades + average.
- **Teachers** log in with their **employee number** (`T-1001`) and can see every student, and add / edit / delete grades.

**Rules (the server must enforce these):**
- ID numbers must match their format (Zod regex) → **400**
- Student routes reject teachers, teacher routes reject students → **403**
- One grade per subject per student → **409**; score must be 0–100 → **400**
- Grading a student that doesn't exist → **404** (foreign key error `23503`)

## NEW concepts (compared to the others)
| Concept | Where |
|---|---|
| **Login with an ID number** checked by a **regex** (`/^\d{4}-\d{5}$/`, `/^T-\d{4}$/`) | `schemas.ts` |
| **Two account tables** → **two login routes** (`/student-login`, `/teacher-login`) | `authRoutes.ts` |
| Account **type inside the JWT** (`type: "student"`) + `requireTeacher` / `requireStudent` | `authMiddleware.ts` |
| "Mine" route: the id comes from the **token**, never from the URL (`GET /grades/mine`) | `gradeRoutes.ts` |
| SQL **`CASE WHEN`** (Passed / Failed) and **`AVG`** (`ROUND(AVG(score), 1)::float`) | `gradeRoutes.ts`, `studentRoutes.ts` |
| `UNIQUE (student_id, subject)` + catching **two** error codes (`23505`, `23503`) | `schema.sql`, `POST /grades` |
| Frontend: **radio buttons** pick the account type → different field, hint and route | `LoginForm.tsx` |
| Frontend: the account type picks the **whole dashboard** (`TeacherView` / `StudentView`) | `App.tsx` |

## API Endpoints
| Method | Endpoint | Protection | Middleware | Description |
|---|---|---|---|---|
| POST | /api/auth/student-login | Public | validate(studentLoginSchema) | JWT for a student |
| POST | /api/auth/teacher-login | Public | validate(teacherLoginSchema) | JWT for a teacher |
| GET | /api/grades/mine | JWT + **Student** | requireStudent | **READ** my grades + average |
| GET | /api/students | JWT + **Teacher** | requireTeacher | **READ** students + averages |
| GET | /api/grades?student_id= | JWT + **Teacher** | requireTeacher, validate(gradeQuerySchema) | **READ** one student's grades |
| POST | /api/grades | JWT + **Teacher** | requireTeacher, validate(createGradeSchema) | **CREATE** grade |
| PATCH | /api/grades/:id | JWT + **Teacher** | requireTeacher, validate(updateGradeSchema) | **UPDATE** score |
| DELETE | /api/grades/:id | JWT + **Teacher** | requireTeacher | **DELETE** grade |

## Frontend State & Actions (`src/types/index.ts`)
```ts
export interface State {
  user: { id: string; name: string; type: string; number: string } | null;
  token: string | null;
  students: StudentSummary[];
  selectedStudentId: string | null;
  grades: Grade[];
  average: number | null;
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'FETCH_START' }
  | { type: 'SET_STUDENTS'; payload: StudentSummary[] }
  | { type: 'SELECT_STUDENT'; payload: string | null }
  | { type: 'SET_GRADES'; payload: { grades: Grade[]; average: number | null } }
  | { type: 'SET_ERROR'; payload: string };
```

## Test accounts (password: `password123`)
- Students: `2024-00123` (Juan), `2024-00124` (Maria), `2023-00088` (Pedro)
- Teacher: `T-1001` (Ms. Santos)

Things to try: log in as a student with `T-1001` selected as "Student" (→ 400 format),
add "Networking" twice for the same student (→ 409), set a score to 150 (→ 400).

## Run it
- **All at once:** see `variations/README.md` (`npm run dev` in the variations folder).
- **On its own** (e.g. after copying `backend/` and `frontend/` into another project):
  - backend (port **5007**): `cd backend` → `npm i` → create the `classportal` database and run `schema.sql` → `npm run dev`
  - frontend: `cd frontend` → `npm i` → `npm run dev`
