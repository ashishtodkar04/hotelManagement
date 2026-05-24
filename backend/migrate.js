/**
 * Migration: Add missing columns to existing tables
 * Run: node backend/migrate.js
 * Safe to run multiple times — uses ALTER TABLE IF NOT EXISTS logic.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
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

  // --- booking_history ---
  await alter(`
    CREATE TABLE IF NOT EXISTS booking_history (
      id INT PRIMARY KEY,
      user_id INT NOT NULL,
      booking_ref VARCHAR(20) NOT NULL,
      booking_date DATE NOT NULL,
      time_slot VARCHAR(50) NOT NULL,
      duration INT DEFAULT 2,
      guests INT NOT NULL,
      table_number VARCHAR(50) DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      adv_paid DECIMAL(10,2) DEFAULT 0.00,
      payment_verified TINYINT(1) DEFAULT 0,
      final_payment_verified TINYINT(1) DEFAULT 0,
      expected_amount DECIMAL(10,2) DEFAULT 0.00,
      bill_amount DECIMAL(10,2) DEFAULT 0.00,
      final_bill_expected DECIMAL(10,2) DEFAULT NULL,
      paid_amount DECIMAL(10,2) DEFAULT 0.00,
      discount DECIMAL(10,2) DEFAULT 0.00,
      utr_number VARCHAR(50) DEFAULT NULL,
      payment_method VARCHAR(50) DEFAULT 'UPI',
      staff_name VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, 'booking_history table');


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
      stock_status ENUM('in_stock','low_stock','out_of_stock') DEFAULT 'in_stock',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, 'warehouse table');
  await alter(`ALTER TABLE warehouse ADD COLUMN stock_status ENUM('in_stock','low_stock','out_of_stock') DEFAULT 'in_stock'`, 'warehouse.stock_status');

  // --- restaurant_tables ---
  await alter(`
    CREATE TABLE IF NOT EXISTS restaurant_tables (
      id INT AUTO_INCREMENT PRIMARY KEY,
      table_name VARCHAR(50) NOT NULL,
      capacity INT NOT NULL,
      status ENUM('available','occupied') DEFAULT 'available'
    )
  `, 'restaurant_tables table');

  // --- staff ---
  await alter(`ALTER TABLE staff ADD COLUMN salary DECIMAL(10,2) DEFAULT 0.00`, 'staff.salary');

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
  await alter(`ALTER TABLE messages ADD COLUMN is_read TINYINT(1) DEFAULT 0`, 'messages.is_read');
  await alter(`ALTER TABLE users ADD COLUMN is_banned TINYINT(1) DEFAULT 0`, 'users.is_banned');

  // --- inventory_items ---
  await alter(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      current_stock DECIMAL(10,2) DEFAULT 0.00,
      low_stock_threshold DECIMAL(10,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, 'inventory_items table');

  // --- dish_recipe ---
  await alter(`
    CREATE TABLE IF NOT EXISTS dish_recipe (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dish_id INT NOT NULL,
      inventory_item_id INT NOT NULL,
      quantity_deducted DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
      FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
    )
  `, 'dish_recipe table');

  console.log('\n🎉 Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration crashed:', err);
  process.exit(1);
});
