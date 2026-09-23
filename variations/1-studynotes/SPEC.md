# Variation 1 — StudyNotes (Personal Study Notes)

**Target Architecture:** Node.js (ExpressJS + TypeScript + DB) Backend & React (TypeScript) Frontend
**Core Assessment Criteria:** Zod Validation, JWT Authentication, Express Middlewares, Full CRUD Operations, React Context + useReducer, Global Dispatching.

## System Overview
StudyNotes lets students **register**, log in, and keep **private** study notes.
A user can only see, edit and delete **their own** notes — never someone else's.

## NEW concepts (compared to PulseDesk)
| Concept | Where |
|---|---|
| Register route (bcrypt.hash + 409 if email exists) | `authRoutes.ts` |
| Getting the logged-in user from the token: `(req.user as JwtPayload).userId` | `noteRoutes.ts` |
| Ownership: `WHERE id = $1 AND user_id = $2` (someone else's note → 404) | `noteRoutes.ts` |
| Foreign key `user_id REFERENCES users(id)` | `schema.sql` |
| Search with `?search=` (same as practice-c tasks) | `GET /api/notes` |
| PUT instead of PATCH, boolean field (`is_pinned`), checkbox uses `e.target.checked` | routes + `NoteForm.tsx` |

## Technology Matrix
- Backend: Node.js, ExpressJS, TypeScript, jsonwebtoken, bcryptjs, zod, cors
- Frontend: React, TypeScript, Context API + useReducer (plain HTML, no CSS)

## API Endpoints
| Method | Endpoint | Protection | Middleware | Description |
|---|---|---|---|---|
| POST | /api/auth/register | Public | validate(registerSchema) | **CREATE** account |
| POST | /api/auth/login | Public | validate(loginSchema) | Returns JWT + user |
| GET | /api/notes?search= | JWT Protected | None | **READ** my notes |
| POST | /api/notes | JWT Protected | validate(createNoteSchema) | **CREATE** note |
| PUT | /api/notes/:id | JWT Protected | validate(updateNoteSchema) | **UPDATE** title/content/is_pinned |
| DELETE | /api/notes/:id | JWT Protected | None | **DELETE** my note |

## Frontend State & Actions (`src/types/index.ts`)
```ts
export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  notes: Note[];
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: 'LOGIN_SUCCESS'; payload: { user: any; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Note[] }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'EDIT_NOTE'; payload: Note }
  | { type: 'REMOVE_NOTE'; payload: string }
  | { type: 'SET_ERROR'; payload: string };
```

## Test accounts (password for both: `password123`)
- alice@notes.com — has 2 notes
- bob@notes.com — has 1 note
Log in as each one: you must only see **your own** notes.

## Run it
See `variations/README.md` — one command starts all 3 backends + the page.

Frontend code for this variation: `variations/frontend/src/studynotes/`
