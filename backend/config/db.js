const mysql = require('mysql2');

const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ashish07',
    database: process.env.DB_NAME || 'hotel',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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
