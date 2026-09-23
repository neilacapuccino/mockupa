-- CafeOrders schema (4 tables: users, menu_items, orders, order_items)
-- reset with:  npm run db   (from the variations folder)

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL
        CHECK (category IN ('coffee', 'tea', 'pastry', 'meal')),
    price INT NOT NULL CHECK (price > 0),        -- whole pesos (INT -> comes back as a number)
    is_available BOOLEAN DEFAULT TRUE             -- false = sold out
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
    total INT NOT NULL DEFAULT 0,                 -- calculated by the SERVER
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- the "in-between" table:
-- ONE order has MANY menu items, and ONE menu item can be in MANY orders
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    price_each INT NOT NULL                       -- the price WHEN it was ordered (menu prices can change later)
);

-- test account (password: password123)
INSERT INTO users (email, password_hash)
VALUES ('cashier@cafe.com', '$2b$10$cNW75jErgSgjMU5kz3L8S..cJqdmZiHu2ZICuF3T5KE7v0rMuUOxS');

INSERT INTO menu_items (name, category, price, is_available)
VALUES
    ('Americano',        'coffee', 120, true),
    ('Cafe Latte',       'coffee', 150, true),
    ('Spanish Latte',    'coffee', 165, true),
    ('Matcha Latte',     'tea',    160, true),
    ('Milk Tea',         'tea',    130, true),
    ('Croissant',        'pastry',  95, true),
    ('Blueberry Muffin', 'pastry',  85, false),   -- sold out
    ('Chicken Sandwich', 'meal',   180, true),
    ('Carbonara',        'meal',   220, true);

-- 3 sample orders
INSERT INTO orders (customer_name, status, total, created_by)
VALUES
    ('Juan',  'pending',   335, (SELECT id FROM users WHERE email = 'cashier@cafe.com')),
    ('Maria', 'ready',     160, (SELECT id FROM users WHERE email = 'cashier@cafe.com')),
    ('Pedro', 'completed', 370, (SELECT id FROM users WHERE email = 'cashier@cafe.com'));

-- what is inside each order
INSERT INTO order_items (order_id, menu_item_id, quantity, price_each)
VALUES
    ((SELECT id FROM orders WHERE customer_name = 'Juan'),  (SELECT id FROM menu_items WHERE name = 'Americano'),    2, 120),
    ((SELECT id FROM orders WHERE customer_name = 'Juan'),  (SELECT id FROM menu_items WHERE name = 'Croissant'),    1,  95),
    ((SELECT id FROM orders WHERE customer_name = 'Maria'), (SELECT id FROM menu_items WHERE name = 'Matcha Latte'), 1, 160),
    ((SELECT id FROM orders WHERE customer_name = 'Pedro'), (SELECT id FROM menu_items WHERE name = 'Carbonara'),    1, 220),
    ((SELECT id FROM orders WHERE customer_name = 'Pedro'), (SELECT id FROM menu_items WHERE name = 'Cafe Latte'),   1, 150);
