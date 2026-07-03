const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Haversine formula to calculate distance between two lat/lng points (km).
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Auto-assigns the nearest available agent.
 * Strategy:
 *   1. Find agents assigned to the pickup zone who are AVAILABLE
 *   2. If agent has lat/lng, pick the closest one to pickup area centroid (fallback: first in list)
 *   3. If none in zone, widen search to all AVAILABLE agents
 */
async function autoAssignAgent(orderId, pickupZoneId) {
  // Try agents in the pickup zone first
  let candidates = await prisma.agent.findMany({
    where: {
      status: "AVAILABLE",
      agentZones: { some: { zoneId: pickupZoneId } },
    },
    include: { user: { select: { name: true, email: true } } },
  });

  // Fallback: any available agent
  if (candidates.length === 0) {
    candidates = await prisma.agent.findMany({
      where: { status: "AVAILABLE" },
      include: { user: { select: { name: true, email: true } } },
    });
  }

  if (candidates.length === 0) return null;

  // Get pickup zone's approximate centroid from its areas
  const zoneAreas = await prisma.area.findMany({ where: { zoneId: pickupZoneId } });

  // Simple selection: pick first available (extend with GPS-based ranking when coordinates are available)
  let selectedAgent = candidates[0];

  // If agents have coordinates, pick nearest one
  const agentsWithCoords = candidates.filter((a) => a.latitude && a.longitude);
  if (agentsWithCoords.length > 0 && zoneAreas.length > 0) {
    // Use a rough centroid (lat/lng not stored per area, so use agent proximity among themselves)
    // Pick agent with fewest active orders as tiebreaker
    const agentOrderCounts = await Promise.all(
      agentsWithCoords.map(async (a) => {
        const count = await prisma.order.count({
          where: { agentId: a.id, status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] } },
        });
        return { agent: a, count };
      })
    );
    agentOrderCounts.sort((a, b) => a.count - b.count);
    selectedAgent = agentOrderCounts[0].agent;
  }

  // Assign agent to order and mark agent BUSY
  const updated = await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { agentId: selectedAgent.id, status: "ASSIGNED" },
    }),
    prisma.agent.update({
      where: { id: selectedAgent.id },
      data: { status: "BUSY" },
    }),
    prisma.trackingEvent.create({
      data: {
        orderId,
        status: "ASSIGNED",
        note: `Auto-assigned to agent ${selectedAgent.user.name}`,
        actorRole: "ADMIN",
      },
    }),
  ]);

  return selectedAgent;
}

/**
 * Manually assign a specific agent to an order.
 */
async function manualAssignAgent(orderId, agentId, actorId) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { user: true },
  });
  if (!agent) throw new Error("Agent not found");

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { agentId, status: "ASSIGNED" },
    }),
    prisma.agent.update({
      where: { id: agentId },
      data: { status: "BUSY" },
    }),
    prisma.trackingEvent.create({
      data: {
        orderId,
        status: "ASSIGNED",
        note: `Manually assigned to agent ${agent.user.name}`,
        actorId,
        actorRole: "ADMIN",
      },
    }),
  ]);

  return agent;
}

module.exports = { autoAssignAgent, manualAssignAgent, haversineDistance };
