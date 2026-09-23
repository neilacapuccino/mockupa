# Backend 1 - `schema.sql`

`schema.sql` = the tables your app stores. Write it **first** - `types.ts`, the Zod schemas
and the routes all copy their field names from it.
Next steps -> `BACKEND-2-TYPES.md`, `BACKEND-3-ZOD.md`, `BACKEND-4-ROUTES.md`.

**Part 1 - The general approach**
1. The shape of every schema.sql
2. Finding the tables and columns in a spec

**Part 2 - Columns**
3. Column types
4. Rules on a column (NOT NULL, DEFAULT, UNIQUE, CHECK, REFERENCES)
5. UUID or SERIAL?

**Part 3 - Translate**
6. Worked example: the PulseDesk spec -> schema.sql
7. A different project: Books
8. Tables that belong together (relations)

**Part 4 - Test data**
9. Test users + sample rows

**Part 5 - Running it**
10. The commands

**Part 6 - Final check**
11. Before you run it

---

# Part 1 - The general approach

## 1. The shape of every schema.sql

```sql
-- 1. DROP the tables (children first, then parents)
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS users;

-- 2. CREATE the tables (parents first, then children)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. INSERT test data (a login account + a few rows)
INSERT INTO users (email, password_hash)
VALUES ('admin@test.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');
```

Why this order:
- `DROP ... IF EXISTS` first -> running the file again gives a fresh start (no "already exists" error)
- drop children before parents, create parents before children -> a table can only point to a table that exists
- every table gets `id` (first) and `created_at` (last)

## 2. Finding the tables and columns in a spec

| In the spec | Becomes |
|---|---|
| the thing the app manages ("incidents", "books", "orders") | a **table** (plural name) |
| login in the API table (`/api/auth/login`) | a **`users`** table |
| the fields of that thing (in the State's type, the forms, the Zod names) | **columns** |
| a list of allowed values ("low / medium / high") | a column + `CHECK (... IN (...))` |
| "each user sees **their own** ..." / "created by" | a **`user_id`** column |
| "... belongs to a project" | a **`project_id`** column |
| `id: string` in the frontend types | **UUID** ids |
| `id: number` in the frontend types | **SERIAL** ids |

---

# Part 2 - Columns

## 3. Column types

| The value is | Column type | Example |
|---|---|---|
| short text (name, title, email) | `VARCHAR(n)` | `title VARCHAR(150) NOT NULL` |
| long text (description, notes) | `TEXT` | `description TEXT NOT NULL` |
| whole number | `INT` | `quantity INT NOT NULL` |
| money / decimals | `NUMERIC(10, 2)` | `price NUMERIC(10, 2) NOT NULL` (comes back as text: `"9.99"`) |
| yes / no | `BOOLEAN` | `is_available BOOLEAN DEFAULT TRUE` |
| a day | `DATE` | `deadline DATE` |
| day + time (event start) | `TIMESTAMPTZ` | `starts_at TIMESTAMPTZ NOT NULL` |
| when the row was made | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` |
| the id | `UUID ... DEFAULT gen_random_uuid()` or `SERIAL` | section 5 |
| one value from a list | `VARCHAR(20)` + `CHECK` | `status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'done'))` |

## 4. Rules on a column

| Rule | Means | Example |
|---|---|---|
| `NOT NULL` | required | `title VARCHAR(150) NOT NULL` |
| `DEFAULT x` | used when nothing is sent | `status VARCHAR(20) DEFAULT 'open'` |
| `UNIQUE` | no two rows can have the same value (duplicate -> error `23505`) | `email VARCHAR(255) UNIQUE NOT NULL` |
| `CHECK (...)` | the value must pass a test (fail -> error `23514`) | `CHECK (score BETWEEN 0 AND 100)`, `CHECK (price >= 0)` |
| `REFERENCES other(id)` | must be an id that exists in the other table (fail -> error `23503`) | `user_id UUID REFERENCES users(id)` |
| `ON DELETE CASCADE` | delete the parent -> its children are deleted too | `project_id UUID REFERENCES projects(id) ON DELETE CASCADE` |
| `ON DELETE SET NULL` | delete the parent -> the column becomes NULL | `created_by UUID REFERENCES users(id) ON DELETE SET NULL` |
| `UNIQUE (a, b)` (at the end) | the PAIR can't repeat | `UNIQUE (student_id, subject)` |

A column with no `NOT NULL` and no `DEFAULT` = optional (can be NULL).

## 5. UUID or SERIAL?

| | UUID | SERIAL |
|---|---|---|
| Column | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` | `id SERIAL PRIMARY KEY` |
| Looks like | `3cf1bffc-7dc2-407a-81ec-733ddd6e4821` | `1`, `2`, `3` |
| Comes back in JS as | text (`string`) | number |
| Foreign key column | `user_id UUID REFERENCES users(id)` | `user_id INT REFERENCES users(id)` |
| Zod id check | `z.uuid()` | `z.string().regex(/^\d+$/)` |
| Use it when | the spec's frontend types say `id: string` (like PulseDesk) | the spec says `id: number`, or class examples (practice-c) |

Pick one and use it for **every** table in the project.

---

# Part 3 - Translate

## 6. Worked example: the PulseDesk spec -> schema.sql

What the spec gives us:

