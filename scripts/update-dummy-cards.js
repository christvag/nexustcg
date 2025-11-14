const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DATABASE_PATH = path.join(process.cwd(), 'database', 'graded-cards.db');

const db = new sqlite3.Database(DATABASE_PATH, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Grade names mapping (based on numeric grades)
const getGradeName = (grade) => {
  const gradeNum = parseInt(grade);
  if (grade === 'A') return 'Authentic';
  if (gradeNum === 10) return 'Pristine';
  if (gradeNum === 9) return 'Mint';
  if (gradeNum >= 7 && gradeNum <= 8) return 'Near Mint';
  if (gradeNum >= 5 && gradeNum <= 6) return 'Excellent';
  return 'Good';
};

// Update data for each card
const updates = [
  { card_id: '00000674', grade_name: 'Mint', year_card: '2020', card_info: 'Yu-Gi-Oh! LINK-3 monster from Eternity Code set. Features the Appliancer archetype with powerful link abilities.' },
  { card_id: '00000675', grade_name: 'Pristine', year_card: '2021', card_info: 'Pikachu VMAX from Vivid Voltage. Maximum HP 320. Features Gigantamax form with electric attacks.' },
  { card_id: '00000676', grade_name: 'Near Mint', year_card: '1993', card_info: 'Power Nine card from Limited Edition Alpha. One of the most valuable MTG cards ever printed.' },
  { card_id: '00000677', grade_name: 'Pristine', year_card: '2023', card_info: 'One Piece Card Game character card from Romance Dawn set. Protagonist with Gum-Gum abilities.' },
  { card_id: '00000678', grade_name: 'Near Mint', year_card: '2002', card_info: 'Charizard from Legendary Collection. Reverse Holo version, one of the most iconic Pokemon cards.' },
  { card_id: '00000679', grade_name: 'Mint', year_card: '2004', card_info: 'Classic Spell Card from LOB set. Original iconic Yu-Gi-Oh! card with powerful summoning effect.' },
  { card_id: '00000680', grade_name: 'Near Mint', year_card: '1993', card_info: 'Power Nine card from Limited Edition Beta. Produces blue mana, essential for vintage formats.' },
  { card_id: '00000681', grade_name: 'Pristine', year_card: '2023', card_info: 'One Piece Card Game from Romance Dawn. Three-sword style swordsman character card.' },
  { card_id: '00000682', grade_name: 'Mint', year_card: '2016', card_info: 'Mew EX from Legendary Treasures. Full Art version with Versatile ability and powerful attacks.' },
  { card_id: '00000683', grade_name: 'Near Mint', year_card: '1996', card_info: 'Original Dark Magician from Starter Deck Yugi. Most iconic spell-caster in Yu-Gi-Oh! history.' }
];

db.serialize(() => {
  let completed = 0;

  updates.forEach((update) => {
    const sql = `
      UPDATE population_report_cards
      SET grade_name = ?, year_card = ?, card_info = ?
      WHERE card_id = ?
    `;

    db.run(sql, [update.grade_name, update.year_card, update.card_info, update.card_id], (err) => {
      if (err) {
        console.error(`❌ Error updating card ${update.card_id}:`, err.message);
      } else {
        console.log(`✅ Updated card ${update.card_id} with grade name: ${update.grade_name}, year: ${update.year_card}`);
      }

      completed++;
      if (completed === updates.length) {
        // Verify updates
        db.all("SELECT card_id, card_name, grade_name, year_card FROM population_report_cards ORDER BY card_id", (err, rows) => {
          if (err) {
            console.error('❌ Error fetching cards:', err.message);
          } else {
            console.log('\n📋 Updated Cards:');
            rows.forEach(row => {
              console.log(`   ${row.card_id}: ${row.card_name} - Grade: ${row.grade_name}, Year: ${row.year_card}`);
            });
          }

          db.close((err) => {
            if (err) {
              console.error('❌ Error closing database:', err.message);
            } else {
              console.log('\n✅ Database connection closed');
            }
          });
        });
      }
    });
  });
});
