-- StaffDirectory schema (a BIG table: many columns + lots of rows)
-- reset with:  npm run db   (from the variations folder)

DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- small "lookup" table -> employees point to it with department_id
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    position VARCHAR(100) NOT NULL,
    employment_type VARCHAR(20) DEFAULT 'full_time'
        CHECK (employment_type IN ('full_time', 'part_time', 'contract')),
    salary INT NOT NULL CHECK (salary >= 0),   -- INT (not NUMERIC) -> comes back as a number
    hire_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,            -- "soft delete": we never really delete, we set this to false
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- test account (password: password123)
INSERT INTO users (email, password_hash)
VALUES ('hr@company.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');

INSERT INTO departments (name)
VALUES ('Engineering'), ('Design'), ('Sales'), ('HR'), ('Finance');

-- 24 employees
-- (the VALUES list is like a temporary table "e"; JOIN turns the department NAME into its id)
INSERT INTO employees (first_name, last_name, email, phone, department_id, position, employment_type, salary, hire_date, is_active)
SELECT e.first_name, e.last_name, e.email, e.phone, d.id, e.position, e.employment_type, e.salary, e.hire_date::date, e.is_active
FROM (VALUES
    ('Ana',      'Reyes',      'ana.reyes@company.com',       '0917-100-0001', 'Engineering', 'Senior Developer',   'full_time', 95000, '2019-03-15', true),
    ('Mark',     'Santos',     'mark.santos@company.com',     '0917-100-0002', 'Engineering', 'Junior Developer',   'full_time', 38000, '2024-06-01', true),
    ('Carlo',    'Dizon',      'carlo.dizon@company.com',     '0917-100-0003', 'Engineering', 'QA Engineer',        'full_time', 45000, '2022-01-10', true),
    ('Bea',      'Villanueva', 'bea.villanueva@company.com',  '0917-100-0004', 'Engineering', 'DevOps Engineer',    'contract',  70000, '2023-08-21', true),
    ('Paolo',    'Garcia',     'paolo.garcia@company.com',    '0917-100-0005', 'Engineering', 'Intern',             'part_time', 15000, '2025-05-05', true),
    ('Joshua',   'Dela Cruz',  'joshua.delacruz@company.com', '0917-100-0006', 'Engineering', 'Backend Developer',  'full_time', 65000, '2020-11-02', true),
    ('Liza',     'Mendoza',    'liza.mendoza@company.com',    '0917-100-0007', 'Design',      'UI Designer',        'full_time', 52000, '2021-02-14', true),
    ('Rico',     'Bautista',   'rico.bautista@company.com',   '0917-100-0008', 'Design',      'Graphic Artist',     'part_time', 25000, '2023-11-30', true),
    ('Jenny',    'Cruz',       'jenny.cruz@company.com',      '0917-100-0009', 'Design',      'UX Researcher',      'contract',  60000, '2022-07-18', false),
    ('Patricia', 'Ong',        'patricia.ong@company.com',    '0917-100-0010', 'Design',      'Design Lead',        'full_time', 78000, '2019-07-08', true),
    ('Miguel',   'Ramos',      'miguel.ramos@company.com',    '0917-100-0011', 'Sales',       'Sales Manager',      'full_time', 80000, '2018-09-03', true),
    ('Grace',    'Aquino',     'grace.aquino@company.com',    '0917-100-0012', 'Sales',       'Account Executive',  'full_time', 42000, '2021-04-12', true),
    ('Jose',     'Castillo',   'jose.castillo@company.com',   '0917-100-0013', 'Sales',       'Account Executive',  'full_time', 41000, '2022-10-01', true),
    ('Karen',    'Flores',     'karen.flores@company.com',    '0917-100-0014', 'Sales',       'Sales Associate',    'part_time', 22000, '2024-02-19', true),
    ('Nico',     'Torres',     'nico.torres@company.com',     '0917-100-0015', 'Sales',       'Sales Associate',    'contract',  24000, '2020-12-07', false),
    ('Luis',     'Fernandez',  'luis.fernandez@company.com',  '0917-100-0016', 'Sales',       'Sales Associate',    'full_time', 26000, '2023-05-29', true),
    ('Maria',    'Gonzales',   'maria.gonzales@company.com',  '0917-100-0017', 'HR',          'HR Manager',         'full_time', 75000, '2017-05-22', true),
    ('Rafael',   'Navarro',    'rafael.navarro@company.com',  '0917-100-0018', 'HR',          'Recruiter',          'full_time', 36000, '2023-03-06', true),
    ('Tina',     'Lopez',      'tina.lopez@company.com',      '0917-100-0019', 'HR',          'HR Assistant',       'part_time', 20000, '2025-01-13', true),
    ('Camille',  'Soriano',    'camille.soriano@company.com', '0917-100-0020', 'HR',          'Training Officer',   'contract',  34000, '2024-09-16', true),
    ('Diego',    'Morales',    'diego.morales@company.com',   '0917-100-0021', 'Finance',     'Finance Manager',    'full_time', 90000, '2016-08-01', true),
    ('Sofia',    'Rivera',     'sofia.rivera@company.com',    '0917-100-0022', 'Finance',     'Accountant',         'full_time', 48000, '2020-06-15', true),
    ('Kevin',    'Tan',        'kevin.tan@company.com',       '0917-100-0023', 'Finance',     'Accountant',         'full_time', 47000, '2021-09-27', false),
    ('Angela',   'Lim',        'angela.lim@company.com',      '0917-100-0024', 'Finance',     'Payroll Officer',    'full_time', 40000, '2022-03-14', true)
) AS e(first_name, last_name, email, phone, department, position, employment_type, salary, hire_date, is_active)
JOIN departments d ON d.name = e.department;
