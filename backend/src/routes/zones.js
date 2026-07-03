const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get all zones (all authenticated users)
router.get("/", authenticate, async (req, res, next) => {
  try {
    const zones = await prisma.zone.findMany({ include: { areas: true } });
    res.json(zones);
  } catch (err) { next(err); }
});

// Create zone (admin only)
router.post("/", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    const zone = await prisma.zone.create({ data: { name } });
    res.status(201).json(zone);
  } catch (err) { next(err); }
});

// Delete zone (admin only)
router.delete("/:id", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    await prisma.zone.delete({ where: { id: req.params.id } });
    res.json({ message: "Zone deleted" });
  } catch (err) { next(err); }
});

// Add area to zone (admin only)
router.post("/:id/areas", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const { name, pincode } = req.body;
    if (!name || !pincode) return res.status(400).json({ error: "name and pincode required" });
    const area = await prisma.area.create({ data: { name, pincode, zoneId: req.params.id } });
    res.status(201).json(area);
  } catch (err) { next(err); }
});

// Remove area (admin only)
router.delete("/areas/:areaId", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    await prisma.area.delete({ where: { id: req.params.areaId } });
    res.json({ message: "Area removed" });
  } catch (err) { next(err); }
});

module.exports = router;
