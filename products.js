const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Every route below requires a valid login.
router.use(requireAuth);

// GET /api/products — list all, newest first
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM products ORDER BY date_stored DESC").all();
  res.json(rows);
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Product not found." });
  res.json(row);
});

// POST /api/products — create
router.post("/", (req, res) => {
  const { code, name, category, quantity, price, supplier, location, low_stock_limit } = req.body;

  if (!code || !name || !category || !supplier || !location) {
    return res.status(400).json({ error: "Please fill all required fields." });
  }
  const qty = Number(quantity);
  const prc = Number(price);
  if (!(qty > 0)) return res.status(400).json({ error: "Quantity must be greater than zero." });
  if (!(prc >= 0)) return res.status(400).json({ error: "Price cannot be negative." });

  const duplicate = db.prepare("SELECT id FROM products WHERE code = ?").get(code.trim());
  if (duplicate) return res.status(409).json({ error: "This product code already exists." });

  const result = db
    .prepare(`
      INSERT INTO products (code, name, category, quantity, price, supplier, location, low_stock_limit, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      code.trim(),
      name.trim(),
      category,
      qty,
      prc,
      supplier.trim(),
      location.trim(),
      Number(low_stock_limit) || 5,
      req.user.id
    );

  const created = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/products/:id — update
router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found." });

  const { code, name, category, quantity, price, supplier, location, low_stock_limit } = req.body;

  if (!code || !name || !category || !supplier || !location) {
    return res.status(400).json({ error: "Please fill all required fields." });
  }
  const qty = Number(quantity);
  const prc = Number(price);
  if (!(qty > 0)) return res.status(400).json({ error: "Quantity must be greater than zero." });
  if (!(prc >= 0)) return res.status(400).json({ error: "Price cannot be negative." });

  const duplicate = db
    .prepare("SELECT id FROM products WHERE code = ? AND id != ?")
    .get(code.trim(), req.params.id);
  if (duplicate) return res.status(409).json({ error: "This product code already exists." });

  db.prepare(`
    UPDATE products
    SET code = ?, name = ?, category = ?, quantity = ?, price = ?, supplier = ?, location = ?,
        low_stock_limit = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    code.trim(),
    name.trim(),
    category,
    qty,
    prc,
    supplier.trim(),
    location.trim(),
    Number(low_stock_limit) || 5,
    req.params.id
  );

  const updated = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// DELETE /api/products/:id
router.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found." });

  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  res.status(204).send();
});

// DELETE /api/products — delete all (admin only, since it's destructive)
router.delete("/", (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only an admin can delete all products." });
  }
  db.prepare("DELETE FROM products").run();
  res.status(204).send();
});

module.exports = router;
