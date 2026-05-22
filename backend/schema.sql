-- Lelite Database Schema
-- Includes all table creations, procedures, and triggers (if any).
-- Note: Currently no procedures or triggers are used/defined in the project.

CREATE DATABASE IF NOT EXISTS `lelite_db`;
USE `lelite_db`;

-- 1. users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(15) DEFAULT NULL UNIQUE,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. bookings
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `booking_ref` VARCHAR(20) NOT NULL UNIQUE,
  `booking_date` DATE NOT NULL,
  `time_slot` VARCHAR(50) NOT NULL,
  `duration` INT DEFAULT 2,
  `guests` INT NOT NULL,
  `table_number` VARCHAR(50) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `adv_paid` DECIMAL(10,2) DEFAULT 0.00,
  `payment_verified` TINYINT(1) DEFAULT 0,
  `final_payment_verified` TINYINT(1) DEFAULT 0,
  `expected_amount` DECIMAL(10,2) DEFAULT 0.00,
  `bill_amount` DECIMAL(10,2) DEFAULT 0.00,
  `final_bill_expected` DECIMAL(10,2) DEFAULT NULL,
  `paid_amount` DECIMAL(10,2) DEFAULT 0.00,
  `discount` DECIMAL(10,2) DEFAULT 0.00,
  `utr_number` VARCHAR(50) DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'UPI',
  `staff_name` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2a. booking_history (for deleted/completed bookings)
CREATE TABLE IF NOT EXISTS `booking_history` (
  `id` INT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `booking_ref` VARCHAR(20) NOT NULL,
  `booking_date` DATE NOT NULL,
  `time_slot` VARCHAR(50) NOT NULL,
  `duration` INT DEFAULT 2,
  `guests` INT NOT NULL,
  `table_number` VARCHAR(50) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `adv_paid` DECIMAL(10,2) DEFAULT 0.00,
  `payment_verified` TINYINT(1) DEFAULT 0,
  `final_payment_verified` TINYINT(1) DEFAULT 0,
  `expected_amount` DECIMAL(10,2) DEFAULT 0.00,
  `bill_amount` DECIMAL(10,2) DEFAULT 0.00,
  `final_bill_expected` DECIMAL(10,2) DEFAULT NULL,
  `paid_amount` DECIMAL(10,2) DEFAULT 0.00,
  `discount` DECIMAL(10,2) DEFAULT 0.00,
  `utr_number` VARCHAR(50) DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'UPI',
  `staff_name` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `archived_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- NOTE ON TRIGGERS/PROCEDURES:
-- Due to limitations in TiDB / Vitess (often used in cloud DBs), 
-- 'CALL delete_booking()' or triggers like 'AFTER DELETE ON bookings' 
-- throw 'Unsupported type *resolve.NodeW' errors.
-- We handle the creation and deletion logic securely at the application level in app.js instead.

-- 3. dishes
CREATE TABLE IF NOT EXISTS `dishes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `category` ENUM('Starter', 'Main Course', 'Dessert', 'Drinks') NOT NULL,
  `image` TEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `type` VARCHAR(50) DEFAULT 'veg',
  `is_available` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `dish_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `price_at_order` DECIMAL(10,2) NOT NULL,
  `total_price` DECIMAL(10,2) NOT NULL,
  `order_status` VARCHAR(50) DEFAULT 'ordered',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `method` VARCHAR(50) DEFAULT 'UPI',
  `status` VARCHAR(50) DEFAULT 'pending',
  `transaction_id` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. staff
CREATE TABLE IF NOT EXISTS `staff` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `staff_id` VARCHAR(20) UNIQUE DEFAULT NULL,
  `name` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. monitor_logs
CREATE TABLE IF NOT EXISTS `monitor_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event` VARCHAR(255) DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. restaurant_tables
CREATE TABLE IF NOT EXISTS `restaurant_tables` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `table_name` VARCHAR(50) NOT NULL,
  `capacity` INT NOT NULL,
  `status` ENUM('available','occupied') DEFAULT 'available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. warehouse
CREATE TABLE IF NOT EXISTS `warehouse` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `type` ENUM('grocery', 'commodity', 'utility') NOT NULL,
  `quantity` DECIMAL(10,2) DEFAULT 0,
  `unit` VARCHAR(50) DEFAULT NULL,
  `cost` DECIMAL(10,2) NOT NULL,
  `date` DATE NOT NULL,
  `added_by` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. messages (Chat)
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `sender` ENUM('user', 'admin') NOT NULL,
  `message` TEXT NOT NULL,
  `time` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
