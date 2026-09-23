-- ForumBoard schema (username login + account lockout)
-- reset with:  npm run db -- 8-forumboard   (from the variations folder)

DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(20) UNIQUE NOT NULL,       -- log in with THIS (not an email)
    display_name VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    failed_attempts INT NOT NULL DEFAULT 0,     -- wrong passwords in a row
    locked_until TIMESTAMPTZ,                   -- NULL = not locked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- the author
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- test accounts (password for both: password123)
INSERT INTO users (username, display_name, password_hash)
VALUES
    ('juan_dev',    'Juan',  '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS'),
    ('maria_codes', 'Maria', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');

INSERT INTO posts (user_id, title, body)
VALUES
    ((SELECT id FROM users WHERE username = 'juan_dev'),    'How do I use Zod?', 'Do I put the schema in the route or in a middleware?'),
    ((SELECT id FROM users WHERE username = 'maria_codes'), 'JWT tip', 'Put the user id INSIDE the token, then read it back from req.user.'),
    ((SELECT id FROM users WHERE username = 'juan_dev'),    'Reducer question', 'Why must the reducer return a NEW object?');
