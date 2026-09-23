# Service template - `src/api/...Service.ts` for any project

A service = **one function per endpoint** in the spec table.
Components never call `fetch` themselves - they call a service function.
Routes (backend side) -> `ROUTES-TEMPLATE.md`. Zod -> `ZOD-TEMPLATE.md`.

**Part 1 - The general approach**
1. The shape of every service function
2. The 4 things that change per endpoint

**Part 2 - Translate the spec table**
3. Spec table -> service function, column by column
4. Worked example: the PulseDesk table -> `authService.ts` + `incidentService.ts`
5. A different project: PulseDesk -> Books (what to rename)

**Part 3 - Templates per endpoint**
6. GET all (with token / public / with filters)
7. GET one
8. POST (create)
9. PATCH / PUT (update)
10. DELETE
11. Action route (no body)
12. Login / register (no token)
13. The template file (all together)

**Part 4 - Using it in components**
14. Service -> dispatch

**Part 5 - Final check**
15. Before you run it

---

# Part 1 - The general approach

## 1. The shape of every service function

```ts
// METHOD /api/path
export const functionName = async (token, ...inputs): Promise<WhatComesBack> => {
  // 1. send the request
  const res = await fetch(`${API_URL}/path`, {
    method: "METHOD",
    headers: { ... },
    body: JSON.stringify(...),
  });

  // 2. read the JSON answer
  const data = await res.json();

  // 3. fetch does NOT throw on 400 / 401 / 404 / 500 -> check it yourself
  if (!res.ok) {
    // Zod errors have a "details" list -> show the first message
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  // 4. give the data to the component
  return data;
};
```

Steps 2, 3 and 4 are **the same in every function**. Only step 1 changes.

## 2. The 4 things that change per endpoint

