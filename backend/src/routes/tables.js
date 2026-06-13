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
    if (!tableNumber) return res.status(400).json({ error: 'Table number required' });
    const parsedSeats = parseInt(seats, 10);
    if (isNaN(parsedSeats) || parsedSeats <= 0) return res.status(400).json({ error: 'Seats must be a positive number' });
    const exists = await prisma.table.findFirst({ where: { tableNumber: tableNumber.trim().toUpperCase(), floorId, isActive: true } });
    if (exists) return res.status(400).json({ error: 'Table number already exists on this floor' });
    const table = await prisma.table.create({ data: { tableNumber: tableNumber.trim().toUpperCase(), seats: parsedSeats, floorId } });
    res.status(201).json(table);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { tableNumber, seats, isActive } = req.body;
    let parsedSeats = undefined;
    if (seats !== undefined) {
      parsedSeats = parseInt(seats, 10);
      if (isNaN(parsedSeats) || parsedSeats <= 0) return res.status(400).json({ error: 'Seats must be a positive number' });
    }
    if (tableNumber) {
      const existingTable = await prisma.table.findUnique({ where: { id: req.params.id } });
      const exists = await prisma.table.findFirst({
        where: { tableNumber: tableNumber.trim().toUpperCase(), floorId: existingTable.floorId, isActive: true, NOT: { id: req.params.id } }
      });
      if (exists) return res.status(400).json({ error: 'Table number already exists on this floor' });
    }
    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: { tableNumber: tableNumber ? tableNumber.trim().toUpperCase() : undefined, seats: parsedSeats, isActive }
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
