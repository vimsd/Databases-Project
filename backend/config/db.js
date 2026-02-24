const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD, // บรรทัดนี้สำคัญมาก
    database: process.env.DB_NAME || 'cinema_db',
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool.promise();