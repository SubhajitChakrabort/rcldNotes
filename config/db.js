const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully! ✨');
    console.log(`Connected as ID: ${connection.threadId}`);
    connection.release();
  })
  .catch(error => {
    console.log('Database connection failed! ❌');
    console.log('Error:', error.message);
  });

module.exports = pool;
