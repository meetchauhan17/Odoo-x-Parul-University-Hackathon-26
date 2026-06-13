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
        const disc = promo.discountType === 'PERCENTAGE'
          ? (subtotal * promo.discountValue) / 100
          : parseFloat(promo.discountValue);
        totalDiscount += disc;
        appliedPromos.push({ name: promo.name, discount: disc });
      }
    }
    if (promo.applyTo === 'ORDER' && subtotal >= promo.minOrderAmount) {
      const disc = promo.discountType === 'PERCENTAGE'
        ? (subtotal * promo.discountValue) / 100
        : parseFloat(promo.discountValue);
      totalDiscount += disc;
      appliedPromos.push({ name: promo.name, discount: disc });
    }
  }

  return { totalDiscount, appliedPromos };
};

module.exports = { applyPromotions };
