const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Detects zone for a given pincode by looking up Area table.
 */
async function detectZone(pincode) {
  const area = await prisma.area.findUnique({
    where: { pincode },
    include: { zone: true },
  });
  return area ? area.zone : null;
}

/**
 * Calculates volumetric weight: L × B × H ÷ 5000
 */
function calcVolumetricWeight(l, b, h) {
  return (l * b * h) / 5000;
}

/**
 * Main rate calculation function.
 * Returns full breakdown: zones, weights, charges.
 */
async function calculateCharge({ pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType }) {
  const pickupZone = await detectZone(pickupPincode);
  const dropZone = await detectZone(dropPincode);

  if (!pickupZone) throw new Error(`No zone found for pickup pincode: ${pickupPincode}`);
  if (!dropZone) throw new Error(`No zone found for drop pincode: ${dropPincode}`);

  const isIntraZone = pickupZone.id === dropZone.id;
  const volumetricWeight = calcVolumetricWeight(length, breadth, height);
  const chargeableWeight = Math.max(actualWeight, volumetricWeight);

  // Find the matching rate card
  const rateCard = await prisma.rateCard.findFirst({
    where: { orderType, isIntraZone },
  });

  if (!rateCard) throw new Error(`No rate card configured for ${orderType} ${isIntraZone ? "intra" : "inter"}-zone`);

  const baseCharge = Math.max(chargeableWeight * rateCard.ratePerKg, rateCard.minimumCharge);

  // COD surcharge is a percentage of baseCharge
  let codSurcharge = 0;
  if (paymentType === "COD") {
    codSurcharge = (baseCharge * rateCard.codSurcharge) / 100;
  }

  const totalCharge = baseCharge + codSurcharge;

  return {
    pickupZone,
    dropZone,
    isIntraZone,
    volumetricWeight: parseFloat(volumetricWeight.toFixed(3)),
    chargeableWeight: parseFloat(chargeableWeight.toFixed(3)),
    ratePerKg: rateCard.ratePerKg,
    baseCharge: parseFloat(baseCharge.toFixed(2)),
    codSurcharge: parseFloat(codSurcharge.toFixed(2)),
    totalCharge: parseFloat(totalCharge.toFixed(2)),
    rateCardId: rateCard.id,
  };
}

module.exports = { calculateCharge, detectZone, calcVolumetricWeight };
