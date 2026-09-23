# Reusables - what to copy, what to rewrite

Copy from `pulsedesk/` (paths below). Three kinds of files:

| Kind | Meaning |
|---|---|
| **COPY AS-IS** | works in any project, don't touch it |
| **COPY + SMALL EDIT** | copy it, change 1-3 lines (a name, a port, a column) |
| **REWRITE** | same shape every time, but the fields come from the new spec / table |

---

## Backend (`pulsedesk/backend/`)

### COPY AS-IS
| File | What it does |
|---|---|
| `src/validate.ts` | runs a Zod schema on `{ body, params, query }`, sends 400 if wrong |
| `src/authMiddleware.ts` | `authenticateToken`: reads `Authorization: Bearer ...`, 401 / 403 |
| `src/types/express/index.d.ts` | lets you use `req.user` |
| `src/db.ts` | the `pg` Pool, reads `.env` |
| `tsconfig.json` | made by the `npx tsc --init ...` command |
| `.gitignore` | `node_modules`, `dist` (`.env` is kept so the project works when cloned) |

### COPY + SMALL EDIT
| File | Change only |
|---|---|
| `.env` | `PGDATABASE` (new database name), maybe `PORT` |
| `src/index.ts` | the route imports + `app.use("/api/...", ...)` lines |
| `src/authRoutes.ts` | the login column if it's not email (`WHERE username = $1`), and the `user` fields it sends back |
| `package.json` | nothing if you copy it; or run the npm commands in `README.md` |

### REWRITE (same shape, new fields)
| File | Where the new fields come from | Template |
|---|---|---|
| `schema.sql` | the spec (what the app stores) | `BACKEND-1-SCHEMA.md` |
| `src/types.ts` | one interface per table, same columns as `schema.sql` | `BACKEND-2-TYPES.md` |
| `src/schemas.ts` | the columns of `schema.sql` + the spec table | `BACKEND-3-ZOD.md` |
| `src/incidentRoutes.ts` -> `yourRoutes.ts` | the spec table (methods, paths, middleware) | `BACKEND-4-ROUTES.md` |

### Extra middlewares (copy only when the spec needs them)
| Spec says | Copy from |
|---|---|
| "Admin only" / roles | `requireAdmin` in `variations/3-stockroom/backend/src/authMiddleware.ts` |
| two account types (student / teacher) | `requireTeacher`, `requireStudent` in `variations/7-classportal/backend/src/authMiddleware.ts` |
| public list, but logged-in users see more | `optionalAuth` in `variations/9-eventpass/backend/src/authMiddleware.ts` |

---

## Frontend (`pulsedesk/frontend/`)

### COPY AS-IS
| File | What it does |
|---|---|
| `src/main.tsx` | starts React (Vite makes it, keep it) |
| `vite.config.ts`, `tsconfig*.json` | Vite makes them, keep them |
| `src/components/styles.ts` | styled-components (only if you use them) |

### COPY + SMALL EDIT
| File | Change only |
|---|---|
| `src/api/config.ts` | the port in `API_URL` |
| `src/api/authService.ts` | the login field names if not `email` |
| `src/components/AuthForm.tsx` | the input fields (email -> username / student no ...) and the context name |
| `src/App.tsx` | the Provider name and which components it shows |

### REWRITE (same shape, new fields)
| File | Where the new parts come from | Copy the shape from |
|---|---|---|
| `src/types/index.ts` | `State` + `Action` from the spec (copy them exactly) + one interface per item | `FRONTEND-1-TYPES.md` |
| `src/context/...Context.tsx` | one `case` per action in the spec | `FRONTEND-2-CONTEXT.md` |
| `src/api/...Service.ts` | one function per endpoint in the spec table | `FRONTEND-3-SERVICE.md` |
| `src/components/...Form.tsx` | the fields of the create body | `pulsedesk/frontend/src/components/IncidentForm.tsx` |
| `src/components/...List.tsx` | what to show + update / delete buttons | `pulsedesk/frontend/src/components/IncidentList.tsx` |

---

## Order for a new project
1. Run the commands in `README.md` (backend + frontend)
2. Copy every **COPY AS-IS** file
3. Copy every **COPY + SMALL EDIT** file, make the edits
4. Write the **REWRITE** files in this order:
   `schema.sql` -> `types.ts` -> `schemas.ts` -> routes -> frontend `types` -> context -> services -> components
5. `npm run dev` in both folders
