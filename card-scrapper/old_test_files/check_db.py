import sqlite3

conn = sqlite3.connect('trading_cards.db')
cursor = conn.cursor()

# Check total count
cursor.execute('SELECT COUNT(*) FROM trading_cards')
total = cursor.fetchone()[0]
print(f"Total cards in database: {total}")

# Check by game
cursor.execute('SELECT card_game, COUNT(*) as count FROM trading_cards GROUP BY card_game')
print("\nCards by game:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} cards")

# Check by set (first 10)
cursor.execute('SELECT card_game, set_name, COUNT(*) as count FROM trading_cards GROUP BY card_game, set_name LIMIT 10')
print("\nCards by set (first 10):")
for row in cursor.fetchall():
    print(f"  {row[0]} - {row[1]}: {row[2]} cards")

# Show some sample cards
cursor.execute('SELECT card_name, set_name, rarity, card_number FROM trading_cards LIMIT 5')
print("\nSample cards:")
for row in cursor.fetchall():
    print(f"  {row[0]} | {row[1]} | {row[2]} | #{row[3]}")

conn.close()