const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Public tracking by tracking number (no auth required)
router.get("/:trackingNumber", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { trackingNumber: req.params.trackingNumber },
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        pickupAddress: true,
        dropAddress: true,
        orderType: true,
        paymentType: true,
        totalCharge: true,
        rescheduleDate: true,
        failureReason: true,
        createdAt: true,
        pickupZone: { select: { name: true } },
        dropZone: { select: { name: true } },
        agent: { include: { user: { select: { name: true, phone: true } } } },
        trackingHistory: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) { next(err); }
});

module.exports = router;
