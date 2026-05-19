const RestaurantTableSchema = {
  tableName: 'restaurant_tables',
  columns: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    table_name: 'VARCHAR(50) NOT NULL',
    capacity: 'INT NOT NULL',
    status: "ENUM('available','occupied') DEFAULT 'available'"
  }
};

module.exports = RestaurantTableSchema;
