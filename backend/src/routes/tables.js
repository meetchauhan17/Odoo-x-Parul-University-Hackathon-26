const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/', verifyToken, async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      where: { isActive: true },
      include: { floor: true }
    });
    res.json(tables);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { tableNumber, seats, floorId } = req.body;
    const table = await prisma.table.create({ data: { tableNumber, seats: parseInt(seats), floorId } });
    res.status(201).json(table);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { tableNumber, seats, isActive } = req.body;
    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: { tableNumber, seats: seats ? parseInt(seats) : undefined, isActive }
    });
    res.json(table);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await prisma.table.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Table deleted' });
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

module.exports = router;
