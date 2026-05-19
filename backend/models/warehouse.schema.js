const WarehouseSchema = {
  tableName: 'warehouse',
  columns: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    name: 'VARCHAR(200) NOT NULL',
    type: "ENUM('grocery', 'commodity', 'utility') NOT NULL",
    quantity: 'DECIMAL(10,2) DEFAULT 0',
    unit: 'VARCHAR(50) DEFAULT NULL',
    cost: 'DECIMAL(10,2) NOT NULL',
    date: 'DATE NOT NULL',
    added_by: 'VARCHAR(100) DEFAULT NULL',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

module.exports = WarehouseSchema;
