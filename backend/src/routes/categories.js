const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/', verifyToken, async (req, res) => {
  try {
    const cats = await prisma.productCategory.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    res.json(cats);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const cat = await prisma.productCategory.create({ data: { name, color: color || '#6B7280' } });
    res.status(201).json(cat);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, color } = req.body;
    const cat = await prisma.productCategory.update({ where: { id: req.params.id }, data: { name, color } });
    res.json(cat);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await prisma.productCategory.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Category deleted' });
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

module.exports = router;
