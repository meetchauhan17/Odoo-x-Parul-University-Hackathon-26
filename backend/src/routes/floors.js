const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/', verifyToken, async (req, res) => {
  try {
    const floors = await prisma.floor.findMany({
      where: { isActive: true },
      include: {
        tables: {
          where: { isActive: true },
          include: {
            orders: {
              where: {
                status: { in: ['DRAFT', 'SENT_TO_KITCHEN', 'READY'] }
              },
              include: {
                lines: { include: { product: true } }
                // NOTE: 'customers' removed — not needed for floor plan view
                // and causes 500 on some DB deployments where the join table
                // (_CustomerToOrder) may not be present yet.
              }
            }
          }
        }
      }
    });
    res.json(floors);
  } catch (e) {
    console.error('[floors GET]', e.message);
    res.status(500).json({ error: 'Something went wrong', detail: e.message });
  }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Floor name is required' });
    const floor = await prisma.floor.create({ data: { name: name.trim() } });
    res.status(201).json(floor);
  } catch (e) {
    console.error('[floors POST]', e.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await prisma.floor.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Floor deleted' });
  } catch (e) {
    console.error('[floors DELETE]', e.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
