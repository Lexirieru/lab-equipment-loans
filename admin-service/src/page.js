// Minimal admin UI. It calls the JSON API with fetch, so every button
// press exercises one of the four CRUD endpoints.
module.exports = () => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lab Equipment Loans | Admin</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; background: #f5f6f8; color: #1d2330; }
  header { background: #1d2330; color: #fff; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
  header a { color: #ffb347; text-decoration: none; }
  main { max-width: 1000px; margin: 24px auto; padding: 0 16px; }
  form, table { background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  form { padding: 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  input, select, button { padding: 8px; font-size: 14px; border: 1px solid #cfd4dc; border-radius: 6px; }
  button { background: #ff9900; border: none; color: #1d2330; font-weight: 600; cursor: pointer; }
  button.secondary { background: #e6e9ee; }
  button.danger { background: #d9534f; color: #fff; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 10px; border-bottom: 1px solid #eef0f3; text-align: left; font-size: 14px; }
  .status { padding: 2px 8px; border-radius: 10px; font-size: 12px; }
  .available { background: #dff3e4; } .borrowed { background: #ffe7c2; } .maintenance { background: #e3e6ea; }
  #msg { min-height: 20px; margin-bottom: 10px; }
</style>
</head>
<body>
<header><strong>Lab Equipment Loans: Admin</strong><a href="/">Catalog (student view)</a></header>
<main>
  <div id="msg"></div>
  <form id="form">
    <input type="hidden" name="id">
    <input name="asset_code" placeholder="Asset code (e.g. OSC-001)" required>
    <input name="name" placeholder="Name" required>
    <input name="category" placeholder="Category">
    <input name="location" placeholder="Location">
    <select name="status">
      <option value="available">available</option>
      <option value="borrowed">borrowed</option>
      <option value="maintenance">maintenance</option>
    </select>
    <input name="borrower_name" placeholder="Borrower (if borrowed)">
    <input name="due_date" type="date">
    <span><button type="submit" id="save">Create</button> <button type="button" class="secondary" id="reset">Clear</button></span>
  </form>
  <table>
    <thead><tr><th>ID</th><th>Asset</th><th>Name</th><th>Category</th><th>Location</th><th>Status</th><th>Borrower</th><th>Due</th><th></th></tr></thead>
    <tbody id="rows"></tbody>
  </table>
</main>
<script>
const api = "/admin/api/equipment";
const form = document.getElementById("form");
const msg = (t, ok = true) => { const m = document.getElementById("msg"); m.textContent = t; m.style.color = ok ? "#2e7d32" : "#c62828"; };
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function load() {
  const items = await (await fetch(api)).json();
  document.getElementById("rows").innerHTML = items.map((i) => \`
    <tr><td>\${i.id}</td><td>\${esc(i.asset_code)}</td><td>\${esc(i.name)}</td><td>\${esc(i.category)}</td>
    <td>\${esc(i.location)}</td><td><span class="status \${i.status}">\${i.status}</span></td>
    <td>\${esc(i.borrower_name)}</td><td>\${esc(i.due_date)}</td>
    <td><button class="secondary" onclick="edit(\${i.id})">Edit</button>
        <button class="danger" onclick="del(\${i.id})">Delete</button></td></tr>\`).join("");
}

async function edit(id) {
  const item = await (await fetch(api + "/" + id)).json();
  for (const el of form.elements) if (el.name) el.value = item[el.name] ?? "";
  document.getElementById("save").textContent = "Update #" + id;
}

async function del(id) {
  const res = await fetch(api + "/" + id, { method: "DELETE" });
  res.ok ? msg("Deleted #" + id) : msg((await res.json()).error, false);
  load();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(form));
  const id = body.id; delete body.id;
  const res = await fetch(id ? api + "/" + id : api, {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = res.status === 204 ? {} : await res.json();
  if (!res.ok) return msg(data.error, false);
  msg((id ? "Updated #" : "Created #") + data.id);
  form.reset(); form.elements.id.value = ""; document.getElementById("save").textContent = "Create";
  load();
});

document.getElementById("reset").onclick = () => { form.reset(); form.elements.id.value = ""; document.getElementById("save").textContent = "Create"; };
load();
</script>
</body>
</html>`;
