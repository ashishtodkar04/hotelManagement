const mysql = require("mysql2");

const db = mysql.createPool({
   host: process.env.DB_HOST,
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   database: process.env.DB_NAME,
   port: process.env.DB_PORT,

   ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false
   },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('DB CONNECTION ERROR:', err.message);
    } else {
        console.log('DB Connected Successfully');
        connection.release();
    }
});

module.exports = db.promise();
