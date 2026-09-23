-- LibraryHub schema
-- 1) create the database once:
--    & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE libraryhub;"
-- 2) run this file (running it again deletes all data and starts fresh):
--    & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d libraryhub -f ".\schema.sql"

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
    is_available BOOLEAN DEFAULT TRUE,
    -- who borrowed it (NULL = nobody)
    borrowed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- test accounts (password for both: password123)
INSERT INTO users (email, password_hash)
VALUES
    ('librarian@library.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS'),
    ('reader@library.com',    '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');

-- sample books (the last one is already borrowed)
INSERT INTO books (title, author, published_year, is_available, borrowed_by)
VALUES
    ('Clean Code', 'Robert C. Martin', 2008, true, NULL),
    ('The Pragmatic Programmer', 'Andrew Hunt', 1999, true, NULL),
    ('Eloquent JavaScript', 'Marijn Haverbeke', 2018, false,
        (SELECT id FROM users WHERE email = 'reader@library.com'));
