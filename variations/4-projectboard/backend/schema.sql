-- ProjectBoard schema (3 tables: users -> projects -> tasks)
-- reset with:  npm run db   (from the variations folder)

DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    deadline DATE,                                             -- DATE = only the day, no time
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ONE project has MANY tasks -> each task stores its project_id
-- ON DELETE CASCADE = deleting a project also deletes its tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    status VARCHAR(20) DEFAULT 'todo'
        CHECK (status IN ('todo', 'doing', 'done')),
    priority VARCHAR(10) DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- test account (password: password123)
INSERT INTO users (email, password_hash)
VALUES ('lead@board.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');

INSERT INTO projects (name, description, deadline, created_by)
VALUES
    ('Exam Prep', 'Get ready for the PulseDesk exam', '2026-10-15',
        (SELECT id FROM users WHERE email = 'lead@board.com')),
    ('Portfolio Website', 'Personal site with my projects', '2026-11-30',
        (SELECT id FROM users WHERE email = 'lead@board.com')),
    ('Finished Project', 'Every task is done -> this one CAN be deleted', NULL,
        (SELECT id FROM users WHERE email = 'lead@board.com'));

INSERT INTO tasks (project_id, title, status, priority)
VALUES
    ((SELECT id FROM projects WHERE name = 'Exam Prep'), 'Review Zod', 'done', 'high'),
    ((SELECT id FROM projects WHERE name = 'Exam Prep'), 'Practice JWT middleware', 'doing', 'high'),
    ((SELECT id FROM projects WHERE name = 'Exam Prep'), 'Build PulseDesk from memory', 'todo', 'medium'),
    ((SELECT id FROM projects WHERE name = 'Exam Prep'), 'Read the Context chapter', 'todo', 'low'),
    ((SELECT id FROM projects WHERE name = 'Portfolio Website'), 'Pick a design', 'done', 'medium'),
    ((SELECT id FROM projects WHERE name = 'Portfolio Website'), 'Write the About page', 'todo', 'low'),
    ((SELECT id FROM projects WHERE name = 'Finished Project'), 'The only task', 'done', 'low');
