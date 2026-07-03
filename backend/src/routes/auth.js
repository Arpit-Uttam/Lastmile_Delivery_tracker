const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Register (customer self-registration only — agents created by admin, admins via seed)
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });

    // Prevent length-based attacks
    if (name.length > 100)     return res.status(400).json({ error: "Name too long" });
    if (email.length > 255)    return res.status(400).json({ error: "Email too long" });
    if (password.length < 6)   return res.status(400).json({ error: "Password must be at least 6 characters" });
    if (password.length > 128) return res.status(400).json({ error: "Password too long" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, phone: phone || null, password: hashed, role: "CUSTOMER" },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    res.status(201).json({ user });
  } catch (err) { next(err); }
});

// Login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

// Get current user profile
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (err) { next(err); }
});

// Update current user profile (name, phone, password)
router.patch("/me", authenticate, async (req, res, next) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    const data = {};

    if (name !== undefined) {
      if (!name.trim())          return res.status(400).json({ error: "Name cannot be empty" });
      if (name.length > 100)     return res.status(400).json({ error: "Name too long" });
      data.name = name.trim();
    }

    if (phone !== undefined) {
      data.phone = phone ? phone.trim() : null;
    }

    // Password change — requires current password verification
    if (newPassword !== undefined) {
      if (!currentPassword) return res.status(400).json({ error: "currentPassword is required to set a new password" });
      if (newPassword.length < 6)   return res.status(400).json({ error: "New password must be at least 6 characters" });
      if (newPassword.length > 128) return res.status(400).json({ error: "New password too long" });

      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: "Current password is incorrect" });

      data.password = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    res.json({ user: updated, message: "Profile updated successfully" });
  } catch (err) { next(err); }
});

module.exports = router;
