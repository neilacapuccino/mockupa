# Exam variations (based on the PulseDesk sample)

Nine practice exams. Read each `SPEC.md` first (that's the "exam question"),
try to build it yourself, then compare with the code.
New project from zero? → `../README.md`. Forgot a method or an error code? → `../CHEATSHEET.md`.

| # | App | What's new | Login with | Port |
|---|---|---|---|---|
| 1 | **StudyNotes** | register, **my data only** (`req.user.userId` + `WHERE user_id`), PUT, checkbox, `?search=` | email | 5001 |
| 2 | **LibraryHub** | **action routes** (`/:id/borrow`), **rules → 409**, Zod on the **query**, number field, filter in global state | email | 5002 |
| 3 | **StockRoom** | **roles** in the JWT, `requireAdmin` (**3 middlewares**), GET one, stock ≥ 0, duplicate → 409 | email | 5003 |
| 4 | **ProjectBoard** | **3 linked tables**, `LEFT JOIN` + `COUNT`, **nested route**, tasks only move forward, **nested state** | email | 5004 |
| 5 | **StaffDirectory** | **11 columns × 24 rows**, search + filter + sort + **pages**, soft delete, **one form object** | email | 5005 |
| 6 | **CafeOrders** | **4 tables**, order with an **array of items**, server-side total, **status workflow**, cart reducer | email | 5006 |
| 7 | **ClassPortal** | **2 account tables**, 2 login routes, `requireTeacher/requireStudent`, `CASE WHEN`, `AVG` | **student no. / employee no.** | 5007 |
| 8 | **ForumBoard** | confirm password, **lockout (423)**, **`GET /me`** session restore, change password, public reads, author-only (403) | **username** | 5008 |
| 9 | **EventPass** | **remember me**, **`optionalAuth`** (guests), **token expiry + auto-logout**, seat/past/duplicate rules | **mobile number** | 5009 |

## Folders
Every variation is **complete on its own** — copy its `backend/` and `frontend/` into any
other project, run `npm i` in each, and it works.
```
variations/
  1-studynotes/
    SPEC.md            <- the exam question
    backend/           <- Express + pg + zod + JWT   (own package.json, .env, schema.sql)
    frontend/          <- React + Context/useReducer (own package.json, vite, tsconfig)
      src/App.tsx
  2-libraryhub/ ...  (same shape)
  ...
  9-eventpass/ ...

  page/App.tsx         <- the page with 9 buttons (it just shows each frontend/src/App.tsx)
  package.json         <- the commands below
```

## Run all 9 at the same time (from this folder)
```powershell
cd "C:\Users\Higurashi\OneDrive\Documents\task force\mockupa\variations"
npm run dev
```
Open **http://localhost:5180** and click a button. Stop everything with **Ctrl+C**.

## Run ONE variation on its own
```powershell
cd "C:\Users\Higurashi\OneDrive\Documents\task force\mockupa\variations\1-studynotes\backend"
npm run dev
```
```powershell
cd "C:\Users\Higurashi\OneDrive\Documents\task force\mockupa\variations\1-studynotes\frontend"
npm i
npm run dev
```

## Other commands (from this folder)
| Command | What it does |
|---|---|
| `npm run db` | creates/resets **all** databases back to the sample data |
| `npm run db -- 8-forumboard` | resets **only** the ones you name (e.g. to unlock a locked account) |
| `npm run setup` | `npm install` in all 9 backends (only needed once) |

## Test accounts (password is always `password123`)
| App | Accounts |
|---|---|
| StudyNotes | alice@notes.com, bob@notes.com |
| LibraryHub | librarian@library.com, reader@library.com |
| StockRoom | admin@stock.com (admin), staff@stock.com (staff) |
| ProjectBoard | lead@board.com |
| StaffDirectory | hr@company.com |
| CafeOrders | cashier@cafe.com |
| ClassPortal | students `2024-00123`, `2024-00124`, `2023-00088` · teacher `T-1001` |
| ForumBoard | `juan_dev`, `maria_codes` |
| EventPass | `09171234567` (Ana), `09181234567` (Ben) |
