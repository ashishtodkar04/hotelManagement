const mysql = require("mysql2");

const sslConfig = {
   minVersion: 'TLSv1.2',
   rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true
};

const dbConfig = {
   host: process.env.DB_HOST,
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   database: process.env.DB_NAME,
   port: process.env.DB_PORT || 4000,
   ssl: sslConfig,
   waitForConnections: true,
   connectionLimit: 10,
   queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test the connection on startup and provide highly detailed diagnostic tips
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ DATABASE CONNECTION ERROR:', err.message);
        console.error('Error Code:', err.code);
        console.error('Error Number:', err.errno);
        console.error('SQL State:', err.sqlState);

        if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.message.includes('timeout')) {
            console.error('\n========================================================================');
            console.error('⚠️  DIAGNOSTIC: CONNECTION TIMEOUT / REFUSED');
            console.error('This usually means TiDB Cloud is blocking connections from this server IP.');
            console.error('For Render production deployments, you MUST allow access from any IP:');
            console.error('1. Go to your TiDB Cloud Console (https://tidbcloud.com)');
            console.error('2. Navigate to your Cluster -> Security -> IP Access Rules');
            console.error('3. Add "0.0.0.0/0" as an access rule to allow Render\'s dynamic IPs.');
            console.error('========================================================================\n');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n========================================================================');
            console.error('⚠️  DIAGNOSTIC: ACCESS DENIED');
            console.error('Please verify your DB_USER, DB_PASSWORD, and DB_NAME in your environment variables.');
            console.error('========================================================================\n');
        } else if (err.message.includes('validation') || err.message.includes('CA') || err.message.includes('cert') || err.message.includes('unable to verify')) {
            console.error('\n========================================================================');
            console.error('⚠️  DIAGNOSTIC: SSL CERTIFICATE ERROR');
            console.error('If the production environment fails to verify TiDB Cloud\'s SSL certificate,');
            console.error('you can set the environment variable: DB_SSL_REJECT_UNAUTHORIZED=false');
            console.error('========================================================================\n');
        }
    } else {
        console.log('✅ DB Connected Successfully');
        connection.release();
    }
});

module.exports = pool.promise();
