# Exam variations (based on the PulseDesk sample)

Three practice exams, each teaching **different concepts**. Read the `SPEC.md` first (that's the "exam question"),
try to build it yourself, then compare with the code.

| # | App | New concepts | Backend port |
|---|---|---|---|
| 1 | **StudyNotes** | register, **my data only** (`req.user.userId`, `WHERE user_id = $2`), PUT, boolean + checkbox, `?search=` | 5001 |
| 2 | **LibraryHub** | **action routes** (`/:id/borrow`, `/:id/return`), **business rules → 409**, Zod on **query** + params only, number field, filter in global state | 5002 |
| 3 | **StockRoom** | **roles** (admin/staff) in the JWT, `requireAdmin` middleware (**chain of 3**), GET one by id, stock can't go below 0, duplicate SKU → 409, NUMERIC = string | 5003 |

## Folders
```
variations/
  1-studynotes/   SPEC.md + backend/
  2-libraryhub/   SPEC.md + backend/
  3-stockroom/    SPEC.md + backend/
  frontend/       ONE page with 3 buttons
    src/studynotes/   <- frontend code for variation 1
    src/libraryhub/   <- frontend code for variation 2
    src/stockroom/    <- frontend code for variation 3
    src/App.tsx       <- the 3 buttons
```

## Run all 3 at the same time (from this folder)
```powershell
cd "C:\Users\Higurashi\OneDrive\Documents\task force\mockupa\variations"
npm run dev
```
Then open **http://localhost:5180** and click **1. StudyNotes / 2. LibraryHub / 3. StockRoom**.
Stop everything with **Ctrl+C**.

## Other commands
| Command | What it does |
|---|---|
| `npm run db` | resets all 3 databases back to the sample data |
| `npm run setup` | `npm i` in all 3 backends + the frontend (only needed once) |

## Test accounts (password is always `password123`)
| App | Accounts |
|---|---|
| StudyNotes | alice@notes.com, bob@notes.com |
| LibraryHub | librarian@library.com, reader@library.com |
| StockRoom | admin@stock.com (admin), staff@stock.com (staff) |
