const db = require('../config/db');
const users = require('./users.schema.js');
const bookings = require('./bookings.schema.js');
const dishes = require('./dishes.schema.js');
const orders = require('./orders.schema.js');
const payments = require('./payments.schema.js');
const staff = require('./staff.schema.js');
const monitor_logs = require('./monitor_logs.schema.js');
const restaurant_tables = require('./restaurant_tables.schema.js');
const warehouse = require('./warehouse.schema.js');

const schemas = [
  users,
  bookings,
  dishes,
  orders,
  payments,
  staff,
  monitor_logs,
  restaurant_tables,
  warehouse
];

async function syncDatabase() {
  console.log('--- Starting Database Sync ---');
  for (const schema of schemas) {
    const { tableName, columns } = schema;
    const columnDefinitions = Object.entries(columns)
      .map(([name, type]) => `\`${name}\` ${type}`)
      .join(', ');

    const query = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (${columnDefinitions}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    
    try {
      await db.execute(query);
      console.log(`✅ Table "${tableName}" is synced.`);
    } catch (err) {
      console.error(`❌ Error syncing table "${tableName}":`, err.message);
    }
  }
  console.log('--- Database Sync Complete ---');
}

module.exports = {
  syncDatabase,
  users,
  bookings,
  dishes,
  orders,
  payments,
  staff,
  monitor_logs,
  restaurant_tables
};
