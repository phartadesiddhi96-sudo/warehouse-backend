const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  // First registered user becomes admin; everyone after is regular staff.
  // Admins can be promoted later directly in the database if needed.
  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  const role = userCount === 0 ? "admin" : "staff";

  const passwordHash = bcrypt.hashSync(password, 10);

  const result = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)")
    .run(name.trim(), email.trim().toLowerCase(), passwordHash, role);

  const user = { id: result.lastInsertRowid, name: name.trim(), email: email.trim().toLowerCase(), role };
  const token = signToken(user);

  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// GET /api/auth/me — quick way for the frontend to validate a stored token
router.get("/me", require("../middleware/auth").requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
