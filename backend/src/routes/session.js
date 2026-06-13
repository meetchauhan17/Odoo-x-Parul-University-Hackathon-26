const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireEmployee } = require('../middleware/auth');
const prisma = new PrismaClient();

/* ── helper: human-readable duration ─────────────────── */
function formatDuration(ms) {
  const totalMins = Math.floor(ms / 60000);
  const hrs  = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

/* GET /api/session/current ─────────────────────────────── */
router.get('/current', verifyToken, async (req, res) => {
  try {
    const session = await prisma.posSession.findFirst({
      where: { status: 'OPEN' },
      include: { openedBy: { select: { id: true, name: true, email: true } } },
      orderBy: { openedAt: 'desc' },
    });
    res.json(session);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

/* POST /api/session/open ───────────────────────────────── */
router.post('/open', verifyToken, requireEmployee, async (req, res) => {
  try {
    const existing = await prisma.posSession.findFirst({ where: { status: 'OPEN' } });
    if (existing) return res.json(existing);
    const session = await prisma.posSession.create({
      data: { openedById: req.user.id, status: 'OPEN' },
      include: { openedBy: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(session);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

/* POST /api/session/close ──────────────────────────────── */
router.post('/close', verifyToken, requireEmployee, async (req, res) => {
  try {
    const session = await prisma.posSession.findFirst({ where: { status: 'OPEN' } });
    if (!session) return res.status(404).json({ error: 'No open session' });

    const closedAt = new Date();
    const durationMs = closedAt - new Date(session.openedAt);

    /* All orders belonging to this session */
    const orders = await prisma.order.findMany({
      where: { sessionId: session.id },
      include: { lines: { include: { product: true } } },
    });

    /* Draft order warning count */
    const draftCount = orders.filter(o => o.status === 'DRAFT').length;

    /* Paid orders only for financials */
    const paidOrders = orders.filter(o => o.status === 'PAID');
    const totalOrders  = paidOrders.length;
    const totalRevenue = paidOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    /* Payment breakdown */
    const paymentBreakdown = { CASH: 0, CARD: 0, UPI: 0 };
    paidOrders.forEach(o => {
      const m = (o.paymentMethod || '').toUpperCase();
      if (paymentBreakdown[m] !== undefined) paymentBreakdown[m] += parseFloat(o.total || 0);
    });

    /* Order status breakdown */
    const orderStatusBreakdown = {
      paid:      orders.filter(o => o.status === 'PAID').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      draft:     draftCount,
      kitchen:   orders.filter(o => o.status === 'SENT_TO_KITCHEN').length,
    };

    /* Top product by quantity sold */
    const productMap = {};
    paidOrders.forEach(o => {
      o.lines.forEach(l => {
        const name = l.product?.name || 'Unknown';
        if (!productMap[name]) productMap[name] = { name, quantity: 0, revenue: 0 };
        productMap[name].quantity += l.quantity;
        productMap[name].revenue  += parseFloat(l.lineTotal || 0);
      });
    });
    const topProduct = Object.values(productMap).sort((a, b) => b.quantity - a.quantity)[0] || null;

    /* Persist close */
    await prisma.posSession.update({
      where: { id: session.id },
      data: {
        status: 'CLOSED',
        closedAt,
        totalOrders,
        totalRevenue,
      },
    });

    res.json({
      sessionId:       session.id,
      openedAt:        session.openedAt,
      closedAt,
      duration:        formatDuration(durationMs),
      durationMs,
      totalOrders,
      totalRevenue,
      avgOrderValue,
      topProduct,
      paymentBreakdown,
      orderStatusBreakdown,
      draftOrdersWarning: draftCount,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

/* GET /api/session/draft-count ─────────────────────────── */
router.get('/draft-count', verifyToken, async (req, res) => {
  try {
    const session = await prisma.posSession.findFirst({ where: { status: 'OPEN' } });
    if (!session) return res.json({ count: 0 });
    const count = await prisma.order.count({ where: { sessionId: session.id, status: 'DRAFT' } });
    res.json({ count });
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

module.exports = router;
