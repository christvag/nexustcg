-- Graded Cards Database Schema
-- This database stores graded trading card information for the TCG grading service

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Graded Cards table
CREATE TABLE IF NOT EXISTS graded_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id TEXT UNIQUE NOT NULL,                   -- Unique identifier for the card
    card_type TEXT NOT NULL,                        -- Game type (POKEMON, YUGIOH, MAGIC, etc.)
    card_name TEXT NOT NULL,                        -- Name of the card
    grade REAL NOT NULL,                           -- Numerical grade (1.0 - 10.0)
    grade_name TEXT NOT NULL,                      -- Grade name (PRISTINE, MINT, etc.)
    year_card TEXT,                                -- Year of the card
    set_name TEXT,                                 -- Set/expansion name
    edition TEXT,                                  -- Edition or card number
    card_info TEXT,                                -- Additional card information
    author TEXT,                                   -- Card artist/author
    rarity TEXT,                                   -- Card rarity
    language TEXT DEFAULT 'English',               -- Card language (English, Japanese, Korean, etc.)
    owner TEXT,                                    -- Card owner name
    front_image_path TEXT,                         -- Path to front image
    back_image_path TEXT,                          -- Path to back image
    date_grade DATE NOT NULL,                      -- Date the card was graded
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- Record update timestamp
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_graded_cards_type ON graded_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_graded_cards_name ON graded_cards(card_name);
CREATE INDEX IF NOT EXISTS idx_graded_cards_grade ON graded_cards(grade);
CREATE INDEX IF NOT EXISTS idx_graded_cards_set ON graded_cards(set_name);
CREATE INDEX IF NOT EXISTS idx_graded_cards_year ON graded_cards(year_card);
CREATE INDEX IF NOT EXISTS idx_graded_cards_date_grade ON graded_cards(date_grade);

-- Create a composite index for population reports
CREATE INDEX IF NOT EXISTS idx_graded_cards_population ON graded_cards(card_type, card_name, set_name, year_card);

-- Trigger to update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_graded_cards_updated_at 
    AFTER UPDATE ON graded_cards
    FOR EACH ROW
BEGIN
    UPDATE graded_cards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- View for population statistics
CREATE VIEW IF NOT EXISTS population_stats AS
SELECT 
    card_type,
    card_name,
    set_name,
    year_card,
    COUNT(*) as total_graded,
    AVG(grade) as average_grade,
    MAX(grade) as highest_grade,
    MIN(grade) as lowest_grade,
    COUNT(CASE WHEN grade = 10 THEN 1 END) as pristine_count,
    COUNT(CASE WHEN grade >= 9 THEN 1 END) as mint_plus_count
FROM graded_cards
GROUP BY card_type, card_name, set_name, year_card
HAVING COUNT(*) > 0
ORDER BY total_graded DESC, average_grade DESC;