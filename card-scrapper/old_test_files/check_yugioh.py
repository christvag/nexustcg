import sqlite3

conn = sqlite3.connect('yugioh_complete.db')
cursor = conn.cursor()

# Check total count
cursor.execute('SELECT COUNT(*) FROM trading_cards')
total = cursor.fetchone()[0]
print(f"Total YuGiOh cards in database: {total}")

# Check by rarity
cursor.execute('SELECT rarity, COUNT(*) as count FROM trading_cards GROUP BY rarity ORDER BY count DESC LIMIT 10')
print("\nTop card rarities:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} cards")

# Check by set (first 10)
cursor.execute('SELECT set_name, COUNT(*) as count FROM trading_cards GROUP BY set_name ORDER BY count DESC LIMIT 10')
print("\nTop 10 sets by card count:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} cards")

# Show some sample cards
cursor.execute('SELECT card_name, set_name, rarity, card_number FROM trading_cards LIMIT 10')
print("\nSample cards:")
for row in cursor.fetchall():
    print(f"  {row[0]} | {row[1]} | {row[2]} | #{row[3]}")

conn.close()