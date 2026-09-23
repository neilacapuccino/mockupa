# Frontend 1 - `src/types/index.ts`

The frontend types file has 3 things: **the item interface**, **`State`**, and **`Action`**.
`State` and `Action` come **straight from the spec** - copy them exactly.
Next: `FRONTEND-2-CONTEXT.md` (the reducer uses these types).

**Part 1 - The general approach**
1. The shape of the file
2. Where each part comes from

**Part 2 - Translate**
3. The item interface (from the backend table)
4. State and Action (from the spec)
5. Worked example: PulseDesk
6. A different project: Books

**Part 3 - Action patterns**
7. Payload shapes

**Part 4 - Final check**
8. Before you run it

---

# Part 1 - The general approach

## 1. The shape of the file

```ts
// 1. one interface per thing the server sends back
export interface Item {
  id: string;
  title: string;
  status: string;
}

// 2. the global state (copied from the spec)
export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  items: Item[];
  loading: boolean;
  error: string | null;
}

// 3. every action the reducer understands (copied from the spec)
export type Action =
  | { type: "SET_AUTH"; payload: { user: any; token: string } }
  | { type: "FETCH_SUCCESS"; payload: Item[] }
  | { type: "SET_ERROR"; payload: string };
```

## 2. Where each part comes from

| Part | Comes from | Change it? |
|---|---|---|
| `State` | the spec ("State & Actions") | no - copy exactly |
| `Action` | the spec | no - copy exactly (you may ADD extras, see section 4) |
| `Incident`, `Book`, ... | the backend table (`schema.sql`) | yes - your fields |
| lists for dropdowns (`SEVERITIES`) | the CHECK values in `schema.sql` | yes |

---

# Part 2 - Translate

## 3. The item interface (from the backend table)

Same field names as the columns. It describes **what the server sends back**, so:

| Column in schema.sql | Frontend field | Why |
|---|---|---|
| `id UUID` | `id: string` (no `?`) | every row from the server has an id |
| `id SERIAL` | `id: number` | |
| `title VARCHAR ... NOT NULL` | `title: string` | |
| `status ... DEFAULT 'open'` | `status: string` (no `?`) | the server always fills it |
| `description TEXT` (can be NULL) | `description: string \| null` | the server can send `null` |
| `is_available BOOLEAN` | `is_available: boolean` | |
| `published_year INT` | `published_year: number` | |
| `price NUMERIC(10,2)` | `price: string` | pg sends NUMERIC as text `"9.99"` |
| `deadline DATE` / `created_at TIMESTAMP` | `deadline: string` / `created_at?: string` | |
| `password_hash` | not here | never sent to the frontend |

Backend `types.ts` vs frontend `types/index.ts` -> `BACKEND-2-TYPES.md` section 8.

## 4. State and Action (from the spec)

Copy them **exactly** - same names, same payloads. The grader checks them.

The PulseDesk spec gives this:

```ts
export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  incidents: Incident[];
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: 'SET_AUTH'; payload: { user: any; token: string } }
  | { type: 'FETCH_SUCCESS'; payload: Incident[] }
  | { type: 'CREATE_SUCCESS'; payload: Incident }
  | { type: 'UPDATE_SUCCESS'; payload: Incident }
  | { type: 'DELETE_SUCCESS'; payload: string }
  | { type: 'SET_ERROR'; payload: string };
```

Missing something the app needs? **Add** extras at the end, with a comment. Never rename the spec's ones.

| Common extra | Why |
|---|---|
| `{ type: "FETCH_START" }` | nothing in the spec turns `loading` on |
| `{ type: "LOGOUT" }` | the spec often has no way to log out |

## 5. Worked example: PulseDesk

