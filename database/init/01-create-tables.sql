-- Card Database Schema for TCG Grading Website
-- This script creates all necessary tables for storing card information

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data integrity
CREATE TYPE card_condition AS ENUM (
    'mint', 'near_mint', 'excellent', 'very_good', 
    'good', 'fair', 'poor', 'damaged'
);

CREATE TYPE card_rarity AS ENUM (
    'common', 'uncommon', 'rare', 'super_rare', 
    'ultra_rare', 'secret_rare', 'promotional', 'special'
);

CREATE TYPE card_language AS ENUM (
    'english', 'japanese', 'korean', 'chinese_simplified',
    'chinese_traditional', 'german', 'french', 'italian',
    'spanish', 'portuguese', 'other'
);

CREATE TYPE submission_status AS ENUM (
    'pending', 'received', 'grading', 'completed', 'shipped', 'delivered'
);

-- Games/TCG systems table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    abbreviation VARCHAR(10) NOT NULL UNIQUE,
    publisher VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Card sets/expansions table
CREATE TABLE card_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    set_code VARCHAR(20),
    release_date DATE,
    total_cards INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, set_code)
);

-- Main cards table
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    set_id UUID REFERENCES card_sets(id) ON DELETE SET NULL,
    
    -- Basic card identification
    name VARCHAR(300) NOT NULL,
    card_number VARCHAR(50),
    rarity card_rarity,
    language card_language DEFAULT 'english',
    
    -- Card details
    type_line VARCHAR(200),
    mana_cost VARCHAR(100),
    cmc INTEGER, -- Converted mana cost for MTG, energy cost for Pokemon, etc.
    power_toughness VARCHAR(20), -- For creatures (e.g., "2/3")
    hp INTEGER, -- For Pokemon cards
    
    -- Card text and abilities
    oracle_text TEXT,
    flavor_text TEXT,
    artist VARCHAR(200),
    
    -- Images and identifiers
    image_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    scryfall_id UUID, -- For MTG cards
    tcgplayer_id INTEGER,
    cardmarket_id INTEGER,
    
    -- Pricing information (in cents to avoid floating point issues)
    market_price_usd INTEGER,
    low_price_usd INTEGER,
    high_price_usd INTEGER,
    foil_price_usd INTEGER,
    
    -- Card characteristics
    is_foil BOOLEAN DEFAULT FALSE,
    is_promo BOOLEAN DEFAULT FALSE,
    is_reprint BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Card submissions for grading
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    
    -- Submission details
    submitter_name VARCHAR(200) NOT NULL,
    submitter_email VARCHAR(320) NOT NULL,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Card condition and grading
    submitted_condition card_condition,
    assigned_grade DECIMAL(3,1), -- e.g., 9.5, 10.0
    grade_notes TEXT,
    
    -- Submission tracking
    status submission_status DEFAULT 'pending',
    tracking_number VARCHAR(100) UNIQUE,
    service_level VARCHAR(50), -- express, standard, economy
    
    -- Pricing
    service_fee_cents INTEGER NOT NULL,
    shipping_fee_cents INTEGER DEFAULT 0,
    insurance_fee_cents INTEGER DEFAULT 0,
    total_fee_cents INTEGER GENERATED ALWAYS AS (service_fee_cents + shipping_fee_cents + insurance_fee_cents) STORED,
    
    -- Important dates
    received_date TIMESTAMP WITH TIME ZONE,
    graded_date TIMESTAMP WITH TIME ZONE,
    shipped_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Card variants (for different printings, languages, etc.)
CREATE TABLE card_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    
    variant_type VARCHAR(50) NOT NULL, -- foil, alternate_art, promo, etc.
    variant_name VARCHAR(200),
    language card_language DEFAULT 'english',
    
    -- Variant-specific details
    print_run INTEGER,
    special_attributes JSONB,
    
    -- Pricing for this specific variant
    market_price_usd INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Price history tracking
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    
    price_date DATE NOT NULL,
    market_price_usd INTEGER,
    low_price_usd INTEGER,
    high_price_usd INTEGER,
    foil_price_usd INTEGER,
    
    source VARCHAR(50) NOT NULL, -- tcgplayer, cardmarket, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(card_id, price_date, source)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_card_sets_updated_at BEFORE UPDATE ON card_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_card_variants_updated_at BEFORE UPDATE ON card_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_cards_name ON cards(name);
CREATE INDEX idx_cards_set_number ON cards(set_id, card_number);
CREATE INDEX idx_cards_game_rarity ON cards(game_id, rarity);
CREATE INDEX idx_cards_artist ON cards(artist);
CREATE INDEX idx_cards_type ON cards(type_line);

CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submitter ON submissions(submitter_email);
CREATE INDEX idx_submissions_tracking ON submissions(tracking_number);
CREATE INDEX idx_submissions_dates ON submissions(submission_date, status);

CREATE INDEX idx_variants_base_card ON card_variants(base_card_id);
CREATE INDEX idx_variants_type ON card_variants(variant_type);

CREATE INDEX idx_price_history_card_date ON price_history(card_id, price_date DESC);

CREATE INDEX idx_cards_full_text_search ON cards USING gin(to_tsvector('english', name || ' ' || COALESCE(oracle_text, '') || ' ' || COALESCE(type_line, '')));
CREATE INDEX idx_submissions_card_status ON submissions(card_id, status);
CREATE INDEX idx_cards_pricing ON cards(market_price_usd) WHERE market_price_usd IS NOT NULL;