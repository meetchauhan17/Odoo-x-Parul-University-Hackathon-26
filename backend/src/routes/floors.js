const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/', verifyToken, async (req, res) => {
  try {
    const floors = await prisma.floor.findMany({
      where: { isActive: true },
      include: { tables: { where: { isActive: true } } }
    });
    res.json(floors);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const floor = await prisma.floor.create({ data: { name } });
    res.status(201).json(floor);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await prisma.floor.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Floor deleted' });
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

module.exports = router;
