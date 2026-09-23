# Variation 6 — CafeOrders (Orders with Many Items + Status Workflow)

**Target Architecture:** Node.js (ExpressJS + TypeScript + DB) Backend & React (TypeScript) Frontend
**Core Assessment Criteria:** Zod Validation, JWT Authentication, Express Middlewares, Full CRUD Operations, React Context + useReducer, Global Dispatching.

## System Overview
A cafe cashier builds a **cart** from the menu and places an **order**.
One order has **many items**. The kitchen moves orders through a **workflow**:

```
pending -> preparing -> ready -> completed
   \           \
    -> cancelled -> cancelled
```

**Rules (the server must enforce these):**
- The **server** calculates the total from the **database prices** (the client only sends ids + quantities)
- A sold-out item can't be ordered → **400**
- Only the allowed next status is accepted (e.g. ready → pending) → **400**
- Only **cancelled** orders can be deleted → **409**

## NEW concepts (compared to PulseDesk)
| Concept | Where |
|---|---|
| **4 tables**, with an "in-between" table `order_items` (order ↔ menu items) | `schema.sql` |
| Saving the price **at the time of ordering** (`price_each`) | `schema.sql` |
| **Array in the body** → `z.array(z.object({...})).min(1)` | `createOrderSchema` |
| `WHERE id = ANY($1)` → look up many ids in one query | `orderRoutes.ts` |
| Loop over the items: check each one, add up the total, insert each line | `POST /api/orders` |
| **Status workflow** with a rules object (`ALLOWED_NEXT`) | `orderRoutes.ts` |
| Orders + their items: 2nd query + `filter` in JS (`attachItems`) | `orderRoutes.ts` |
| Reducer **conditions**: add to cart **or** +1 if it's already there, remove the line at 0 | `CafeContext.tsx` |
| One action, two changes: `ORDER_PLACED` empties the cart **and** adds the order | `CafeContext.tsx` |
| Reducer respects the filter (an order that no longer matches disappears) | `ORDER_UPDATED` |
| Derived total with `reduce` | `Cart.tsx` |
| Show only the buttons that are allowed (`ALLOWED_NEXT` on the frontend too) | `OrderList.tsx` |

## API Endpoints
| Method | Endpoint | Protection | Middleware | Description |
|---|---|---|---|---|
| POST | /api/auth/login | Public | validate(loginSchema) | Returns JWT + user |
| GET | /api/menu | JWT Protected | None | **READ** menu |
| PATCH | /api/menu/:id/availability | JWT Protected | validate(availabilitySchema) | **UPDATE** sold out / back in stock |
| GET | /api/orders?status= | JWT Protected | validate(orderQuerySchema) | **READ** orders + their items |
| POST | /api/orders | JWT Protected | validate(createOrderSchema) | **CREATE** order (server calculates total) |
| PATCH | /api/orders/:id/status | JWT Protected | validate(orderStatusSchema) | **UPDATE** status (workflow rules) |
| DELETE | /api/orders/:id | JWT Protected | None | **DELETE** (only cancelled) |

## Frontend State & Actions (`src/types/index.ts`)
```ts
export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  menu: MenuItem[];
  cart: CartLine[];          // { menuItem, quantity } - frontend only until you place the order
  orders: Order[];
  statusFilter: string;
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: 'SET_AUTH'; payload: { user: any; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_MENU'; payload: MenuItem[] }
  | { type: 'MENU_ITEM_UPDATED'; payload: MenuItem }
  | { type: 'ADD_TO_CART'; payload: MenuItem }
  | { type: 'CHANGE_QUANTITY'; payload: { menuItemId: string; amount: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'FETCH_START' }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ORDER_PLACED'; payload: Order }
  | { type: 'ORDER_UPDATED'; payload: Order }
  | { type: 'ORDER_DELETED'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: string }
  | { type: 'SET_ERROR'; payload: string };
```

## Test account (password: `password123`)
- cashier@cafe.com

Things to try: add 2 Americanos + a Croissant, place the order (total P335),
move it pending → preparing → ready → completed, cancel another one then delete it,
mark an item in your cart as sold out (it leaves the cart).

## Run it
- **All 6 at once:** see `variations/README.md` (`npm run dev` in the variations folder).
- **On its own** (e.g. after copying `backend/` and `frontend/` into another project):
  - backend (port **5006**): `cd backend` → `npm i` → create the `cafeorders` database and run `schema.sql` → `npm run dev`
  - frontend: `cd frontend` → `npm i` → `npm run dev`
