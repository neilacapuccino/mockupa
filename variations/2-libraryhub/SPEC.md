# Variation 2 — LibraryHub (Book Borrowing)

**Target Architecture:** Node.js (ExpressJS + TypeScript + DB) Backend & React (TypeScript) Frontend
**Core Assessment Criteria:** Zod Validation, JWT Authentication, Express Middlewares, Full CRUD Operations, React Context + useReducer, Global Dispatching.

## System Overview
LibraryHub is a small library system. Logged-in users can add books, **borrow** and **return** them,
filter the list (all / available / borrowed), and delete books.

**Business rules** (the server must enforce these):
- You can't borrow a book that is already borrowed → **409 Conflict**
- You can't return a book that isn't borrowed → **409 Conflict**
- You can't delete a book while it is borrowed → **409 Conflict**

## NEW concepts (compared to PulseDesk)
| Concept | Where |
|---|---|
| "Action" routes: `PATCH /:id/borrow`, `PATCH /:id/return` (not just plain CRUD) | `bookRoutes.ts` |
| Business rules: read the row first → check → then update (409 if not allowed) | `bookRoutes.ts` |
| Zod on **query params** (`?available=true`) — query values are always **strings** | `schemas.ts` |
| Zod on **params only** (`bookIdSchema`) | `schemas.ts` |
| Number field `published_year` — frontend must send `Number(...)` or Zod says 400 | `BookForm.tsx` |
| Filter kept in **global state** (`SET_FILTER`) — one component changes it, another reacts | `FilterBar.tsx` + `BookList.tsx` |

## Technology Matrix
- Backend: Node.js, ExpressJS, TypeScript, jsonwebtoken, bcryptjs, zod, cors
- Frontend: React, TypeScript, Context API + useReducer (plain HTML, no CSS)

## API Endpoints
| Method | Endpoint | Protection | Middleware | Description |
|---|---|---|---|---|
| POST | /api/auth/login | Public | validate(loginSchema) | Returns JWT + user |
| GET | /api/books?available=true | JWT Protected | validate(bookQuerySchema) | **READ** books (optional filter) |
| POST | /api/books | JWT Protected | validate(createBookSchema) | **CREATE** book |
| PATCH | /api/books/:id/borrow | JWT Protected | validate(bookIdSchema) | **UPDATE** borrow (409 if borrowed) |
| PATCH | /api/books/:id/return | JWT Protected | validate(bookIdSchema) | **UPDATE** return (409 if not borrowed) |
| DELETE | /api/books/:id | JWT Protected | None | **DELETE** book (409 if borrowed) |

## Frontend State & Actions (`src/types/index.ts`)
```ts
export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  books: Book[];
  filter: string;            // "all" | "available" | "borrowed"
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: 'SET_AUTH'; payload: { user: any; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Book[] }
  | { type: 'ADD_BOOK'; payload: Book }
  | { type: 'UPDATE_BOOK'; payload: Book }      // used by borrow AND return
  | { type: 'DELETE_BOOK'; payload: string }
  | { type: 'SET_FILTER'; payload: string }
  | { type: 'SET_ERROR'; payload: string };
```

## Test accounts (password: `password123`)
- librarian@library.com
- reader@library.com  ("Eloquent JavaScript" is already borrowed by this user)

## Run it
See `variations/README.md` — one command starts all 3 backends + the page.

Frontend code for this variation: `variations/frontend/src/libraryhub/`
