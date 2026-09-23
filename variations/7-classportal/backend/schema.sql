-- ClassPortal schema (2 KINDS of accounts in 2 tables: teachers + students)
-- reset with:  npm run db -- 7-classportal   (from the variations folder)

DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;

-- teachers log in with their EMPLOYEE NUMBER, like "T-1001"
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_no VARCHAR(10) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- students log in with their STUDENT NUMBER, like "2024-00123"
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_no VARCHAR(10) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    course VARCHAR(20) NOT NULL,
    year_level INT NOT NULL CHECK (year_level BETWEEN 1 AND 4),
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(50) NOT NULL,
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    encoded_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- one grade per subject per student -> a 2nd one gives error 23505
    UNIQUE (student_id, subject)
);

-- test accounts (password for all: password123)
INSERT INTO teachers (employee_no, full_name, password_hash)
VALUES ('T-1001', 'Ms. Santos', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');

INSERT INTO students (student_no, full_name, course, year_level, password_hash)
VALUES
    ('2024-00123', 'Juan Dela Cruz', 'BSIT', 2, '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS'),
    ('2024-00124', 'Maria Clara',    'BSCS', 2, '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS'),
    ('2023-00088', 'Pedro Penduko',  'BSIT', 3, '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');

INSERT INTO grades (student_id, subject, score, encoded_by)
VALUES
    ((SELECT id FROM students WHERE student_no = '2024-00123'), 'Web Development', 88, (SELECT id FROM teachers WHERE employee_no = 'T-1001')),
    ((SELECT id FROM students WHERE student_no = '2024-00123'), 'Database Systems', 72, (SELECT id FROM teachers WHERE employee_no = 'T-1001')),
    ((SELECT id FROM students WHERE student_no = '2024-00123'), 'Networking', 95, (SELECT id FROM teachers WHERE employee_no = 'T-1001')),
    ((SELECT id FROM students WHERE student_no = '2024-00124'), 'Web Development', 91, (SELECT id FROM teachers WHERE employee_no = 'T-1001')),
    ((SELECT id FROM students WHERE student_no = '2024-00124'), 'Database Systems', 85, (SELECT id FROM teachers WHERE employee_no = 'T-1001')),
    ((SELECT id FROM students WHERE student_no = '2023-00088'), 'Database Systems', 70, (SELECT id FROM teachers WHERE employee_no = 'T-1001'));
