-- User Management SQLite Database Schema
-- This database stores user accounts, order information, and pricing packages

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    long_description TEXT,
    features TEXT, -- JSON array of features
    specifications TEXT, -- JSON array of specifications
    trust_indicators TEXT, -- JSON array of trust indicators (e.g., [{label: "Secure Processing", icon: "shield"}, ...])
    icon_name TEXT,
    icon_url TEXT,
    image_url TEXT,
    processing_time TEXT,
    min_cards INTEGER DEFAULT 1,
    max_cards INTEGER,
    is_active BOOLEAN DEFAULT 1,
    is_popular BOOLEAN DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'staff')),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    email_verified BOOLEAN DEFAULT 0,
    reset_token TEXT,
    reset_token_expires DATETIME
);

-- User addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT DEFAULT 'shipping' CHECK(type IN ('shipping', 'billing')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'US',
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    package_id TEXT NOT NULL,
    package_name TEXT NOT NULL,
    package_price DECIMAL(10,2) NOT NULL,
    total_cards INTEGER NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    shipping DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'received', 'in_progress', 'grading', 'completed', 'shipped', 'delivered', 'cancelled')),
    payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method TEXT,
    stripe_payment_intent_id TEXT,
    tracking_number TEXT,
    estimated_completion DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order items table (individual cards in each order)
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    card_name TEXT NOT NULL,
    card_game TEXT NOT NULL,
    card_type TEXT,
    card_rarity TEXT,
    card_number TEXT,
    card_image_url TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    grade INTEGER, -- Final grade assigned (1-10)
    grade_notes TEXT,
    is_custom BOOLEAN DEFAULT 0, -- Whether this was a custom-added card
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by INTEGER, -- user_id of who made the change
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Chat messages table (for order communication)
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    sender_type TEXT NOT NULL CHECK(sender_type IN ('user', 'staff', 'admin')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payment records table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    stripe_payment_intent_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL,
    payment_method TEXT,
    transaction_fee DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- User sessions table (optional, for better session management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Email settings table
CREATE TABLE IF NOT EXISTS email_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER DEFAULT 587,
    smtp_username TEXT NOT NULL,
    smtp_password TEXT NOT NULL,
    from_name TEXT DEFAULT 'Nexus TCGrading',
    from_email TEXT NOT NULL,
    enable_ssl INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_display_order ON packages(display_order);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_order_id ON chat_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_email_settings_id ON email_settings(id);

-- Triggers to update updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_user_addresses_updated_at 
    AFTER UPDATE ON user_addresses
BEGIN
    UPDATE user_addresses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_orders_updated_at 
    AFTER UPDATE ON orders
BEGIN
    UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_payments_updated_at
    AFTER UPDATE ON payments
BEGIN
    UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_packages_updated_at
    AFTER UPDATE ON packages
BEGIN
    UPDATE packages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to create order status history when order status changes
CREATE TRIGGER IF NOT EXISTS order_status_change_history
    AFTER UPDATE OF status ON orders
    WHEN OLD.status != NEW.status
BEGIN
    INSERT INTO order_status_history (order_id, old_status, new_status, notes)
    VALUES (NEW.id, OLD.status, NEW.status, 'Status updated automatically');
END;

-- ============================================
-- PACKAGES V2 - Table-style pricing page
-- ============================================

-- Packages V2 table (columns in the pricing table)
CREATE TABLE IF NOT EXISTS packages_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    price_suffix TEXT DEFAULT '/card',
    cta_text TEXT DEFAULT 'Get Started',
    cta_url TEXT,
    description TEXT,
    highlight_color TEXT DEFAULT '#d83f0a',
    is_featured BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Package Features V2 table (rows in the pricing table)
CREATE TABLE IF NOT EXISTS package_features_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Package Feature Values V2 table (intersection of packages and features)
CREATE TABLE IF NOT EXISTS package_feature_values_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id INTEGER NOT NULL,
    feature_id INTEGER NOT NULL,
    value_type TEXT DEFAULT 'check' CHECK(value_type IN ('check', 'dropdown', 'text')),
    is_checked BOOLEAN DEFAULT 0,
    text_value TEXT,
    dropdown_options TEXT, -- JSON array of options for dropdown type
    dropdown_selected TEXT, -- Selected option for dropdown type
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages_v2(id) ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES package_features_v2(id) ON DELETE CASCADE,
    UNIQUE(package_id, feature_id)
);

-- Packages V2 Settings table (global settings for the pricing page)
CREATE TABLE IF NOT EXISTS packages_v2_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Packages V2
CREATE INDEX IF NOT EXISTS idx_packages_v2_slug ON packages_v2(slug);
CREATE INDEX IF NOT EXISTS idx_packages_v2_active ON packages_v2(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_v2_order ON packages_v2(display_order);
CREATE INDEX IF NOT EXISTS idx_package_features_v2_active ON package_features_v2(is_active);
CREATE INDEX IF NOT EXISTS idx_package_features_v2_order ON package_features_v2(display_order);
CREATE INDEX IF NOT EXISTS idx_package_feature_values_v2_package ON package_feature_values_v2(package_id);
CREATE INDEX IF NOT EXISTS idx_package_feature_values_v2_feature ON package_feature_values_v2(feature_id);

-- Triggers for Packages V2
CREATE TRIGGER IF NOT EXISTS update_packages_v2_updated_at
    AFTER UPDATE ON packages_v2
BEGIN
    UPDATE packages_v2 SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_package_features_v2_updated_at
    AFTER UPDATE ON package_features_v2
BEGIN
    UPDATE package_features_v2 SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_package_feature_values_v2_updated_at
    AFTER UPDATE ON package_feature_values_v2
BEGIN
    UPDATE package_feature_values_v2 SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;