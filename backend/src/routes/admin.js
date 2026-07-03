const express = require("express");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth");
const { autoAssignAgent, manualAssignAgent } = require("../services/agentAssignment");
const { notifyCustomer } = require("../services/notifications");

const router = express.Router();
const prisma = new PrismaClient();

// All routes require admin
router.use(authenticate, authorize("ADMIN"));

// Get all customers
router.get("/customers", async (req, res, next) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(customers);
  } catch (err) { next(err); }
});

// Create customer (admin on behalf)
router.post("/customers", async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, phone, password: hashed, role: "CUSTOMER" },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
});

// Auto-assign agent to order
router.post("/orders/:orderId/auto-assign", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.agentId) return res.status(400).json({ error: "Agent already assigned" });

    const agent = await autoAssignAgent(order.id, order.pickupZoneId);
    if (!agent) return res.status(404).json({ error: "No available agents found" });

    res.json({ message: "Agent auto-assigned", agent });
  } catch (err) { next(err); }
});

// Manually assign agent to order
router.post("/orders/:orderId/assign/:agentId", async (req, res, next) => {
  try {
    const { orderId, agentId } = req.params;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // If re-assigning, free previous agent
    if (order.agentId && order.agentId !== agentId) {
      await prisma.agent.update({ where: { id: order.agentId }, data: { status: "AVAILABLE" } });
    }

    const agent = await manualAssignAgent(orderId, agentId, req.user.id);
    res.json({ message: "Agent assigned", agent });
  } catch (err) { next(err); }
});

// Admin override order status
router.patch("/orders/:orderId/status", async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!status) return res.status(400).json({ error: "status required" });

    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: { customer: true },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });

    await prisma.$transaction([
      prisma.order.update({ where: { id: req.params.orderId }, data: { status } }),
      prisma.trackingEvent.create({
        data: {
          orderId: req.params.orderId,
          status,
          note: note || "Status overridden by admin",
          actorId: req.user.id,
          actorRole: "ADMIN",
        },
      }),
    ]);

    await notifyCustomer(order.customer, order.trackingNumber, status, note);
    res.json({ message: "Status updated" });
  } catch (err) { next(err); }
});

// Dashboard stats
router.get("/stats", async (req, res, next) => {
  try {
    const [totalOrders, deliveredOrders, failedOrders, activeAgents, totalCustomers] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.count({ where: { status: "FAILED" } }),
      prisma.agent.count({ where: { status: "AVAILABLE" } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
    ]);

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } }, pickupZone: true, dropZone: true },
    });

    res.json({ totalOrders, deliveredOrders, failedOrders, activeAgents, totalCustomers, recentOrders });
  } catch (err) { next(err); }
});

module.exports = router;