| Spec part | Tells us |
|---|---|
| `POST /api/auth/login` | a `users` table |
| `user: { id: string; email: string }` | users have `email`; ids are **strings** -> UUID |
| "IT Incident Desk ... submit support tickets" | an `incidents` table |
| "update ticket severity/status" | columns `severity` and `status` (lists of values -> CHECK) |
| the create form (title, description) | columns `title`, `description` |

```sql
-- FULL FILE: pulsedesk
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'low'
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- login: admin@pulsedesk.com / password123
INSERT INTO users (email, password_hash)
VALUES ('admin@pulsedesk.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');

INSERT INTO incidents (title, description, severity, status)
VALUES
    ('Printer offline', '3rd floor printer not responding', 'low', 'open'),
    ('Email server down', 'Nobody can send or receive email', 'critical', 'in_progress');
```

## 7. A different project: Books

Spec (short): *"LibraryHub - logged-in users add books (title, author, year, genre: fiction/science/history),
borrow them and return them. A book can only be borrowed by one user at a time."*

| From the spec | Column |
|---|---|
| title, author | `title VARCHAR(150) NOT NULL`, `author VARCHAR(100) NOT NULL` |
| year | `published_year INT NOT NULL` |
| genre: fiction / science / history | `genre VARCHAR(20) DEFAULT 'fiction' CHECK (genre IN (...))` |
| borrow / return | `is_available BOOLEAN DEFAULT TRUE` |
| "by one user" | `borrowed_by UUID REFERENCES users(id) ON DELETE SET NULL` |

```sql
-- FULL FILE: books
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    author VARCHAR(100) NOT NULL,
    published_year INT NOT NULL,
    genre VARCHAR(20) DEFAULT 'fiction'
        CHECK (genre IN ('fiction', 'science', 'history')),
    is_available BOOLEAN DEFAULT TRUE,
    borrowed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- login: reader@library.com / password123
INSERT INTO users (email, password_hash)
VALUES ('reader@library.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');

INSERT INTO books (title, author, published_year, genre)
VALUES
    ('Clean Code', 'Robert C. Martin', 2008, 'science'),
    ('The Hobbit', 'J.R.R. Tolkien', 1937, 'fiction');
```

## 8. Tables that belong together (relations)

| Spec says | Relation | How |
|---|---|---|
| "each user has their own notes" | user -> many notes | `notes.user_id REFERENCES users(id)` |
| "a project has many tasks" | project -> many tasks | `tasks.project_id REFERENCES projects(id) ON DELETE CASCADE` |
| "an order has many products, a product is in many orders" | many <-> many | a middle table `order_items (order_id, product_id, quantity)` |

```sql
-- FULL FILE: relations
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ONE user -> MANY notes
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ONE project -> MANY tasks
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    status VARCHAR(20) DEFAULT 'todo'
        CHECK (status IN ('todo', 'doing', 'done')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MANY orders <-> MANY products, through order_items
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity > 0)
);
```

Working apps with these relations: `variations/1-studynotes` (user -> notes), `variations/4-projectboard`
(project -> tasks), `variations/6-cafeorders` (orders <-> menu items).

---

# Part 4 - Test data

## 9. Test users + sample rows

The spec usually has **no register route**, so put a login account in the file.
This hash = the password `password123`:

```sql
INSERT INTO users (email, password_hash)
VALUES ('admin@test.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');
```

Another password? Make its hash (inside `backend/`, after `npm i`):

```powershell
node -e "console.log(require('bcryptjs').hashSync('mypassword', 10))"
```

A row that points to another table - look the id up with a small SELECT:

```sql
INSERT INTO notes (user_id, title, content)
VALUES
    ((SELECT id FROM users WHERE email = 'admin@test.com'), 'First note', 'Hello');
```

Text with an apostrophe: write it twice - `'Bob''s note'`.

---

# Part 5 - Running it

## 10. The commands

From the `backend/` folder (change `mydb` to your database name):

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE mydb;"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d mydb -f ".\schema.sql"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d mydb -c "\dt"
```

| Command | Does |
|---|---|
| `CREATE DATABASE` | once per project ("already exists" later = fine) |
| `-f ".\schema.sql"` | runs the file - again any time = **all data wiped**, fresh test data |
| `\dt` | lists the tables |
| `-c "\d incidents"` | shows the columns of one table |
| `-c "SELECT * FROM incidents;"` | shows the rows |

Changed a column? Edit `schema.sql` and run `-f` again (the `DROP`s make that safe).

---

# Part 6 - Final check

## 11. Before you run it

| Check | What goes wrong if you skip it |
|---|---|
| `DROP` children before parents | "cannot drop table ... because other objects depend on it" |
| `CREATE` parents before children | "relation users does not exist" |
| Every id and foreign key use the same type (all UUID or all SERIAL) | "foreign key ... are of incompatible types" |
| `CHECK` values = the Zod `z.enum([...])` values = the frontend options | 400 from Zod or error 23514 |
| Column names = what `types.ts`, Zod and the routes use | `column "x" does not exist` |
| Every CHECK / DEFAULT text uses single quotes `'open'` | syntax error |
| The last column has **no** comma before `)` | syntax error |
| The test user's hash is a real bcrypt hash | login always says "Invalid email or password" |
