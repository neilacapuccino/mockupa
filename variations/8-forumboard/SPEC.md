# Variation 8 — ForumBoard (Username login, lockout, account management)

**Target Architecture:** Node.js (ExpressJS + TypeScript + DB) Backend & React (TypeScript) Frontend
**Core Assessment Criteria:** Zod Validation, JWT Authentication, Express Middlewares, Full CRUD Operations, React Context + useReducer, Global Dispatching.

## System Overview
A small forum. **Anyone can read posts** (no login). To post you need an account.
Accounts use a **username** (not an email) and are protected against password guessing.

**Rules (the server must enforce these):**
- Username: 3–20 letters, numbers or `_` (Zod regex); must be unique → **409**
- Register: `password` and `confirm_password` must match → **400**
- **3 wrong passwords in a row → account locked for 5 minutes → 423**
- Change password: current password must be right, new one must be different → **400**
- Only the author can edit / delete a post → **403**

## NEW concepts (compared to the others)
| Concept | Where |
|---|---|
| Login with a **username** (regex: `/^[a-zA-Z0-9_]{3,20}$/`) | `schemas.ts` |
| **Confirm password**: compare 2 body fields (backend AND frontend) | `POST /register`, `AuthForm.tsx` |
| **Account lockout**: `failed_attempts` + `locked_until`, status **423 Locked**, time math in SQL | `POST /login` |
| **`GET /me`**: restore the user after a refresh (the frontend only saves the token) | `authRoutes.ts`, `App.tsx` |
| **Change password**: `bcrypt.compare` the old one, `bcrypt.hash` the new one | `PATCH /password` |
| **Public GET** (no `authenticateToken`) next to protected POST/PUT/DELETE | `postRoutes.ts` |
| **403 vs 404** for someone else's item (compare with StudyNotes) | `PUT /posts/:id` |
| Frontend: `checkingSession` state + `SESSION_RESTORED` / `SESSION_FAILED` actions | `ForumContext.tsx` |
| Frontend: success **message** next to the error (`SET_MESSAGE`) | `ForumContext.tsx` |
| Frontend: show Edit/Delete **only on my posts** (`post.user_id === state.user.id`) | `PostList.tsx` |

## API Endpoints
| Method | Endpoint | Protection | Middleware | Description |
|---|---|---|---|---|
| GET | /api/auth/me | JWT Protected | None | **READ** the logged-in user |
| POST | /api/auth/register | Public | validate(registerSchema) | **CREATE** account |
| POST | /api/auth/login | Public | validate(loginSchema) | JWT (423 when locked) |
| PATCH | /api/auth/password | JWT Protected | validate(changePasswordSchema) | **UPDATE** password |
| GET | /api/posts | **Public** | None | **READ** all posts + author |
| POST | /api/posts | JWT Protected | validate(createPostSchema) | **CREATE** post |
| PUT | /api/posts/:id | JWT + **author** | validate(updatePostSchema) | **UPDATE** (403 if not yours) |
| DELETE | /api/posts/:id | JWT + **author** | None | **DELETE** (403 if not yours) |

## Frontend State & Actions (`src/types/index.ts`)
```ts
export interface State {
  user: { id: string; username: string; display_name: string } | null;
  token: string | null;
  checkingSession: boolean;
  posts: Post[];
  editing: Post | null;
  message: string | null;
  error: string | null;
}

export type Action =
  | { type: 'SESSION_RESTORED'; payload: User }
  | { type: 'SESSION_FAILED' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_POSTS'; payload: Post[] }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'UPDATE_POST'; payload: Post }
  | { type: 'DELETE_POST'; payload: string }
  | { type: 'START_EDIT'; payload: Post }
  | { type: 'CANCEL_EDIT' }
  | { type: 'SET_MESSAGE'; payload: string }
  | { type: 'SET_ERROR'; payload: string };
```

## Test accounts (password: `password123`)
- `juan_dev`, `maria_codes`

Things to try: type a wrong password 3 times (→ 423 locked), refresh the page while logged in
(→ "Checking your session..." then you're back), log in as maria and look at juan's posts (no Edit button).
To unlock early: `npm run db -- 8-forumboard`.

## Run it
- **All at once:** see `variations/README.md` (`npm run dev` in the variations folder).
- **On its own** (e.g. after copying `backend/` and `frontend/` into another project):
  - backend (port **5008**): `cd backend` → `npm i` → create the `forumboard` database and run `schema.sql` → `npm run dev`
  - frontend: `cd frontend` → `npm i` → `npm run dev`
