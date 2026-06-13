const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const applyPromotions = async (lines, subtotal) => {
  const promotions = await prisma.promotion.findMany({ where: { isActive: true }, include: { product: true } });
  let totalDiscount = 0;
  const appliedPromos = [];

  for (const promo of promotions) {
    if (promo.applyTo === 'PRODUCT') {
      const line = lines.find(l => l.productId === promo.productId);
      if (line && line.quantity >= promo.minQuantity) {
        const discountVal = parseFloat(promo.discountValue);
        const disc = promo.discountType === 'PERCENTAGE'
          ? (subtotal * discountVal) / 100
          : discountVal;
        totalDiscount += disc;
        appliedPromos.push({ name: promo.name, discount: disc });
      }
    }
    if (promo.applyTo === 'ORDER' && subtotal >= parseFloat(promo.minOrderAmount)) {
      const discountVal = parseFloat(promo.discountValue);
      const disc = promo.discountType === 'PERCENTAGE'
        ? (subtotal * discountVal) / 100
        : discountVal;
      totalDiscount += disc;
      appliedPromos.push({ name: promo.name, discount: disc });
    }
  }

  return { totalDiscount, appliedPromos };
};

module.exports = { applyPromotions };
