-- Create the main trading cards database schema

CREATE TABLE IF NOT EXISTS trading_cards (
    id SERIAL PRIMARY KEY,
    card_game VARCHAR(50) NOT NULL,
    set_name VARCHAR(255) NOT NULL,
    card_name VARCHAR(255) NOT NULL,
    rarity VARCHAR(100),
    card_number VARCHAR(50),
    card_image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(card_game, set_name, card_number)
);

-- Create indexes for better query performance
CREATE INDEX idx_card_game ON trading_cards(card_game);
CREATE INDEX idx_set_name ON trading_cards(set_name);
CREATE INDEX idx_card_name ON trading_cards(card_name);
CREATE INDEX idx_card_number ON trading_cards(card_number);
CREATE INDEX idx_rarity ON trading_cards(rarity);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_trading_cards_updated_at BEFORE UPDATE
    ON trading_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();