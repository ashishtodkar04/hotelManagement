const BookingSchema = {
  tableName: 'bookings',
  columns: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    user_id: 'INT NOT NULL',
    booking_ref: 'VARCHAR(20) NOT NULL UNIQUE',
    booking_date: 'DATE NOT NULL',
    time_slot: 'VARCHAR(50) NOT NULL',
    duration: 'INT DEFAULT 2',
    guests: 'INT NOT NULL',
    table_number: 'VARCHAR(50) DEFAULT NULL',
    status: 'VARCHAR(50) DEFAULT "pending"',
    adv_paid: 'DECIMAL(10,2) DEFAULT 0.00',
    payment_verified: 'TINYINT(1) DEFAULT 0',
    final_payment_verified: 'TINYINT(1) DEFAULT 0',
    expected_amount: 'DECIMAL(10,2) DEFAULT 0.00',
    bill_amount: 'DECIMAL(10,2) DEFAULT 0.00',
    paid_amount: 'DECIMAL(10,2) DEFAULT 0.00',
    discount: 'DECIMAL(10,2) DEFAULT 0.00',
    utr_number: 'VARCHAR(50) DEFAULT NULL',
    payment_method: 'VARCHAR(50) DEFAULT "UPI"',
    staff_name: 'VARCHAR(100) DEFAULT NULL',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

module.exports = BookingSchema;
