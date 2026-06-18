const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'docvalidation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  let retries = 15;
  while (retries > 0) {
    try {
      const conn = await pool.getConnection();
      console.log('Base de datos conectada correctamente.');
      conn.release();
      return;
    } catch (err) {
      retries--;
      console.log(`Esperando la base de datos... (${retries} intentos restantes)`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error('No se pudo conectar a la base de datos después de varios intentos.');
}

module.exports = { pool, testConnection };
