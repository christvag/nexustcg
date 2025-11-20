const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'user-management.db');

console.log('🔐 Creating default admin user...\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    process.exit(1);
  }
});

async function createAdmin() {
  try {
    // Hash the password
    const password = 'admin123'; // Default password - CHANGE THIS IN PRODUCTION
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert admin user
    db.run(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['admin@tcgrading.com', passwordHash, 'Admin', 'User', 'admin', 1, 1],
      function(err) {
        if (err) {
          console.error('❌ Error creating admin user:', err);
          process.exit(1);
        }

        console.log('✅ Admin user created successfully!\n');
        console.log('📧 Email: admin@tcgrading.com');
        console.log('🔑 Password: admin123');
        console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');

        db.close();
      }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAdmin();
