const StaffSchema = {
  tableName: 'staff',
  columns: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    staff_id: 'VARCHAR(20) UNIQUE DEFAULT NULL',
    name: 'VARCHAR(100) DEFAULT NULL',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

module.exports = StaffSchema;
