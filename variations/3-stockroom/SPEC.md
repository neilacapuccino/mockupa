# Variation 3 — StockRoom (Inventory with Roles)

**Target Architecture:** Node.js (ExpressJS + TypeScript + DB) Backend & React (TypeScript) Frontend
**Core Assessment Criteria:** Zod Validation, JWT Authentication, Express Middlewares, Full CRUD Operations, React Context + useReducer, Global Dispatching.

## System Overview
StockRoom tracks inventory. There are two kinds of users:
- **admin** — can add items, delete items, and change stock
- **staff** — can only view items and change stock

Stock can never go below 0. SKUs must be unique.

## NEW concepts (compared to PulseDesk)
| Concept | Where |
|---|---|
| **Role** stored in the DB and put **inside the JWT** (`role: "admin"`) | `schema.sql`, `authRoutes.ts` |
| Custom middleware `requireAdmin` → 403 for staff | `authMiddleware.ts` |
| Middleware **chain of 3**: `authenticateToken → requireAdmin → validateResource → handler` | `POST /api/items` |
| GET **one** item by id (`/:id`) | `itemRoutes.ts` |
| Business rule: stock can't go below 0 → 400 | `PATCH /:id/stock` |
| UNIQUE `sku` → catch error code `23505` → 409 (same as movieRoutes in practice-c) | `POST /api/items` |
| `NUMERIC` price comes back as a **string** ("9.99") | `types/index.ts` |
| Saving an **object** in localStorage: `JSON.stringify` / `JSON.parse` | `AuthForm.tsx`, `StockContext.tsx` |
| Role-based UI: hide admin-only form/buttons | `StockRoomApp.tsx`, `ItemList.tsx` |

## Technology Matrix
- Backend: Node.js, ExpressJS, TypeScript, jsonwebtoken, bcryptjs, zod, cors
- Frontend: React, TypeScript, Context API + useReducer (plain HTML, no CSS)

## API Endpoints
| Method | Endpoint | Protection | Middleware | Description |
|---|---|---|---|---|
| POST | /api/auth/login | Public | validate(loginSchema) | Returns JWT (with role) + user |
| GET | /api/items | JWT Protected | None | **READ** all items |
| GET | /api/items/:id | JWT Protected | None | **READ** one item |
| POST | /api/items | JWT + **Admin** | requireAdmin, validate(createItemSchema) | **CREATE** item (409 duplicate sku) |
| PATCH | /api/items/:id/stock | JWT Protected | validate(stockSchema) | **UPDATE** stock `{ change: -3 }` (400 below 0) |
| DELETE | /api/items/:id | JWT + **Admin** | requireAdmin | **DELETE** item |

## Frontend State & Actions (`src/types/index.ts`)
```ts
export interface State {
  user: { id: string; email: string; role: string } | null;
  token: string | null;
  items: Item[];
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: 'SET_AUTH'; payload: { user: any; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Item[] }
  | { type: 'ADD_ITEM'; payload: Item }
  | { type: 'UPDATE_ITEM'; payload: Item }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'SET_ERROR'; payload: string };
```

## Test accounts (password: `password123`)
- admin@stock.com — **admin** (sees the add form + Delete buttons)
- staff@stock.com — **staff** (only +1 / -1)

Things to try: press **-1** on "HDMI Adapter" (qty 0) → "Not enough stock".
Add an item with SKU `CAB-001` → "SKU already exists".

## Run it
- **All 6 at once:** see `variations/README.md` (`npm run dev` in the variations folder).
- **On its own** (e.g. after copying `backend/` and `frontend/` into another project):
  - backend (port **5003**): `cd backend` → `npm i` → create the `stockroom` database and run `schema.sql` → `npm run dev`
  - frontend: `cd frontend` → `npm i` → `npm run dev`