```ts
// FULL FILE: pulsedesk
export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at?: string;
}

export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  incidents: Incident[];
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: "SET_AUTH"; payload: { user: any; token: string } }
  | { type: "FETCH_SUCCESS"; payload: Incident[] }
  | { type: "CREATE_SUCCESS"; payload: Incident }
  | { type: "UPDATE_SUCCESS"; payload: Incident }
  | { type: "DELETE_SUCCESS"; payload: string }
  | { type: "SET_ERROR"; payload: string }
  // extra (not in the spec):
  | { type: "FETCH_START" }
  | { type: "LOGOUT" };

// dropdown options = the CHECK values in schema.sql
export const SEVERITIES = ["low", "medium", "high", "critical"];
export const STATUSES = ["open", "in_progress", "resolved"];
```

## 6. A different project: Books

A new spec with **different action names** and a **filter** in the state:

```ts
// FULL FILE: books
export interface Book {
  id: string;
  title: string;
  author: string;
  published_year: number;
  genre: string;
  is_available: boolean;
  created_at?: string;
}

export interface State {
  user: { id: string; email: string; role: string } | null;
  token: string | null;
  books: Book[];
  filter: string;            // "all" | "available" | "borrowed"
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: "SET_AUTH"; payload: { user: any; token: string } }
  | { type: "LOGOUT" }
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Book[] }
  | { type: "ADD_BOOK"; payload: Book }
  | { type: "UPDATE_BOOK"; payload: Book }
  | { type: "REMOVE_BOOK"; payload: string }
  | { type: "SET_FILTER"; payload: string }
  | { type: "SET_ERROR"; payload: string };

export const GENRES = ["fiction", "science", "history"];
```

What changed from PulseDesk:

| PulseDesk | Books | Why |
|---|---|---|
| `Incident` | `Book` | new table |
| `incidents: Incident[]` | `books: Book[]` | the list in the state |
| `user: { id; email }` | `user: { id; email; role }` | this spec has roles |
| - | `filter: string` | this spec keeps the filter in the state |
| `CREATE_SUCCESS` / `UPDATE_SUCCESS` / `DELETE_SUCCESS` | `ADD_BOOK` / `UPDATE_BOOK` / `REMOVE_BOOK` | the spec's names - use them as they are |

---

# Part 3 - Action patterns

## 7. Payload shapes

Every action is `{ type: "NAME" }` + maybe a `payload`. The payload type tells you what the reducer gets:

| Payload | Used for | Example |
|---|---|---|
| none | on/off events | `{ type: "LOGOUT" }`, `{ type: "FETCH_START" }` |
| `Item[]` | a whole list from the server | `{ type: "FETCH_SUCCESS"; payload: Incident[] }` |
| `Item` | one item (new or changed) | `{ type: "CREATE_SUCCESS"; payload: Incident }` |
| `string` (an id) | delete / cancel by id | `{ type: "DELETE_SUCCESS"; payload: string }` |
| `string` (a value) | an error, a filter | `{ type: "SET_ERROR"; payload: string }` |
| `{ ... }` (object) | several values at once | `{ type: "SET_AUTH"; payload: { user: any; token: string } }` |
| `{ name; value }` | "change this field" | `{ type: "SET_FILTER"; payload: { name: string; value: string } }` |

How it is written:

```ts
export type Action =
  | { type: "LOGOUT" }                                   // no payload
  | { type: "FETCH_SUCCESS"; payload: Item[] }           // with a payload
  | { type: "SET_AUTH"; payload: { user: any; token: string } };
//  ^ every line starts with |     ^ the name in quotes   ^ the payload type
```

---

# Part 4 - Final check

## 8. Before you run it

| Check | What goes wrong if you skip it |
|---|---|
| `State` and `Action` are copied exactly from the spec | the grader looks for them |
| The item field names = the backend columns | the list shows `undefined` |
| `id` type matches the backend (UUID -> `string`, SERIAL -> `number`) | delete / update can't find the item |
| Every interface / type has `export` | "has no exported member" |
| Other files import it with `import type { State } from "../types";` | Vite error "must use import type" |
| Dropdown lists = the CHECK values | 400 from Zod |
