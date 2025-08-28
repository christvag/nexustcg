import sqlite3

conn = sqlite3.connect('mtg_complete.db')
cursor = conn.cursor()

# Check total count
cursor.execute('SELECT COUNT(*) FROM trading_cards')
total = cursor.fetchone()[0]
print(f"Total MTG cards in database: {total}")

# Check by rarity/type (showing first word of rarity for readability)
cursor.execute("""
    SELECT 
        CASE 
            WHEN rarity LIKE '%|%' THEN SUBSTR(rarity, 1, INSTR(rarity, '|') - 1)
            ELSE rarity 
        END as main_rarity,
        COUNT(*) as count 
    FROM trading_cards 
    GROUP BY main_rarity 
    ORDER BY count DESC 
    LIMIT 10
""")
print("\nTop rarities:")
for row in cursor.fetchall():
    print(f"  {row[0].strip()}: {row[1]} cards")

# Check by set
cursor.execute('SELECT set_name, COUNT(*) as count FROM trading_cards GROUP BY set_name ORDER BY count DESC LIMIT 10')
print("\nTop 10 sets by card count:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} cards")

# Show some sample cards with images
cursor.execute('SELECT card_name, set_name, rarity, card_number, card_image_url FROM trading_cards WHERE card_image_url IS NOT NULL LIMIT 5')
print("\nSample cards with images:")
for row in cursor.fetchall():
    rarity_short = row[2][:30] + "..." if len(row[2]) > 30 else row[2]
    print(f"  {row[0]} | {row[1]} | {rarity_short} | #{row[3]}")
    print(f"    Image: {row[4]}")

# Check cards with mana costs
cursor.execute("SELECT COUNT(*) FROM trading_cards WHERE rarity LIKE '%Cost:%'")
mana_cards = cursor.fetchone()[0]
print(f"\nCards with mana cost information: {mana_cards}")

# Check image coverage
cursor.execute('SELECT COUNT(*) FROM trading_cards WHERE card_image_url IS NOT NULL')
with_images = cursor.fetchone()[0]
print(f"Cards with images: {with_images} ({with_images/total*100:.1f}%)")

conn.close()