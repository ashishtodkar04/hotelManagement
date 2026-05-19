const PaymentSchema = {
  tableName: 'payments',
  columns: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    booking_id: 'INT NOT NULL',
    amount: 'DECIMAL(10,2) NOT NULL',
    method: 'VARCHAR(50) DEFAULT "UPI"',
    status: 'VARCHAR(50) DEFAULT "pending"',
    transaction_id: 'VARCHAR(100) DEFAULT NULL',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

module.exports = PaymentSchema;
