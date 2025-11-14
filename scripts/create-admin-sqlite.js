const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const DATABASE_PATH = path.join(process.cwd(), 'database', 'user-management.db');

async function createAdminUser() {
  const db = new sqlite3.Database(DATABASE_PATH, (err) => {
    if (err) {
      console.error('❌ Error connecting to database:', err.message);
      process.exit(1);
    }
    console.log('✅ Connected to database');
  });

  try {
    // Check if admin user exists
    db.get("SELECT * FROM users WHERE role = 'admin'", async (err, row) => {
      if (err) {
        console.error('❌ Error checking for admin:', err.message);
        db.close();
        return;
      }

      if (row) {
        console.log('✅ Admin user already exists:', row.email);
        db.close();
        return;
      }

      // Create admin user
      const email = 'admin@tcgrading.com';
      const password = 'admin123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = `
        INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;

      db.run(sql, [
        email,
        hashedPassword,
        'Admin',
        'User',
        'admin',
        1,
        1
      ], function(err) {
        if (err) {
          console.error('❌ Error creating admin user:', err.message);
        } else {
          console.log('\n✅ Admin user created successfully!');
          console.log('📧 Email:', email);
          console.log('🔑 Password:', password);
          console.log('👤 Role: admin');
          console.log('\nYou can now login at: http://localhost:4000/auth/login\n');
        }
        db.close();
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
    db.close();
  }
}

createAdminUser();
