-- StudyNotes schema
-- 1) create the database once:
--    & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE studynotes;"
-- 2) run this file (running it again deletes all data and starts fresh):
--    & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d studynotes -f ".\schema.sql"

DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NEW: user_id links every note to the user who owns it
-- ON DELETE CASCADE = if the user is deleted, their notes are deleted too
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- two test accounts (password for both: password123)
INSERT INTO users (email, password_hash)
VALUES
    ('alice@notes.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS'),
    ('bob@notes.com',   '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');

-- alice has 2 notes, bob has 1 -> log in as each one and check you only see your own
INSERT INTO notes (user_id, title, content, is_pinned)
VALUES
    ((SELECT id FROM users WHERE email = 'alice@notes.com'), 'Zod', 'z.object({ body: ... }) checks req.body', true),
    ((SELECT id FROM users WHERE email = 'alice@notes.com'), 'JWT', 'jwt.sign on login, jwt.verify in the middleware', false),
    ((SELECT id FROM users WHERE email = 'bob@notes.com'),   'Bob''s note', 'alice should never see this', false);
