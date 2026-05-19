/**
 * Migration: Add missing columns to existing tables
 * Run: node backend/migrate.js
 * Safe to run multiple times — uses ALTER TABLE IF NOT EXISTS logic.
 */
const db = require('./config/db');

const { HOTEL_NAME } = require('./config/hotel');

async function migrate() {
  console.log(`🔄 Running ${HOTEL_NAME} DB Migrations...\n`);
  
  const alter = async (sql, description) => {
    try {
      await db.execute(sql);
      console.log(`✅ ${description}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Duplicate column name') || err.message.includes('already exists')) {
        console.log(`⏭️  SKIP (already exists): ${description}`);
      } else {
        console.error(`❌ FAILED: ${description}\n   Error: ${err.message}`);
      }
    }
  };

  // --- bookings ---
  await alter(`ALTER TABLE bookings ADD COLUMN final_bill_expected DECIMAL(10,2) DEFAULT NULL`, 'bookings.final_bill_expected');
  await alter(`ALTER TABLE bookings ADD COLUMN final_payment_verified TINYINT(1) DEFAULT 0`, 'bookings.final_payment_verified');
  await alter(`ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(30) DEFAULT NULL`, 'bookings.payment_method');
  await alter(`ALTER TABLE bookings ADD COLUMN payment_verified TINYINT(1) DEFAULT 0`, 'bookings.payment_verified');
  await alter(`ALTER TABLE bookings ADD COLUMN utr_number VARCHAR(50) DEFAULT NULL`, 'bookings.utr_number');
  await alter(`ALTER TABLE bookings ADD COLUMN expected_amount DECIMAL(10,2) DEFAULT 0.00`, 'bookings.expected_amount');
  await alter(`ALTER TABLE bookings ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00`, 'bookings.discount');
  await alter(`ALTER TABLE bookings ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0.00`, 'bookings.paid_amount');
  await alter(`ALTER TABLE bookings ADD COLUMN adv_paid DECIMAL(10,2) DEFAULT 0.00`, 'bookings.adv_paid');
  await alter(`ALTER TABLE bookings ADD COLUMN staff_name VARCHAR(100) DEFAULT NULL`, 'bookings.staff_name');

  // --- dishes ---
  await alter(`ALTER TABLE dishes ADD COLUMN description TEXT`, 'dishes.description');
  await alter(`ALTER TABLE dishes ADD COLUMN type VARCHAR(20) DEFAULT 'veg'`, 'dishes.type');
  await alter(`ALTER TABLE dishes MODIFY COLUMN image TEXT`, 'dishes.image → TEXT');
  await alter(`ALTER TABLE dishes MODIFY COLUMN category ENUM('Starter', 'Main Course', 'Dessert', 'Drinks') NOT NULL`, 'dishes.category → ENUM');

  // --- warehouse ---
  await alter(`
    CREATE TABLE IF NOT EXISTS warehouse (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type ENUM('grocery', 'commodity', 'utility') NOT NULL,
      quantity DECIMAL(10,2) DEFAULT 0,
      unit VARCHAR(50) DEFAULT NULL,
      cost DECIMAL(10,2) NOT NULL,
      date DATE NOT NULL,
      added_by VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, 'warehouse table');

  // --- restaurant_tables ---
  await alter(`
    CREATE TABLE IF NOT EXISTS restaurant_tables (
      id INT AUTO_INCREMENT PRIMARY KEY,
      table_name VARCHAR(50) NOT NULL,
      capacity INT NOT NULL,
      status ENUM('available','occupied') DEFAULT 'available'
    )
  `, 'restaurant_tables table');

  // --- payments ---
  await alter(`ALTER TABLE payments ADD COLUMN method VARCHAR(50) DEFAULT 'UPI'`, 'payments.method');

  // --- messages (Chat) ---
  await alter(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      user_name VARCHAR(100) NOT NULL,
      sender ENUM('user', 'admin') NOT NULL,
      message TEXT NOT NULL,
      time VARCHAR(20) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, 'messages table');

  console.log('\n🎉 Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration crashed:', err);
  process.exit(1);
});