| Part | Where it comes from | Example |
|---|---|---|
| **URL** | the Endpoint column | `${API_URL}/incidents/${id}` |
| **method** | the Method column | `method: "PATCH"` (GET needs nothing - it's the default) |
| **headers** | the Protection column + is there a body? | `Authorization: Bearer ...` and/or `Content-Type: application/json` |
| **body** | the Zod schema of that route | `JSON.stringify({ status: "resolved" })` |

Headers rule:

| Route | Headers |
|---|---|
| JWT Protected, with a body (POST / PATCH / PUT) | `"Content-Type": "application/json"` + `Authorization: \`Bearer ${token}\`` |
| JWT Protected, no body (GET / DELETE) | `Authorization: \`Bearer ${token}\`` only |
| Public, with a body (login / register) | `"Content-Type": "application/json"` only |
| Public, no body (a public GET) | nothing - `fetch(url)` |

---

# Part 2 - Translate the spec table

## 3. Spec table -> service function, column by column

| Spec column | Becomes | Example |
|---|---|---|
| **Method** | `method: "..."` | PATCH -> `method: "PATCH"` |
| **Endpoint** | the URL after `API_URL` (which already ends in `/api`) | `/api/incidents/:id` -> `` `${API_URL}/incidents/${id}` `` |
| **Protection** | send the token or not | JWT Protected -> `Authorization: \`Bearer ${token}\`` |
| **Middleware** `validate(xSchema)` | the body must match that Zod schema | same field names, numbers as numbers |
| **Description** | the function name + what it returns | "CREATE Incident" -> `createIncident(...)`, returns one `Incident` |

`:id` in the endpoint = a function input: `(token, id)` -> `` `${API_URL}/incidents/${id}` ``.

Function names:

| Description | Name | Inputs | Returns |
|---|---|---|---|
| READ All | `fetchIncidents` | `(token)` | `Incident[]` |
| READ one | `fetchIncident` | `(token, id)` | `Incident` |
| CREATE | `createIncident` | `(token, incident)` | `Incident` |
| UPDATE | `updateIncident` | `(token, id, changes)` | `Incident` |
| DELETE | `deleteIncident` | `(token, id)` | `Incident` |
| an action like `/:id/borrow` | `borrowBook` | `(token, id)` | `Book` |
| login | `login` | `(email, password)` | `{ message, token, user }` |

## 4. Worked example: the PulseDesk table -> `authService.ts` + `incidentService.ts`

| Method | Endpoint | Protection | Middleware | Description | Function |
|---|---|---|---|---|---|
| POST | /api/auth/login | Public | Zod Login | Returns JWT Token | `login` |
| POST | /api/incidents | JWT Protected | validate(createIncidentSchema) | CREATE Incident | `createIncident` |
| GET | /api/incidents | JWT Protected | None | READ All Incidents | `fetchIncidents` |
| PATCH | /api/incidents/:id | JWT Protected | validate(updateIncidentSchema) | UPDATE Status/Severity | `updateIncident` |
| DELETE | /api/incidents/:id | JWT Protected | None | DELETE Incident | `deleteIncident` |

```ts
// src/api/config.ts
// the backend address - change the port here only
export const API_URL = "http://localhost:5000/api";
```

```ts
// src/api/authService.ts
import { API_URL } from "./config";


// POST /api/auth/login  |  Public  ->  { message, token, user }
export const login = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
```

```ts
// src/api/incidentService.ts
import { API_URL } from "./config";
import type { Incident } from "../types";


// GET /api/incidents  |  JWT  ->  Incident[]
export const fetchIncidents = async (token: string | null): Promise<Incident[]> => {
  const res = await fetch(`${API_URL}/incidents`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/incidents  |  JWT + createIncidentSchema  ->  the new Incident
export const createIncident = async (
  token: string | null,
  incident: { title: string; description: string; severity?: string }
): Promise<Incident> => {
  const res = await fetch(`${API_URL}/incidents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(incident),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PATCH /api/incidents/:id  |  JWT + updateIncidentSchema (status / severity)  ->  the updated Incident
export const updateIncident = async (
  token: string | null,
  id: string,
  changes: { status?: string; severity?: string }
): Promise<Incident> => {
  const res = await fetch(`${API_URL}/incidents/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(changes),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// DELETE /api/incidents/:id  |  JWT  ->  the deleted Incident
export const deleteIncident = async (token: string | null, id: string): Promise<Incident> => {
  const res = await fetch(`${API_URL}/incidents/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
```

## 5. A different project: PulseDesk -> Books (what to rename)

New spec:

| Method | Endpoint | Protection | Middleware | Description |
|---|---|---|---|---|
| GET | /api/books | JWT Protected | None | READ All Books |
| POST | /api/books | JWT Protected | validate(createBookSchema) | CREATE Book |
| PATCH | /api/books/:id | JWT Protected | validate(updateBookSchema) | UPDATE Book |
| DELETE | /api/books/:id | JWT Protected | None | DELETE Book |
| PATCH | /api/books/:id/borrow | JWT Protected | validate(bookIdSchema) | Borrow a book |

What changes, line by line:

| In `incidentService.ts` | In `bookService.ts` | Why |
|---|---|---|
| `import type { Incident }` | `import type { Book }` | the new type in `types/index.ts` |
| `/incidents` | `/books` | the Endpoint column |
| `fetchIncidents`, `createIncident`, ... | `fetchBooks`, `createBook`, ... | the Description column |
| `Promise<Incident[]>` / `Promise<Incident>` | `Promise<Book[]>` / `Promise<Book>` | what the backend sends back |
| `{ title; description; severity? }` | `{ title; author; published_year }` | the fields in `createBookSchema` |
| `{ status?; severity? }` | `{ title?; author?; published_year?; is_available? }` | the fields in `updateBookSchema` |
| - | new `borrowBook(token, id)` | the extra row in the spec |

What stays the same: `API_URL`, the headers, `const data = await res.json()`, the `if (!res.ok)` block, `return data`.

```ts
// src/api/bookService.ts
import { API_URL } from "./config";
import type { Book } from "../types";


// GET /api/books  |  JWT  ->  Book[]
export const fetchBooks = async (token: string | null): Promise<Book[]> => {
  const res = await fetch(`${API_URL}/books`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/books  |  JWT + createBookSchema  ->  the new Book
export const createBook = async (
  token: string | null,
  book: { title: string; author: string; published_year: number }
): Promise<Book> => {
  const res = await fetch(`${API_URL}/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(book),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PATCH /api/books/:id  |  JWT + updateBookSchema  ->  the updated Book
export const updateBook = async (
  token: string | null,
  id: string,
  changes: { title?: string; author?: string; published_year?: number; is_available?: boolean }
): Promise<Book> => {
  const res = await fetch(`${API_URL}/books/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(changes),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// DELETE /api/books/:id  |  JWT  ->  the deleted Book
export const deleteBook = async (token: string | null, id: string): Promise<Book> => {
  const res = await fetch(`${API_URL}/books/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PATCH /api/books/:id/borrow  |  JWT, no body  ->  the updated Book
export const borrowBook = async (token: string | null, id: string): Promise<Book> => {
  const res = await fetch(`${API_URL}/books/${id}/borrow`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
```

---

# Part 3 - Templates per endpoint

Copy the one you need, then change the URL, the names and the fields.

## 6. GET all

With a token (JWT Protected):

```ts
// GET /api/items
export const fetchItems = async (token: string | null): Promise<Item[]> => {
  const res = await fetch(`${API_URL}/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
```

Public (no token) - no second argument at all:

```ts
// GET /api/items  (Public)
export const fetchItems = async (): Promise<Item[]> => {
  const res = await fetch(`${API_URL}/items`);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
```

With filters (`?search=abc&status=open`) - only add the ones that have a value:

```ts
// GET /api/items?search=&status=
export const fetchItems = async (
  token: string | null,
  search: string,
  status: string
): Promise<Item[]> => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status) params.append("status", status);

  const res = await fetch(`${API_URL}/items?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
```

## 7. GET one

```ts
// GET /api/items/:id
export const fetchItem = async (token: string | null, id: string): Promise<Item> => {
  const res = await fetch(`${API_URL}/items/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
```

## 8. POST (create)

The object type = the fields of the create Zod schema.

```ts
// POST /api/items
export const createItem = async (
  token: string | null,
  item: { title: string; description: string; status?: string }
): Promise<Item> => {
  const res = await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
```

## 9. PATCH / PUT (update)

Same as POST + the id in the URL. Every field is optional (`?`) for PATCH.
For PUT: `method: "PUT"` and no `?` (every field is required).

```ts
// PATCH /api/items/:id
export const updateItem = async (
  token: string | null,
  id: string,
  changes: { title?: string; description?: string; status?: string }
): Promise<Item> => {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(changes),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
```

## 10. DELETE

No body -> no `Content-Type`.

```ts
// DELETE /api/items/:id
export const deleteItem = async (token: string | null, id: string): Promise<Item> => {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
```

## 11. Action route (no body)

`PATCH /api/items/:id/close`, `/:id/borrow`, `/:id/claim` ... - the id is enough.

```ts
// PATCH /api/items/:id/close
export const closeItem = async (token: string | null, id: string): Promise<Item> => {
  const res = await fetch(`${API_URL}/items/${id}/close`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
```

## 12. Login / register (no token)

Change `email` to the login field of your spec (`username`, `student_no`, `mobile` ...).

```ts
// POST /api/auth/login  ->  { message, token, user }
export const login = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/auth/register  ->  { message, user }
export const register = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
```

## 13. The template file (all together)

Copy, rename `item` / `Item` to your topic, edit the lines marked `// CHANGE`.

```ts
// src/api/itemService.ts
import { API_URL } from "./config";
// CHANGE: your type from types/index.ts
import type { Item } from "../types";


// ========================================
// READ ALL - GET /api/items
// ========================================

export const fetchItems = async (token: string | null): Promise<Item[]> => {
  // CHANGE: the endpoint
  const res = await fetch(`${API_URL}/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// ========================================
// CREATE - POST /api/items
// ========================================

export const createItem = async (
  token: string | null,
  // CHANGE: the fields of your create Zod schema
  item: { title: string; description: string; status?: string }
): Promise<Item> => {
  const res = await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// ========================================
// UPDATE - PATCH /api/items/:id
// ========================================

export const updateItem = async (
  token: string | null,
  id: string,
  // CHANGE: only the fields your update Zod schema allows
  changes: { title?: string; description?: string; status?: string }
): Promise<Item> => {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(changes),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// ========================================
// DELETE - DELETE /api/items/:id
// ========================================

export const deleteItem = async (token: string | null, id: string): Promise<Item> => {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
```

---

# Part 4 - Using it in components

## 14. Service -> dispatch

Every call: `try { const x = await service(...); dispatch(...) } catch { dispatch SET_ERROR }`.
The action names come from the spec's `Action` type.

| Service | Called from | After it works, dispatch |
|---|---|---|
| `login(email, password)` | `AuthForm` | `SET_AUTH` with `{ user, token }` (+ save the token in localStorage) |
| `fetchIncidents(token)` | `IncidentList` (in `useEffect`) | `FETCH_SUCCESS` with the list |
| `createIncident(token, {...})` | `IncidentForm` | `CREATE_SUCCESS` with the new incident |
| `updateIncident(token, id, {...})` | `IncidentList` (button / select) | `UPDATE_SUCCESS` with the updated incident |
| `deleteIncident(token, id)` | `IncidentList` (button) | `DELETE_SUCCESS` with the **id** |

```tsx
const handleDelete = async (id: string) => {
  try {
    await deleteIncident(state.token, id);
    dispatch({ type: "DELETE_SUCCESS", payload: id });
  } catch (error) {
    dispatch({ type: "SET_ERROR", payload: (error as Error).message });
  }
};
```

```tsx
useEffect(() => {
  const load = async () => {
    try {
      const data = await fetchIncidents(state.token);
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  load();
}, [dispatch, state.token]);
```

Numbers from inputs are text - convert before calling the service:

```tsx
await createBook(state.token, { title, author, published_year: Number(year) });
```

---

# Part 5 - Final check

## 15. Before you run it

| Check | What goes wrong if you skip it |
|---|---|
| `API_URL` port = the backend `PORT` in `.env` | "Failed to fetch" |
| `API_URL` ends in `/api`, so the URL is `${API_URL}/items`, not `${API_URL}/api/items` | 404 |
| `method` = the spec's Method | 404 "Cannot PATCH ..." |
| JWT routes send `Authorization: \`Bearer ${token}\`` | 401 "No token provided" |
| Routes with a body send `"Content-Type": "application/json"` | `req.body` is empty -> 400 |
| The body's field names = the Zod schema's field names | 400 "expected string, received undefined" |
| Numbers are numbers (`Number(value)`), checkboxes are booleans | 400 "expected number, received string" |
| The return type = the interface in `types/index.ts` | TypeScript errors in the component |
| Every function has the `if (!res.ok) throw` block | errors look like success, the list breaks |
