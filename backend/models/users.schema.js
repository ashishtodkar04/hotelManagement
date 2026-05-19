const db = require('../config/db');
const mysql = require('mysql2');



const UserSchema = {
    tableName: 'users',
    columns: {
        id: 'INT AUTO_INCREMENT PRIMARY KEY',
        name: 'VARCHAR(100) NOT NULL',
        email: 'VARCHAR(150) NOT NULL UNIQUE',
        username: 'VARCHAR(50) NOT NULL UNIQUE',
        password: 'VARCHAR(255) NOT NULL',
        phone: 'VARCHAR(15) DEFAULT NULL UNIQUE',
        created_at: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
    }
};



module.exports = UserSchema;