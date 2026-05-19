const OrderSchema = {
  tableName: 'orders',
  columns: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    booking_id: 'INT NOT NULL',
    dish_id: 'INT NOT NULL',
    quantity: 'INT NOT NULL',
    price_at_order: 'DECIMAL(10,2) NOT NULL',
    total_price: 'DECIMAL(10,2) NOT NULL',
    order_status: 'VARCHAR(50) DEFAULT "ordered"',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

module.exports = OrderSchema;
