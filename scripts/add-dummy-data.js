const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const DATABASE_PATH = path.join(process.cwd(), 'database', 'user-management.db');

async function addDummyData() {
  const db = new sqlite3.Database(DATABASE_PATH, (err) => {
    if (err) {
      console.error('❌ Error connecting to database:', err.message);
      process.exit(1);
    }
    console.log('✅ Connected to database\n');
  });

  try {
    // 1. Add 5 dummy users
    console.log('📝 Adding 5 dummy users...');
    const users = [
      { email: 'john.smith@example.com', firstName: 'John', lastName: 'Smith', role: 'user' },
      { email: 'sarah.jones@example.com', firstName: 'Sarah', lastName: 'Jones', role: 'user' },
      { email: 'mike.wilson@example.com', firstName: 'Mike', lastName: 'Wilson', role: 'user' },
      { email: 'emily.brown@example.com', firstName: 'Emily', lastName: 'Brown', role: 'user' },
      { email: 'david.lee@example.com', firstName: 'David', lastName: 'Lee', role: 'user' }
    ];

    const hashedPassword = await bcrypt.hash('password123', 10);

    for (const user of users) {
      await new Promise((resolve, reject) => {
        const sql = `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, 1, 1, datetime('now'), datetime('now'))`;

        db.run(sql, [user.email, hashedPassword, user.firstName, user.lastName, user.role], function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint')) {
              console.log(`  ⚠️  User ${user.email} already exists, skipping...`);
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log(`  ✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);
            resolve();
          }
        });
      });
    }

    // Get user IDs for orders
    const userIds = await new Promise((resolve, reject) => {
      db.all('SELECT id, email FROM users WHERE role = "user" ORDER BY id DESC LIMIT 5', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('\n📦 Adding 5 dummy orders...');

    // 2. Add 5 dummy orders
    const orders = [
      { userId: userIds[0].id, packageId: 'standard', packageName: 'Standard Grading', packagePrice: 15.00, totalCards: 10, status: 'pending', paymentStatus: 'pending' },
      { userId: userIds[1].id, packageId: 'express', packageName: 'Express Grading', packagePrice: 20.00, totalCards: 15, status: 'received', paymentStatus: 'paid' },
      { userId: userIds[2].id, packageId: 'bulk', packageName: 'Bulk Grading', packagePrice: 12.00, totalCards: 50, status: 'in_progress', paymentStatus: 'paid' },
      { userId: userIds[3].id, packageId: 'authentication', packageName: 'Authentication Only', packagePrice: 10.00, totalCards: 20, status: 'grading', paymentStatus: 'paid' },
      { userId: userIds[4].id, packageId: 'standard', packageName: 'Standard Grading', packagePrice: 15.00, totalCards: 8, status: 'completed', paymentStatus: 'paid' }
    ];

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const orderNumber = `ORD-${Date.now()}-${i}`;
      const subtotal = order.packagePrice * order.totalCards;
      const tax = subtotal * 0.1;
      const shipping = 15.00;
      const total = subtotal + tax + shipping;

      await new Promise((resolve, reject) => {
        const sql = `INSERT INTO orders (user_id, order_number, package_id, package_name, package_price, total_cards, subtotal, tax, shipping, total, status, payment_status, payment_method, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'stripe', datetime('now', '-${i} days'), datetime('now'))`;

        db.run(sql, [order.userId, orderNumber, order.packageId, order.packageName, order.packagePrice, order.totalCards, subtotal, tax, shipping, total, order.status, order.paymentStatus], function(err) {
          if (err) {
            reject(err);
          } else {
            const orderId = this.lastID;
            console.log(`  ✅ Created order ${orderNumber}: $${total.toFixed(2)} (${order.status})`);

            // Add order items
            const itemSql = `INSERT INTO order_items (order_id, card_name, card_game, quantity, unit_price, created_at)
                             VALUES (?, ?, ?, ?, ?, datetime('now'))`;

            db.run(itemSql, [orderId, 'Sample Card', 'Pokemon', order.totalCards, order.packagePrice], (err) => {
              if (err) console.error('    ⚠️  Error adding order items:', err.message);
              resolve();
            });
          }
        });
      });
    }

    console.log('\n💬 Adding 5 dummy support messages...');

    // 3. Check if support_messages table exists, if not create it
    await new Promise((resolve, reject) => {
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS support_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'open',
          priority TEXT DEFAULT 'normal',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `;

      db.run(createTableSql, (err) => {
        if (err) reject(err);
        else {
          console.log('  📋 Support messages table ready');
          resolve();
        }
      });
    });

    // Add 5 support messages
    const messages = [
      { userId: userIds[0].id, subject: 'Question about grading turnaround', message: 'How long does standard grading usually take?', status: 'open', priority: 'normal' },
      { userId: userIds[1].id, subject: 'Issue with my order', message: 'I haven\'t received tracking information yet.', status: 'in_progress', priority: 'high' },
      { userId: userIds[2].id, subject: 'Bulk grading inquiry', message: 'I have 100+ cards to grade. Do you offer volume discounts?', status: 'open', priority: 'normal' },
      { userId: userIds[3].id, subject: 'Card condition clarification', message: 'What\'s the difference between PSA 9 and PSA 10?', status: 'resolved', priority: 'low' },
      { userId: userIds[4].id, subject: 'Return shipping question', message: 'What shipping method do you use for returns?', status: 'open', priority: 'normal' }
    ];

    for (const msg of messages) {
      await new Promise((resolve, reject) => {
        const sql = `INSERT INTO support_messages (user_id, subject, message, status, priority, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;

        db.run(sql, [msg.userId, msg.subject, msg.message, msg.status, msg.priority], function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`  ✅ Created message: "${msg.subject}" (${msg.status})`);
            resolve();
          }
        });
      });
    }

    console.log('\n🎉 All dummy data added successfully!\n');
    console.log('Summary:');
    console.log('  ✅ 5 dummy users');
    console.log('  ✅ 5 dummy orders with items');
    console.log('  ✅ 5 dummy support messages\n');

  } catch (error) {
    console.error('❌ Error adding dummy data:', error);
  } finally {
    db.close();
  }
}

addDummyData();
