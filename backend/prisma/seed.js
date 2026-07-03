const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Create admin
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@delivery.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@delivery.com",
      phone: "9999999999",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create zones
  const zoneA = await prisma.zone.upsert({
    where: { name: "Zone A" },
    update: {},
    create: { name: "Zone A" },
  });
  const zoneB = await prisma.zone.upsert({
    where: { name: "Zone B" },
    update: {},
    create: { name: "Zone B" },
  });
  const zoneC = await prisma.zone.upsert({
    where: { name: "Zone C" },
    update: {},
    create: { name: "Zone C" },
  });

  // Create areas
  const areas = [
    { name: "Downtown", pincode: "110001", zoneId: zoneA.id },
    { name: "Midtown", pincode: "110002", zoneId: zoneA.id },
    { name: "Uptown", pincode: "110003", zoneId: zoneB.id },
    { name: "Suburb North", pincode: "110004", zoneId: zoneB.id },
    { name: "Suburb South", pincode: "110005", zoneId: zoneC.id },
    { name: "Industrial", pincode: "110006", zoneId: zoneC.id },
  ];

  for (const area of areas) {
    await prisma.area.upsert({
      where: { pincode: area.pincode },
      update: {},
      create: area,
    });
  }

  // Create rate cards
  const rateCards = [
    { name: "B2C Intra-Zone", orderType: "B2C", isIntraZone: true, ratePerKg: 30, minimumCharge: 50, codSurcharge: 2 },
    { name: "B2C Inter-Zone", orderType: "B2C", isIntraZone: false, ratePerKg: 50, minimumCharge: 80, codSurcharge: 2 },
    { name: "B2B Intra-Zone", orderType: "B2B", isIntraZone: true, ratePerKg: 20, minimumCharge: 100, codSurcharge: 1 },
    { name: "B2B Inter-Zone", orderType: "B2B", isIntraZone: false, ratePerKg: 35, minimumCharge: 150, codSurcharge: 1 },
  ];

  for (const card of rateCards) {
    const existing = await prisma.rateCard.findFirst({
      where: { orderType: card.orderType, isIntraZone: card.isIntraZone },
    });
    if (!existing) {
      await prisma.rateCard.create({ data: card });
    }
  }

  // Create a customer
  const customerPassword = await bcrypt.hash("customer123", 10);
  await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      name: "John Customer",
      email: "customer@example.com",
      phone: "8888888888",
      password: customerPassword,
      role: "CUSTOMER",
    },
  });

  // Create a delivery agent user + agent record
  const agentPassword = await bcrypt.hash("agent123", 10);
  const agentUser = await prisma.user.upsert({
    where: { email: "agent1@delivery.com" },
    update: {},
    create: {
      name: "Agent One",
      email: "agent1@delivery.com",
      phone: "7777777777",
      password: agentPassword,
      role: "AGENT",
    },
  });

  const agent = await prisma.agent.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: {
      userId: agentUser.id,
      status: "AVAILABLE",
      latitude: 28.6139,
      longitude: 77.209,
    },
  });

  // Assign agent to Zone A
  await prisma.agentZone.upsert({
    where: { agentId_zoneId: { agentId: agent.id, zoneId: zoneA.id } },
    update: {},
    create: { agentId: agent.id, zoneId: zoneA.id },
  });

  console.log("Seed completed.");
  console.log("Admin: admin@delivery.com / admin123");
  console.log("Customer: customer@example.com / customer123");
  console.log("Agent: agent1@delivery.com / agent123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
