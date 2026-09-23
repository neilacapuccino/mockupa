# Variation 9 — EventPass (Mobile login, Remember me, Guests, Token expiry)

**Target Architecture:** Node.js (ExpressJS + TypeScript + DB) Backend & React (TypeScript) Frontend
**Core Assessment Criteria:** Zod Validation, JWT Authentication, Express Middlewares, Full CRUD Operations, React Context + useReducer, Global Dispatching.

## System Overview
An event sign-up app. **Guests can browse** events. Logged-in users (login with a **mobile number**)
can create events and register / cancel. Logged-in users also see **which events they joined**.

**Rules (the server must enforce these):**
- Mobile number must look like `09171234567` (Zod regex) → **400**
- "Remember me" → token lasts **7 days**, otherwise **15 minutes**
- Can't register for a **past** event → **400**, a **full** event → **409**, **twice** → **409**
- Can't cancel for a past event → **400**; not registered → **404**
- New events must be in the future → **400**

## NEW concepts (compared to the others)
| Concept | Where |
|---|---|
| Login with a **mobile number** (regex `/^09\d{9}$/`) | `schemas.ts` |
| **Remember me**: the token's `expiresIn` depends on a checkbox (`"7d"` or `"15m"`) | `authRoutes.ts` |
| **`optionalAuth` middleware**: never blocks — guests continue, users get `req.user` | `authMiddleware.ts` |
| Same list for guests and users; users also get `is_registered` (`BOOL_OR`) | `GET /api/events` |
| `TIMESTAMPTZ` date+time, `NOW()`, `INTERVAL`, `z.iso.datetime({ local: true })` | `schema.sql`, `schemas.ts` |
| Rules checked **in order** (404 → 400 → 409 → 409) before inserting | `POST /:id/register` |
| Register / cancel as **POST / DELETE on the same URL** (`/:id/register`) | `eventRoutes.ts` |
| Frontend: **localStorage vs sessionStorage** | `api/session.ts` |
| Frontend: **read the token's `exp`** (base64 → JSON) and show when the session ends | `api/session.ts`, `SessionInfo.tsx` |
| Frontend: **auto-logout** with `setTimeout` + cleanup, and on any "expired token" error | `SessionInfo.tsx`, `handleApiError` |
| Frontend: send the `Authorization` header **only if** there is a token | `eventService.ts` |

## API Endpoints
| Method | Endpoint | Protection | Middleware | Description |
|---|---|---|---|---|
| POST | /api/auth/login | Public | validate(loginSchema) | JWT (7d or 15m) + user |
| GET | /api/events | **Optional** | optionalAuth | **READ** events (+ is_registered if logged in) |
| GET | /api/events/mine | JWT Protected | None | **READ** events I joined |
| POST | /api/events | JWT Protected | validate(createEventSchema) | **CREATE** event |
| POST | /api/events/:id/register | JWT Protected | validate(eventIdSchema) | join (rules above) |
| DELETE | /api/events/:id/register | JWT Protected | validate(eventIdSchema) | cancel (rules above) |

## Frontend State & Actions (`src/types/index.ts`)
```ts
export interface State {
  user: { id: string; name: string; mobile: string } | null;
  token: string | null;
  events: EventItem[];
  view: string;              // "all" | "mine"
  notice: string | null;     // "Your session expired..."
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'FETCH_START' }
  | { type: 'SET_EVENTS'; payload: EventItem[] }
  | { type: 'ADD_EVENT'; payload: EventItem }
  | { type: 'UPDATE_EVENT'; payload: EventItem }
  | { type: 'SET_VIEW'; payload: string }
  | { type: 'SET_ERROR'; payload: string };
```

## Test accounts (password: `password123`)
- `09171234567` (Ana) — registered for Hackathon Kickoff + Career Talk
- `09181234567` (Ben)

Things to try: browse as a guest, then log in (the "you're registered" marks appear),
try the FULL Hackathon (→ 409) and the PAST Intro to SQL (→ 400).
To see the auto-logout fast: change `"15m"` to `"30s"` in `backend/src/authRoutes.ts`,
log in WITHOUT "remember me" and wait 30 seconds.

## Run it
- **All at once:** see `variations/README.md` (`npm run dev` in the variations folder).
- **On its own** (e.g. after copying `backend/` and `frontend/` into another project):
  - backend (port **5009**): `cd backend` → `npm i` → create the `eventpass` database and run `schema.sql` → `npm run dev`
  - frontend: `cd frontend` → `npm i` → `npm run dev`
