const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/', verifyToken, async (req, res) => {
  try {
    const promos = await prisma.promotion.findMany({ where: { isActive: true }, include: { product: true } });
    res.json(promos);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, applyTo, productId, minQuantity, minOrderAmount, discountType, discountValue } = req.body;
    const promo = await prisma.promotion.create({
      data: { name, applyTo, productId, minQuantity: minQuantity ? parseInt(minQuantity) : null, minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null, discountType, discountValue: parseFloat(discountValue) },
      include: { product: true }
    });
    res.status(201).json(promo);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const promo = await prisma.promotion.update({ where: { id: req.params.id }, data: { isActive } });
    res.json(promo);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await prisma.promotion.delete({ where: { id: req.params.id } });
    res.json({ message: 'Promotion deleted' });
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

module.exports = router;
