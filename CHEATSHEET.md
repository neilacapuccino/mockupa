# Cheat sheet (short)

Zod → see `BACKEND-3-ZOD-NOTES.md`. Full working code → `pulsedesk/` and `variations/`.

---

## 1. Status codes
| Code | When |
|---|---|
| **200** | GET / PUT / PATCH / DELETE worked |
| **201** | POST created something |
| **400** | wrong data (Zod failed, "no fields", a rule broken) |
| **401** | no token / wrong email or password |
| **403** | bad or expired token / not allowed (not admin, not the owner) |
| **404** | id not found (`result.rows.length === 0`) |
| **409** | duplicate (email taken) / state blocks it (already borrowed, full) |
| **500** | crashed (your `catch`) |

```ts
if (result.rows.length === 0) {
  return res.status(404).json({ error: "Item not found" });   // always "return"
}
```

**Postgres error codes** (in `catch`): `23505` = duplicate → 409 · `23503` = the id you point to doesn't exist → 404
```ts
} catch (error: any) {
  if (error.code === "23505") return res.status(409).json({ error: "Email already exists" });
  res.status(500).json({ error: (error as Error).message });
}
```

---

## 2. Express
| I want | Write |
|---|---|
| `/items/:id` | `const { id } = req.params;` |
| `?search=abc` | `const { search } = req.query;` (always a string) |
| the JSON body | `const { title } = req.body;` |
| the logged-in user | `(req.user as JwtPayload).userId` |
| send data | `res.json(data)` / `res.status(201).json(data)` |
| send an error | `res.status(404).json({ error: "..." })` |

- Middleware order in a route: `authenticateToken` → `validateResource(schema)` → your code
- `index.ts` order: `app.use(cors())` → `app.use(express.json())` → `app.use("/api/...", routes)`
- Route order: fixed paths (`/mine`, `/search`) **before** `/:id`

---

## 3. SQL (`pool.query`)
Always `$1, $2` + an array. Never glue user text into SQL.
```ts
await pool.query(`SELECT * FROM items ORDER BY created_at DESC`);
await pool.query(`SELECT * FROM items WHERE id = $1`, [id]);
await pool.query(`INSERT INTO items (title) VALUES ($1) RETURNING *`, [title]);
await pool.query(`DELETE FROM items WHERE id = $1 RETURNING *`, [id]);

// update only what was sent
await pool.query(
  `UPDATE items SET title = COALESCE($1, title), status = COALESCE($2, status)
   WHERE id = $3 RETURNING *`,
  [title ?? null, status ?? null, id]
);

// search
await pool.query(`SELECT * FROM items WHERE title ILIKE $1`, [`%${search}%`]);
```
`result.rows` = all rows · `result.rows[0]` = the first · `result.rows.length` = how many

---

## 4. Auth
```ts
// register: save the HASH
const passwordHash = await bcrypt.hash(password, 10);

// login: compare, then make a token
const isValidPassword = await bcrypt.compare(password, user.password_hash);
const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
res.json({ message: "Login successful", token, user: { id: user.id, email: user.email } });
```
Login with something else? Only the column changes: `WHERE username = $1` / `student_no` / `mobile`.

Admin-only route: add a middleware after `authenticateToken` (see `variations/3-stockroom`):
```ts
if ((req.user as JwtPayload).role !== "admin") return res.status(403).json({ error: "Admins only." });
```

---

## 5. React
**Use the global state in any component:**
```tsx
const context = useContext(AppContext);
if (!context) throw new Error("must be used within AppProvider");
const { state, dispatch } = context;
```

**Reducer: always return a NEW object**
| Goal | Code |
|---|---|
| add | `items: [...state.items, action.payload]` |
| replace one | `items: state.items.map((i) => i.id === action.payload.id ? action.payload : i)` |
| remove one | `items: state.items.filter((i) => i.id !== action.payload)` |
| change one value | `{ ...state, loading: true }` |

**Fetch (in `api/...Service.ts`)**
```ts
const res = await fetch(`${API_URL}/items`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify(item),
});
const data = await res.json();
if (!res.ok) throw new Error(data.details ? data.details[0].message : data.error);
return data;
```

**Load when the screen opens**
```tsx
useEffect(() => {
  const load = async () => {
    try {
      const data = await fetchItems(state.token);
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };
  load();
}, [dispatch, state.token]);
```

**Forms**
| Input | Read it with | Watch out |
|---|---|---|
| text / select | `e.target.value` | — |
| number | `e.target.value` | it's a string → send `Number(value)` |
| checkbox | `e.target.checked` | not `.value` |
| submit | `e.preventDefault()` first | or the page reloads |

**Login / logout**
```tsx
localStorage.setItem("token", data.token);                  // after login
dispatch({ type: "SET_AUTH", payload: { user: data.user, token: data.token } });

localStorage.removeItem("token");                           // logout
dispatch({ type: "LOGOUT" });
```
