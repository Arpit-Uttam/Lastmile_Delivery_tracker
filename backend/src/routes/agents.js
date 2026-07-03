const express = require("express");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get the calling agent's own profile (agent only)
router.get("/me", authenticate, authorize("AGENT"), async (req, res, next) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
        agentZones: { include: { zone: true } },
        orders: {
          select: { id: true, status: true },
        },
      },
    });
    if (!agent) return res.status(404).json({ error: "Agent record not found" });
    res.json(agent);
  } catch (err) { next(err); }
});

// List all agents (admin)
router.get("/", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        agentZones: { include: { zone: true } },
      },
    });
    res.json(agents);
  } catch (err) { next(err); }
});

// Create agent user + agent record (admin only)
router.post("/", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const { name, email, phone, password, zoneIds, latitude, longitude } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, phone, password: hashed, role: "AGENT" },
    });

    const agent = await prisma.agent.create({
      data: {
        userId: user.id,
        latitude: latitude || null,
        longitude: longitude || null,
        agentZones: zoneIds ? { create: zoneIds.map((zoneId) => ({ zoneId })) } : undefined,
      },
      include: { user: { select: { id: true, name: true, email: true } }, agentZones: { include: { zone: true } } },
    });

    res.status(201).json(agent);
  } catch (err) { next(err); }
});

// Update agent location / status (agent updates own; admin updates any)
router.patch("/:id", authenticate, async (req, res, next) => {
  try {
    const { latitude, longitude, status } = req.body;
    const agent = await prisma.agent.findUnique({ where: { id: req.params.id }, include: { user: true } });
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    // Agent can only update their own record
    if (req.user.role === "AGENT" && agent.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const data = {};
    if (latitude !== undefined) data.latitude = latitude;
    if (longitude !== undefined) data.longitude = longitude;
    if (status && req.user.role === "ADMIN") data.status = status;

    const updated = await prisma.agent.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err) { next(err); }
});

// Assign zones to agent (admin)
router.post("/:id/zones", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const { zoneIds } = req.body;
    if (!Array.isArray(zoneIds)) return res.status(400).json({ error: "zoneIds array required" });

    // Remove existing and recreate
    await prisma.agentZone.deleteMany({ where: { agentId: req.params.id } });
    await prisma.agentZone.createMany({
      data: zoneIds.map((zoneId) => ({ agentId: req.params.id, zoneId })),
      skipDuplicates: true,
    });
    res.json({ message: "Zones updated" });
  } catch (err) { next(err); }
});

module.exports = router;
