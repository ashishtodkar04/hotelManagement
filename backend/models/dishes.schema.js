const DishSchema = {
  tableName: 'dishes',
  columns: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    name: 'VARCHAR(200) NOT NULL',
    price: 'DECIMAL(10,2) NOT NULL',
    category: "ENUM('Starter', 'Main Course', 'Dessert', 'Drinks') NOT NULL",
    image: 'TEXT DEFAULT NULL',
    description: 'TEXT DEFAULT NULL',
    type: 'VARCHAR(50) DEFAULT "veg"',
    is_available: 'TINYINT(1) DEFAULT 1'
  }
};

module.exports = DishSchema;
