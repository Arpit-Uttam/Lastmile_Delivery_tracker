const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth");
const { calculateCharge } = require("../services/rateCalculator");
const { generateTrackingNumber } = require("../utils/trackingNumber");
const { notifyCustomer } = require("../services/notifications");

const router = express.Router();
const prisma = new PrismaClient();

// Preview charge before order creation
router.post("/quote", authenticate, async (req, res, next) => {
  try {
    const { pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType } = req.body;
    const quote = await calculateCharge({ pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType });
    res.json(quote);
  } catch (err) { next(err); }
});

// Create order (customer or admin on behalf)
router.post("/", authenticate, async (req, res, next) => {
  try {
    const {
      customerId, // admin can pass a customerId; customers use their own id
      pickupAddress, pickupPincode,
      dropAddress, dropPincode,
      length, breadth, height, actualWeight,
      orderType, paymentType,
    } = req.body;

    // Determine the customer
    const targetCustomerId = (req.user.role === "ADMIN" && customerId) ? customerId : req.user.id;

    // Ensure customer exists
    const customer = await prisma.user.findUnique({ where: { id: targetCustomerId } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const charge = await calculateCharge({ pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType });

    const trackingNumber = generateTrackingNumber();

    const order = await prisma.order.create({
      data: {
        trackingNumber,
        customerId: targetCustomerId,
        createdById: req.user.id,
        pickupAddress,
        pickupPincode,
        dropAddress,
        dropPincode,
        pickupZoneId: charge.pickupZone.id,
        dropZoneId: charge.dropZone.id,
        length, breadth, height,
        actualWeight,
        volumetricWeight: charge.volumetricWeight,
        chargeableWeight: charge.chargeableWeight,
        orderType,
        paymentType,
        ratePerKg: charge.ratePerKg,
        baseCharge: charge.baseCharge,
        codSurcharge: charge.codSurcharge,
        totalCharge: charge.totalCharge,
        status: "CREATED",
        trackingHistory: {
          create: {
            status: "CREATED",
            note: "Order created",
            actorId: req.user.id,
            actorRole: req.user.role,
          },
        },
      },
      include: { pickupZone: true, dropZone: true, trackingHistory: true },
    });

    await notifyCustomer(customer, trackingNumber, "CREATED");
    res.status(201).json(order);
  } catch (err) { next(err); }
});

// List orders (admin: all; customer: own; agent: assigned)
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { status, zoneId, agentId, page = 1, limit = 20 } = req.query;
    const where = {};

    if (req.user.role === "CUSTOMER") where.customerId = req.user.id;
    if (req.user.role === "AGENT") {
      const agent = await prisma.agent.findUnique({ where: { userId: req.user.id } });
      if (!agent) return res.json({ orders: [], total: 0 });
      where.agentId = agent.id;
    }
    if (status) where.status = status;
    if (zoneId) where.OR = [{ pickupZoneId: zoneId }, { dropZoneId: zoneId }];
    if (agentId && req.user.role === "ADMIN") where.agentId = agentId;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { customer: { select: { name: true, email: true, phone: true } }, agent: { include: { user: { select: { name: true, email: true } } } }, pickupZone: true, dropZone: true },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

// Get single order
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        agent: { include: { user: { select: { name: true, email: true, phone: true } } } },
        pickupZone: true,
        dropZone: true,
        trackingHistory: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Customers can only see their own orders
    if (req.user.role === "CUSTOMER" && order.customerId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(order);
  } catch (err) { next(err); }
});

// Agent updates order status
router.patch("/:id/status", authenticate, async (req, res, next) => {
  try {
    const { status, note, failureReason } = req.body;
    const validStatuses = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED"];

    if (req.user.role === "AGENT" && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Agent can only set: ${validStatuses.join(", ")}` });
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { customer: true, agent: { include: { user: true } } },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Agent can only update their own assigned orders
    if (req.user.role === "AGENT") {
      const agent = await prisma.agent.findUnique({ where: { userId: req.user.id } });
      if (!agent || order.agentId !== agent.id) return res.status(403).json({ error: "Not your order" });
    }

    const updateData = { status };
    if (failureReason) updateData.failureReason = failureReason;

    // If delivered, free up the agent
    if (status === "DELIVERED" && order.agentId) {
      await prisma.agent.update({ where: { id: order.agentId }, data: { status: "AVAILABLE" } });
    }

    const [updated] = await prisma.$transaction([
      prisma.order.update({ where: { id: req.params.id }, data: updateData }),
      prisma.trackingEvent.create({
        data: {
          orderId: req.params.id,
          status,
          note: note || null,
          actorId: req.user.id,
          actorRole: req.user.role,
        },
      }),
    ]);

    await notifyCustomer(order.customer, order.trackingNumber, status, note);
    res.json(updated);
  } catch (err) { next(err); }
});

// Reschedule failed delivery
router.patch("/:id/reschedule", authenticate, async (req, res, next) => {
  try {
    const { rescheduleDate } = req.body;
    if (!rescheduleDate) return res.status(400).json({ error: "rescheduleDate required" });

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { customer: true },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "FAILED") return res.status(400).json({ error: "Order is not in FAILED state" });
    if (req.user.role === "CUSTOMER" && order.customerId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Free the current agent
    if (order.agentId) {
      await prisma.agent.update({ where: { id: order.agentId }, data: { status: "AVAILABLE" } });
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: req.params.id },
        data: { status: "RESCHEDULED", rescheduleDate: new Date(rescheduleDate), agentId: null },
      }),
      prisma.trackingEvent.create({
        data: {
          orderId: req.params.id,
          status: "RESCHEDULED",
          note: `Rescheduled for ${rescheduleDate}`,
          actorId: req.user.id,
          actorRole: req.user.role,
        },
      }),
    ]);

    await notifyCustomer(order.customer, order.trackingNumber, "RESCHEDULED", `Your delivery is rescheduled for ${rescheduleDate}`);
    res.json({ message: "Rescheduled successfully" });
  } catch (err) { next(err); }
});

module.exports = router;
