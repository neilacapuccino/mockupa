-- EventPass schema (mobile-number login, events, registrations)
-- reset with:  npm run db -- 9-eventpass   (from the variations folder)

DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile VARCHAR(11) UNIQUE NOT NULL,          -- log in with THIS, like "09171234567"
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    venue VARCHAR(100) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,              -- date AND time (with timezone)
    capacity INT NOT NULL CHECK (capacity > 0),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- who signed up for what (a user can register for an event only ONCE)
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, user_id)
);

-- test accounts (password for both: password123)
INSERT INTO users (mobile, full_name, password_hash)
VALUES
    ('09171234567', 'Ana Reyes', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS'),
    ('09181234567', 'Ben Cruz',  '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');

-- dates are relative to NOW(), so the "future" events stay in the future
-- date_trunc('day', NOW()) = today at 00:00
INSERT INTO events (title, venue, starts_at, capacity)
VALUES
    ('React Workshop',    'Room 301',   date_trunc('day', NOW()) + INTERVAL '7 days 14 hours',  30),
    ('Hackathon Kickoff', 'Auditorium', date_trunc('day', NOW()) + INTERVAL '14 days 9 hours',   2),   -- will be FULL
    ('Career Talk',       'Online',     date_trunc('day', NOW()) + INTERVAL '3 days 18 hours',  50),
    ('Intro to SQL',      'Lab 2',      date_trunc('day', NOW()) - INTERVAL '2 days' + INTERVAL '10 hours', 20);   -- already PAST

INSERT INTO registrations (event_id, user_id)
VALUES
    ((SELECT id FROM events WHERE title = 'Hackathon Kickoff'), (SELECT id FROM users WHERE mobile = '09171234567')),
    ((SELECT id FROM events WHERE title = 'Hackathon Kickoff'), (SELECT id FROM users WHERE mobile = '09181234567')),
    ((SELECT id FROM events WHERE title = 'Career Talk'),       (SELECT id FROM users WHERE mobile = '09171234567')),
    ((SELECT id FROM events WHERE title = 'Intro to SQL'),      (SELECT id FROM users WHERE mobile = '09181234567'));
