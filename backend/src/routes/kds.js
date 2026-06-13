const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/tickets', verifyToken, async (req, res) => {
  try {
    const tickets = await prisma.kdsTicket.findMany({
      where: { stage: { not: 'COMPLETED' } },
      include: { order: { include: { lines: { include: { product: true } }, table: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(tickets);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.put('/tickets/:id/stage', verifyToken, async (req, res) => {
  try {
    const ticket = await prisma.kdsTicket.findUnique({ where: { id: req.params.id } });
    const nextStage = ticket.stage === 'TO_COOK' ? 'PREPARING' : 'COMPLETED';
    const updated = await prisma.kdsTicket.update({
      where: { id: req.params.id },
      data: { stage: nextStage },
      include: { order: { include: { lines: { include: { product: true } }, table: true } } }
    });
    const io = req.app.get('io');
    io.to('kds-room').emit('ticket-updated', updated);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.put('/tickets/:ticketId/items/:lineId/done', verifyToken, async (req, res) => {
  try {
    const line = await prisma.orderLine.update({ where: { id: req.params.lineId }, data: { kdsStatus: 'DONE' } });
    const io = req.app.get('io');
    io.to('kds-room').emit('item-done', { ticketId: req.params.ticketId, lineId: req.params.lineId });
    res.json(line);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

module.exports = router;
