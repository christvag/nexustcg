-- Sample Data for Card Database
-- This script inserts sample data for testing and development

-- Insert sample games
INSERT INTO games (name, abbreviation, publisher) VALUES
('Magic: The Gathering', 'MTG', 'Wizards of the Coast'),
('Pokemon Trading Card Game', 'PTCG', 'The Pokemon Company'),
('Yu-Gi-Oh!', 'YGO', 'Konami'),
('Flesh and Blood', 'FAB', 'Legend Story Studios');

-- Get game IDs for reference
DO $$
DECLARE
    mtg_id UUID;
    pokemon_id UUID;
    yugioh_id UUID;
    fab_id UUID;
BEGIN
    SELECT id INTO mtg_id FROM games WHERE abbreviation = 'MTG';
    SELECT id INTO pokemon_id FROM games WHERE abbreviation = 'PTCG';
    SELECT id INTO yugioh_id FROM games WHERE abbreviation = 'YGO';
    SELECT id INTO fab_id FROM games WHERE abbreviation = 'FAB';

    -- Insert sample card sets
    INSERT INTO card_sets (game_id, name, set_code, release_date, total_cards) VALUES
    (mtg_id, 'Alpha', 'LEA', '1993-08-05', 295),
    (mtg_id, 'Beta', 'LEB', '1993-10-01', 302),
    (mtg_id, 'Unlimited', '2ED', '1993-12-01', 302),
    (mtg_id, 'Time Spiral', 'TSP', '2006-10-06', 301),
    (pokemon_id, 'Base Set', 'BS', '1998-10-20', 102),
    (pokemon_id, 'Jungle', 'JU', '1999-06-16', 64),
    (pokemon_id, 'Fossil', 'FO', '1999-10-10', 62),
    (yugioh_id, 'Legend of Blue Eyes White Dragon', 'LOB', '2002-03-08', 126),
    (fab_id, 'Welcome to Rathe', 'WTR', '2019-10-11', 219);

    -- Insert sample cards
    INSERT INTO cards (game_id, set_id, name, card_number, rarity, type_line, mana_cost, cmc, oracle_text, artist, market_price_usd, is_foil) VALUES
    -- MTG Cards
    (mtg_id, (SELECT id FROM card_sets WHERE set_code = 'LEA'), 'Black Lotus', NULL, 'rare', 'Artifact', '{0}', 0, '{T}, Sacrifice Black Lotus: Add three mana of any one color.', 'Christopher Rush', 2500000, FALSE),
    (mtg_id, (SELECT id FROM card_sets WHERE set_code = 'LEA'), 'Ancestral Recall', NULL, 'rare', 'Instant', '{U}', 1, 'Target player draws three cards.', 'Mark Poole', 450000, FALSE),
    (mtg_id, (SELECT id FROM card_sets WHERE set_code = 'LEA'), 'Lightning Bolt', NULL, 'common', 'Instant', '{R}', 1, 'Lightning Bolt deals 3 damage to any target.', 'Christopher Rush', 5000, FALSE),
    (mtg_id, (SELECT id FROM card_sets WHERE set_code = 'TSP'), 'Tarmogoyf', '153', 'rare', 'Creature — Lhurgoyf', '{1}{G}', 2, 'Tarmogoyf''s power is equal to the number of card types among cards in all graveyards and its toughness is equal to that number plus 1.', 'Justin Murray', 8500, FALSE),

    -- Pokemon Cards  
    (pokemon_id, (SELECT id FROM card_sets WHERE set_code = 'BS'), 'Charizard', '4', 'rare', 'Fire Pokemon', NULL, NULL, 'Pokemon Power: Energy Burn. As often as you like during your turn (before your attack), you may turn all Energy attached to Charizard into Fire Energy for the rest of the turn.', 'Mitsuhiro Arita', 35000, FALSE),
    (pokemon_id, (SELECT id FROM card_sets WHERE set_code = 'BS'), 'Blastoise', '2', 'rare', 'Water Pokemon', NULL, NULL, 'Pokemon Power: Rain Dance. As often as you like during your turn (before your attack), you may attach 1 Water Energy card from your hand to 1 of your Water Pokemon.', 'Ken Sugimori', 15000, FALSE),
    (pokemon_id, (SELECT id FROM card_sets WHERE set_code = 'BS'), 'Venusaur', '15', 'rare', 'Grass Pokemon', NULL, NULL, 'Pokemon Power: Energy Trans. As often as you like during your turn (before your attack), you may take 1 Grass Energy card attached to 1 of your Pokemon and attach it to a different one.', 'Ken Sugimori', 12000, FALSE),

    -- Yu-Gi-Oh Cards
    (yugioh_id, (SELECT id FROM card_sets WHERE set_code = 'LOB'), 'Blue-Eyes White Dragon', 'LOB-001', 'ultra_rare', 'Dragon/Normal', NULL, 8, 'This legendary dragon is a powerful engine of destruction. Virtually invincible, very few have faced this awesome creature and lived to tell the tale.', 'Kazuki Takahashi', 8000, FALSE),
    (yugioh_id, (SELECT id FROM card_sets WHERE set_code = 'LOB'), 'Dark Magician', 'LOB-005', 'ultra_rare', 'Spellcaster/Normal', NULL, 7, 'The ultimate wizard in terms of attack and defense.', 'Kazuki Takahashi', 4500, FALSE),

    -- Flesh and Blood Cards
    (fab_id, (SELECT id FROM card_sets WHERE set_code = 'WTR'), 'Heart of Fyendal', 'WTR000', 'legendary', 'Equipment - Chest', '{2}', 2, 'When Heart of Fyendal enters the battlefield, you may pay {X}. If you do, draw X cards.', 'Nikolay Litvinenko', 45000, FALSE);

