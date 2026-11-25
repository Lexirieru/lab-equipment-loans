// Database access for the admin-service (read-write).
// Connection settings come from environment variables so the same image
// runs against a MySQL container on EC2 or an Amazon RDS endpoint.
const mysql = require("mysql2/promise");

const config = {
  host: process.env.APP_DB_HOST || "localhost",
  port: Number(process.env.APP_DB_PORT || 3306),
  user: process.env.APP_DB_USER || "admin",
  password: process.env.APP_DB_PASSWORD || "",
  database: process.env.APP_DB_NAME || "equipment_loans",
};

let pool;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS equipment (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  asset_code    VARCHAR(32)  NOT NULL UNIQUE,
  name          VARCHAR(120) NOT NULL,
  category      VARCHAR(60)  NOT NULL DEFAULT 'General',
  location      VARCHAR(80)  NOT NULL DEFAULT 'Lab',
  status        ENUM('available','borrowed','maintenance') NOT NULL DEFAULT 'available',
  borrower_name VARCHAR(120) NULL,
  due_date      DATE NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

// Creates the database and table on first start, so a fresh RDS instance
// or MySQL container needs no manual SQL.
async function init() {
  const { database, ...serverConfig } = config;
  const conn = await mysql.createConnection(serverConfig);
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await conn.end();

  pool = mysql.createPool({ ...config, connectionLimit: 5, dateStrings: true });
  await pool.query(SCHEMA);
}

function getPool() {
  if (!pool) throw new Error("Database not initialised");
  return pool;
}

module.exports = { init, getPool, config };
