-- StockRoom schema
-- 1) create the database once:
--    & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE stockroom;"
-- 2) run this file (running it again deletes all data and starts fresh):
--    & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d stockroom -f ".\schema.sql"

DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS users;

-- NEW: role column -> "admin" or "staff"
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff'
        CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(30) UNIQUE NOT NULL,              -- UNIQUE -> a duplicate gives error code 23505
    quantity INT NOT NULL DEFAULT 0
        CHECK (quantity >= 0),                    -- stock can never be negative
    price NUMERIC(10, 2) NOT NULL,                -- NUMERIC comes back from pg as a STRING ("9.99")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- test accounts (password for both: password123)
INSERT INTO users (email, password_hash, role)
VALUES
    ('admin@stock.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS', 'admin'),
    ('staff@stock.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS', 'staff');

-- sample items
INSERT INTO items (name, sku, quantity, price)
VALUES
    ('USB-C Cable', 'CAB-001', 25, 9.99),
    ('Wireless Mouse', 'MOU-001', 8, 24.50),
    ('HDMI Adapter', 'ADP-001', 0, 15.00);
