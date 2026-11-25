// catalog-service: read-only view of lab equipment for students.
// It never writes to the database; all changes go through admin-service.
const express = require("express");
const mysql = require("mysql2/promise");

const PORT = Number(process.env.PORT || 8080);
const pool = mysql.createPool({
  host: process.env.APP_DB_HOST || "localhost",
  port: Number(process.env.APP_DB_PORT || 3306),
  user: process.env.APP_DB_USER || "admin",
  password: process.env.APP_DB_PASSWORD || "",
  database: process.env.APP_DB_NAME || "equipment_loans",
  connectionLimit: 5,
  dateStrings: true,
});

// Students see availability, not who borrowed what.
const PUBLIC_COLUMNS = "id, asset_code, name, category, location, status, due_date";

async function listEquipment() {
  try {
    const [rows] = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM equipment ORDER BY id`);
    return rows;
  } catch (err) {
    // Table is created by admin-service on its first start.
    if (err.code === "ER_NO_SUCH_TABLE" || err.code === "ER_BAD_DB_ERROR") return [];
    throw err;
  }
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const app = express();

app.get("/health", (req, res) => res.json({ service: "catalog-service", status: "ok" }));

app.get("/api/equipment", async (req, res, next) => {
  try {
    res.json(await listEquipment());
  } catch (err) { next(err); }
});

app.get("/api/equipment/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM equipment WHERE id = ?`, [req.params.id]);
    rows[0] ? res.json(rows[0]) : res.status(404).json({ error: "Equipment not found" });
  } catch (err) { next(err); }
});

app.get("/", async (req, res, next) => {
  try {
    const items = await listEquipment();
    const available = items.filter((i) => i.status === "available").length;
    res.type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lab Equipment Catalog</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; background: #f5f6f8; color: #1d2330; }
  header { background: #232f3e; color: #fff; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
  header a { color: #ffb347; text-decoration: none; }
  main { max-width: 900px; margin: 24px auto; padding: 0 16px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  th, td { padding: 10px; border-bottom: 1px solid #eef0f3; text-align: left; font-size: 14px; }
  .status { padding: 2px 8px; border-radius: 10px; font-size: 12px; }
  .available { background: #dff3e4; } .borrowed { background: #ffe7c2; } .maintenance { background: #e3e6ea; }
</style></head>
<body>
<header><strong>Lab Equipment Catalog</strong><a href="/admin">Administrator link</a></header>
<main>
  <p>${available} of ${items.length} items available to borrow.</p>
  <table>
    <thead><tr><th>Asset</th><th>Name</th><th>Category</th><th>Location</th><th>Status</th><th>Due back</th></tr></thead>
    <tbody>${items.map((i) => `<tr><td>${esc(i.asset_code)}</td><td>${esc(i.name)}</td><td>${esc(i.category)}</td>
      <td>${esc(i.location)}</td><td><span class="status ${i.status}">${i.status}</span></td><td>${esc(i.due_date)}</td></tr>`).join("")
      || '<tr><td colspan="6">No equipment listed yet.</td></tr>'}</tbody>
  </table>
</main></body></html>`);
  } catch (err) { next(err); }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => console.log(`catalog-service listening on port ${PORT} (db host ${process.env.APP_DB_HOST || "localhost"})`));
