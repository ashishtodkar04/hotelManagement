const MonitorLogSchema = {
  tableName: 'monitor_logs',
  columns: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    event: 'VARCHAR(255) DEFAULT NULL',
    details: 'TEXT DEFAULT NULL',
    timestamp: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

module.exports = MonitorLogSchema;
