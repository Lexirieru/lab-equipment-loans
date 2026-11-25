// Equipment entity: validation and CRUD queries.
const { getPool } = require("./db");

const STATUSES = ["available", "borrowed", "maintenance"];
const FIELDS = ["asset_code", "name", "category", "location", "status", "borrower_name", "due_date"];

class ValidationError extends Error {}

function clean(input, { partial = false } = {}) {
  const data = {};
  for (const f of FIELDS) {
    if (input[f] === undefined) continue;
    const v = typeof input[f] === "string" ? input[f].trim() : input[f];
    data[f] = v === "" ? null : v;
  }

  if (!partial) {
    if (!data.asset_code) throw new ValidationError("asset_code is required");
    if (!data.name) throw new ValidationError("name is required");
  }
  // Blank optional fields fall back to the column defaults instead of NULL.
  if (!data.category) data.category = "General";
  if (!data.location) data.location = "Lab";
  if (!data.status) data.status = "available";
  if (data.status !== undefined && data.status !== null && !STATUSES.includes(data.status)) {
    throw new ValidationError(`status must be one of: ${STATUSES.join(", ")}`);
  }
  if (data.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.due_date)) {
    throw new ValidationError("due_date must use YYYY-MM-DD");
  }
  if (data.status === "borrowed" && !data.borrower_name) {
    throw new ValidationError("borrower_name is required when status is borrowed");
  }
  // Returning an item clears the loan details.
  if (data.status === "available" || data.status === "maintenance") {
    data.borrower_name = null;
    data.due_date = null;
  }
  return data;
}

async function list() {
  const [rows] = await getPool().query("SELECT * FROM equipment ORDER BY id");
  return rows;
}

async function get(id) {
  const [rows] = await getPool().query("SELECT * FROM equipment WHERE id = ?", [id]);
  return rows[0] || null;
}

async function create(input) {
  const data = clean(input);
  const [result] = await getPool().query("INSERT INTO equipment SET ?", [data]);
  return get(result.insertId);
}

async function update(id, input) {
  const existing = await get(id);
  if (!existing) return null;
  const data = clean({ ...existing, ...input });
  await getPool().query("UPDATE equipment SET ? WHERE id = ?", [data, id]);
  return get(id);
}

async function remove(id) {
  const [result] = await getPool().query("DELETE FROM equipment WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = { list, get, create, update, remove, ValidationError, STATUSES };
