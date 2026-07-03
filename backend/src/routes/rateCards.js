const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get all rate cards
router.get("/", authenticate, async (req, res, next) => {
  try {
    const cards = await prisma.rateCard.findMany({ orderBy: { orderType: "asc" } });
    res.json(cards);
  } catch (err) { next(err); }
});

// Create rate card (admin only)
router.post("/", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const { name, orderType, isIntraZone, ratePerKg, minimumCharge, codSurcharge } = req.body;
    if (!name || !orderType || isIntraZone === undefined || !ratePerKg) {
      return res.status(400).json({ error: "name, orderType, isIntraZone, ratePerKg required" });
    }
    const card = await prisma.rateCard.create({
      data: { name, orderType, isIntraZone, ratePerKg, minimumCharge: minimumCharge || 0, codSurcharge: codSurcharge || 0 },
    });
    res.status(201).json(card);
  } catch (err) { next(err); }
});

// Update rate card (admin only)
router.put("/:id", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    const { name, ratePerKg, minimumCharge, codSurcharge } = req.body;
    const card = await prisma.rateCard.update({
      where: { id: req.params.id },
      data: { name, ratePerKg, minimumCharge, codSurcharge },
    });
    res.json(card);
  } catch (err) { next(err); }
});

// Delete rate card (admin only)
router.delete("/:id", authenticate, authorize("ADMIN"), async (req, res, next) => {
  try {
    await prisma.rateCard.delete({ where: { id: req.params.id } });
    res.json({ message: "Rate card deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
