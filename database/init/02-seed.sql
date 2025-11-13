-- Seed data for TCG Grading Service
-- Insert default admin user and sample data

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, role, first_name, last_name, phone) VALUES 
('admin@tcggrading.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Xe4tb7hdGSBkGKu9uY4bdQTnfV6.LhZJu', 'admin', 'Admin', 'User', '+1-555-0100');

-- Insert sample staff user (password: staff123)
INSERT INTO users (email, password_hash, role, first_name, last_name, phone) VALUES 
('staff@tcggrading.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Xe4tb7hdGSBkGKu9uY4bdQTnfV6.LhZJu', 'staff', 'Staff', 'Member', '+1-555-0200');

-- Insert sample regular users (password: user123)
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, shipping_address) VALUES 
('user1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Xe4tb7hdGSBkGKu9uY4bdQTnfV6.LhZJu', 'user', 'John', 'Doe', '+1-555-0301', 
 '{"address": "123 Main St", "city": "New York", "state": "NY", "zipCode": "10001", "country": "United States"}'),
('user2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Xe4tb7hdGSBkGKu9uY4bdQTnfV6.LhZJu', 'user', 'Jane', 'Smith', '+1-555-0302', 
 '{"address": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zipCode": "90210", "country": "United States"}'),
('user3@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Xe4tb7hdGSBkGKu9uY4bdQTnfV6.LhZJu', 'user', 'Mike', 'Johnson', '+1-555-0303', 
 '{"address": "789 Pine St", "city": "Chicago", "state": "IL", "zipCode": "60601", "country": "United States"}');

-- Insert sample orders
INSERT INTO orders (user_id, order_number, package_id, package_name, package_price, total_cards, subtotal, tax, shipping, total, status, payment_status, payment_method) 
SELECT 
    u.id,
    'TCG-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || ROW_NUMBER() OVER(),
    'standard',
    'Standard',
    15.00,
    5,
    75.00,
    6.00,
    9.99,
    90.99,
    'in_progress',
    'paid',
    'stripe'
FROM users u WHERE u.role = 'user' LIMIT 1;

INSERT INTO orders (user_id, order_number, package_id, package_name, package_price, total_cards, subtotal, tax, shipping, total, status, payment_status, payment_method) 
SELECT 
    u.id,
    'TCG-' || (EXTRACT(EPOCH FROM NOW())::BIGINT + 1) || '-' || ROW_NUMBER() OVER(),
    'express',
    'Express',
    20.00,
    3,
    60.00,
    4.80,
    0.00,
    64.80,
    'completed',
    'paid',
    'stripe'
FROM users u WHERE u.role = 'user' AND u.email = 'user2@example.com';

INSERT INTO orders (user_id, order_number, package_id, package_name, package_price, total_cards, subtotal, tax, shipping, total, status, payment_status, payment_method) 
SELECT 
    u.id,
    'TCG-' || (EXTRACT(EPOCH FROM NOW())::BIGINT + 2) || '-' || ROW_NUMBER() OVER(),
    'bulk',
    'Bulk Grading',
    12.00,
    50,
    600.00,
    48.00,
    0.00,
    648.00,
    'pending',
    'paid',
    'stripe'
FROM users u WHERE u.role = 'user' AND u.email = 'user3@example.com';

-- Insert sample order items
DO $$
DECLARE
    order_record RECORD;
BEGIN
    -- For each order, insert sample cards
    FOR order_record IN SELECT id, total_cards FROM orders LOOP
        -- Insert first card
        INSERT INTO order_items (order_id, card_name, card_game, card_type, card_rarity, card_number, quantity, unit_price, grade)
        VALUES (order_record.id, 'Charizard', 'Pokemon', 'Fire/Flying', 'Rare Holo', '4/102', 1, 15.00, 9);
        
        -- Insert more cards based on total_cards
        IF order_record.total_cards >= 3 THEN
            INSERT INTO order_items (order_id, card_name, card_game, card_type, card_rarity, card_number, quantity, unit_price, grade)
            VALUES (order_record.id, 'Blue-Eyes White Dragon', 'Yu Gi Oh', 'Dragon/Normal', 'Ultra Rare', 'LOB-001', 1, 15.00, 8);
            
            INSERT INTO order_items (order_id, card_name, card_game, card_type, card_rarity, card_number, quantity, unit_price, grade)
            VALUES (order_record.id, 'Black Lotus', 'MTG', 'Artifact', 'Mythic Rare', '001', 1, 15.00, 10);
        END IF;
        
        -- For bulk orders, add more cards
        IF order_record.total_cards >= 50 THEN
            INSERT INTO order_items (order_id, card_name, card_game, card_type, card_rarity, card_number, quantity, unit_price)
            VALUES (order_record.id, 'Various Pokemon Cards', 'Pokemon', 'Mixed', 'Common-Rare', 'Mixed', 47, 12.00);
        END IF;
        
        -- For remaining cards in smaller orders
        IF order_record.total_cards = 5 THEN
            INSERT INTO order_items (order_id, card_name, card_game, card_type, card_rarity, card_number, quantity, unit_price)
            VALUES (order_record.id, 'Pikachu', 'Pokemon', 'Electric', 'Common', '58/102', 2, 15.00);
        END IF;
    END LOOP;
END $$;

-- Insert sample chat messages
DO $$
DECLARE
    order_record RECORD;
    user_record RECORD;
    staff_record RECORD;
BEGIN
    SELECT id INTO staff_record FROM users WHERE role = 'staff' LIMIT 1;
    
    FOR order_record IN SELECT o.id, o.user_id FROM orders o LIMIT 2 LOOP
        -- User message
        INSERT INTO chat_messages (order_id, user_id, sender_type, message)
        VALUES (order_record.id, order_record.user_id, 'user', 'Hello, I wanted to check on the status of my order. When can I expect it to be completed?');
        
        -- Staff response
        INSERT INTO chat_messages (order_id, user_id, sender_type, message)
        VALUES (order_record.id, staff_record.id, 'staff', 'Hi! Your order is currently being processed. We estimate completion within 5-6 business days. I''ll keep you updated on any progress.');
        
        -- User follow-up
        INSERT INTO chat_messages (order_id, user_id, sender_type, message)
        VALUES (order_record.id, order_record.user_id, 'user', 'Thank you for the update! Will I receive photos of the graded cards?');
        
        -- Staff response
        INSERT INTO chat_messages (order_id, user_id, sender_type, message)
        VALUES (order_record.id, staff_record.id, 'staff', 'Yes, we provide high-quality photos of all graded cards. You''ll receive them via email once grading is complete.');
    END LOOP;
END $$;

-- Insert sample order status history
DO $$
DECLARE
    order_record RECORD;
    admin_record RECORD;
BEGIN
    SELECT id INTO admin_record FROM users WHERE role = 'admin' LIMIT 1;
    
    FOR order_record IN SELECT id FROM orders LOOP
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes)
        VALUES (order_record.id, NULL, 'pending', admin_record.id, 'Order created and payment processed');
        
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes)
        VALUES (order_record.id, 'pending', 'received', admin_record.id, 'Cards received at facility');
    END LOOP;
END $$;