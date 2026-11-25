// admin-service: read-write API for lab staff (laboran).
// Every route lives under /admin so a load balancer can route /admin/*
// to this service and everything else to catalog-service.
const express = require("express");
const db = require("./db");
const equipment = require("./equipment");
const page = require("./page");

const app = express();
const PORT = Number(process.env.PORT || 8080);
const router = express.Router();

app.use(express.json());

router.get("/health", (req, res) => res.json({ service: "admin-service", status: "ok" }));

router.get("/", (req, res) => res.type("html").send(page()));

// CRUD endpoints for the equipment entity
router.post("/api/equipment", async (req, res, next) => {
  try {
    res.status(201).json(await equipment.create(req.body));
  } catch (err) { next(err); }
});

router.get("/api/equipment", async (req, res, next) => {
  try {
    res.json(await equipment.list());
  } catch (err) { next(err); }
});

router.get("/api/equipment/:id", async (req, res, next) => {
  try {
    const item = await equipment.get(req.params.id);
    item ? res.json(item) : res.status(404).json({ error: "Equipment not found" });
  } catch (err) { next(err); }
});

router.put("/api/equipment/:id", async (req, res, next) => {
  try {
    const item = await equipment.update(req.params.id, req.body);
    item ? res.json(item) : res.status(404).json({ error: "Equipment not found" });
  } catch (err) { next(err); }
});

router.delete("/api/equipment/:id", async (req, res, next) => {
  try {
    (await equipment.remove(req.params.id))
      ? res.status(204).end()
      : res.status(404).json({ error: "Equipment not found" });
  } catch (err) { next(err); }
});

app.use("/admin", router);
app.get("/", (req, res) => res.redirect("/admin"));

app.use((err, req, res, next) => {
  if (err instanceof equipment.ValidationError) return res.status(400).json({ error: err.message });
  if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "asset_code already exists" });
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  for (let attempt = 1; ; attempt++) {
    try {
      await db.init();
      break;
    } catch (err) {
      console.error(`DB connection failed (attempt ${attempt}): ${err.message}`);
      if (attempt >= 10) process.exit(1);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  app.listen(PORT, () => console.log(`admin-service listening on port ${PORT} (db host ${db.config.host})`));
}

start();
