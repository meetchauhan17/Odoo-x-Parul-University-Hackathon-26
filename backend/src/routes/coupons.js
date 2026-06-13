const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validate, rules: v } = require('../middleware/validate');
const prisma = new PrismaClient();

const couponValidation = validate({
  code:          [v.required, v.minLength(3)],
  discountType:  [v.required, v.isEnum('PERCENTAGE', 'FIXED')],
  discountValue: [v.required, v.isPositive],
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(coupons);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.post('/', verifyToken, requireAdmin, couponValidation, async (req, res) => {
  try {
    const { code, discountType, discountValue } = req.body;
    const existing = await prisma.coupon.findFirst({ where: { code: code.trim().toUpperCase() } });
    if (existing) return res.status(400).json({ error: 'Coupon code already exists', errors: { code: 'Code already in use' } });
    const coupon = await prisma.coupon.create({
      data: { code: code.trim().toUpperCase(), discountType, discountValue: parseFloat(discountValue) },
    });
    res.status(201).json(coupon);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.post('/validate', verifyToken, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code is required' });
    const coupon = await prisma.coupon.findFirst({ where: { code: code.trim().toUpperCase(), isActive: true } });
    if (!coupon) return res.status(404).json({ error: 'Invalid or expired coupon code' });
    res.json(coupon);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { isActive, discountValue } = req.body;
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: { isActive, discountValue: discountValue ? parseFloat(discountValue) : undefined },
    });
    res.json(coupon);
  } catch (e) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Coupon not found' });
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ message: 'Coupon deleted' });
  } catch (e) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Coupon not found' });
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
