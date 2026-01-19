const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'tcgrading.db');
const db = new Database(dbPath);

console.log('🧹 Cleaning database - removing all sample data...\n');

try {
  db.pragma('foreign_keys = OFF'); // Temporarily disable to allow deletions
  
  // Show current data counts
  console.log('BEFORE CLEANUP:');
  const beforeOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  const beforeItems = db.prepare('SELECT COUNT(*) as count FROM order_items').get();
  const beforeUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const beforePopularity = db.prepare('SELECT COUNT(*) as count FROM card_popularity').get();
  
  console.log(`  - Orders: ${beforeOrders.count}`);
  console.log(`  - Order Items: ${beforeItems.count}`);
  console.log(`  - Users: ${beforeUsers.count}`);
  console.log(`  - Card Popularity: ${beforePopularity.count}`);
  console.log('');
  
  // Delete all order-related data
  console.log('Removing order data...');
  db.prepare('DELETE FROM order_status_history').run();
  db.prepare('DELETE FROM order_items').run();
  db.prepare('DELETE FROM orders').run();
  console.log('  ✅ All orders and order items removed');
  
  // Delete grading sessions
  db.prepare('DELETE FROM grading_sessions').run();
  console.log('  ✅ Grading sessions removed');
  
  // Delete card popularity data
  db.prepare('DELETE FROM card_popularity').run();
  console.log('  ✅ Card popularity data removed');
  
  // Delete user sessions
  db.prepare('DELETE FROM user_sessions').run();
  console.log('  ✅ User sessions removed');
  
  // Delete user addresses
  db.prepare('DELETE FROM user_addresses').run();
  console.log('  ✅ User addresses removed');
  
  // Delete non-admin users (keep admin for login)
  const deletedUsers = db.prepare("DELETE FROM users WHERE role != 'admin'").run();
  console.log(`  ✅ Removed ${deletedUsers.changes} non-admin users`);
  
  // Keep the admin user
  const adminUser = db.prepare("SELECT email, first_name, last_name FROM users WHERE role = 'admin'").get();
  if (adminUser) {
    console.log(`  ℹ️  Kept admin user: ${adminUser.email} (${adminUser.first_name} ${adminUser.last_name})`);
  } else {
    // Create admin user if it doesn't exist
    const bcrypt = require('bcrypt');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (first_name, last_name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('Admin', 'User', 'admin@tcgrading.com', hashedPassword, 'admin');
    console.log('  ✅ Created admin user: admin@tcgrading.com (password: admin123)');
  }
  
  db.pragma('foreign_keys = ON'); // Re-enable foreign keys
  
  // Show final data counts
  console.log('\nAFTER CLEANUP:');
  const afterOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  const afterItems = db.prepare('SELECT COUNT(*) as count FROM order_items').get();
  const afterUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const afterPopularity = db.prepare('SELECT COUNT(*) as count FROM card_popularity').get();
  
  console.log(`  - Orders: ${afterOrders.count}`);
  console.log(`  - Order Items: ${afterItems.count}`);
  console.log(`  - Users: ${afterUsers.count}`);
  console.log(`  - Card Popularity: ${afterPopularity.count}`);
  
  console.log('\n✨ Database cleaned successfully!');
  console.log('📝 Admin login: admin@tcgrading.com / admin123');
  console.log('🔄 The admin dashboard should now show empty states for all data');
  
} catch (error) {
  console.error('❌ Error cleaning database:', error);
} finally {
  db.close();
}