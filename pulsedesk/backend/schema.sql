-- STEP 0 - database tables
-- run it:  & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d pulsedesk -f ".\schema.sql"
-- (running it again deletes all data and starts fresh)

DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS users;

-- UUID = the id is a string like "3cf1bffc-7dc2-..." (the frontend spec uses string ids)
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
    severity VARCHAR(20) DEFAULT 'low',
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- login account:  admin@pulsedesk.com / password123
INSERT INTO users (email, password_hash)
VALUES ('admin@pulsedesk.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');

-- sample incidents
INSERT INTO incidents (title, description, severity, status)
VALUES
    ('Printer offline', '3rd floor printer not responding', 'low', 'open'),
    ('Email server down', 'Nobody can send or receive email', 'critical', 'in_progress');
