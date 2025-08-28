import sqlite3

conn = sqlite3.connect('pokemon_fixed.db')
cursor = conn.cursor()

# Check total count
cursor.execute('SELECT COUNT(*) FROM trading_cards')
total = cursor.fetchone()[0]
print(f"Total Pokemon cards in database: {total}")

# Check by set
cursor.execute('SELECT set_name, COUNT(*) as count FROM trading_cards GROUP BY set_name ORDER BY count DESC')
print("\nSets by card count:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} cards")

# Check by rarity
cursor.execute('SELECT rarity, COUNT(*) as count FROM trading_cards GROUP BY rarity ORDER BY count DESC')
print("\nRarity distribution:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} cards")

# Show sample cards with full details
cursor.execute('SELECT card_name, set_name, rarity, card_number, card_image_url FROM trading_cards LIMIT 5')
print("\nSample cards with full details:")
for row in cursor.fetchall():
    print(f"  {row[0]} | {row[1]} | {row[2]} | #{row[3]}")
    print(f"    Image: {row[4]}")

# Check card number distribution
cursor.execute('SELECT card_number, COUNT(*) as count FROM trading_cards GROUP BY card_number ORDER BY card_number LIMIT 10')
print("\nCard numbers (first 10):")
for row in cursor.fetchall():
    print(f"  #{row[0]}: {row[1]} occurrences")

# Check image coverage
cursor.execute('SELECT COUNT(*) FROM trading_cards WHERE card_image_url IS NOT NULL')
with_images = cursor.fetchone()[0]
print(f"\nCards with images: {with_images} ({with_images/total*100:.1f}%)")

# Check unique card numbers per set
cursor.execute("""
    SELECT set_name, 
           MIN(CAST(card_number as INTEGER)) as min_num, 
           MAX(CAST(card_number as INTEGER)) as max_num,
           COUNT(*) as total_cards
    FROM trading_cards 
    WHERE card_number IS NOT NULL 
    GROUP BY set_name
""")
print("\nSet ranges:")
for row in cursor.fetchall():
    print(f"  {row[0]}: #{row[1]:03d}-#{row[2]:03d} ({row[3]} cards)")

conn.close()