END $$;

-- Insert sample submissions
INSERT INTO submissions (
    card_id, 
    submitter_name, 
    submitter_email, 
    submitted_condition, 
    assigned_grade,
    status,
    tracking_number,
    service_level,
    service_fee_cents,
    shipping_fee_cents
) VALUES 
(
    (SELECT id FROM cards WHERE name = 'Charizard' LIMIT 1),
    'John Collector',
    'john@example.com',
    'near_mint',
    9.5,
    'completed',
    'TCG2024001',
    'standard',
    5000,
    1500
),
(
    (SELECT id FROM cards WHERE name = 'Black Lotus' LIMIT 1),
    'Jane Expert', 
    'jane@example.com',
    'excellent',
    8.0,
    'grading',
    'TCG2024002',
    'express',
    15000,
    2500
),
(
    (SELECT id FROM cards WHERE name = 'Blue-Eyes White Dragon' LIMIT 1),
    'Mike Trader',
    'mike@example.com', 
    'mint',
    10.0,
    'shipped',
    'TCG2024003',
    'economy',
    2500,
    1000
);

-- Insert sample price history
INSERT INTO price_history (card_id, price_date, market_price_usd, source) VALUES
((SELECT id FROM cards WHERE name = 'Charizard' LIMIT 1), '2024-01-01', 32000, 'tcgplayer'),
((SELECT id FROM cards WHERE name = 'Charizard' LIMIT 1), '2024-02-01', 33500, 'tcgplayer'),  
((SELECT id FROM cards WHERE name = 'Charizard' LIMIT 1), '2024-03-01', 35000, 'tcgplayer'),
((SELECT id FROM cards WHERE name = 'Black Lotus' LIMIT 1), '2024-01-01', 2400000, 'tcgplayer'),
((SELECT id FROM cards WHERE name = 'Black Lotus' LIMIT 1), '2024-02-01', 2450000, 'tcgplayer'),
((SELECT id FROM cards WHERE name = 'Black Lotus' LIMIT 1), '2024-03-01', 2500000, 'tcgplayer');

-- Create some useful views for common queries
CREATE VIEW card_details AS
SELECT 
    c.id,
    c.name,
    c.card_number,
    c.rarity,
    c.language,
    g.name as game_name,
    g.abbreviation as game_abbr,
    cs.name as set_name,
    cs.set_code,
    c.type_line,
    c.oracle_text,
    c.artist,
    c.market_price_usd::DECIMAL / 100 as market_price_dollars,
    c.is_foil,
    c.is_promo
FROM cards c
JOIN games g ON c.game_id = g.id
LEFT JOIN card_sets cs ON c.set_id = cs.id;

CREATE VIEW submission_summary AS
SELECT 
    s.id,
    s.tracking_number,
    s.submitter_name,
    s.submitter_email,
    cd.name as card_name,
    cd.game_name,
    cd.set_name,
    s.submitted_condition,
    s.assigned_grade,
    s.status,
    s.service_level,
    s.total_fee_cents::DECIMAL / 100 as total_fee_dollars,
    s.submission_date,
    s.graded_date
FROM submissions s
JOIN card_details cd ON s.card_id = cd.id;