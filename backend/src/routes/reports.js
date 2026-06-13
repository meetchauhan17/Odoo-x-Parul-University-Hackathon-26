const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin, requireEmployee } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/dashboard', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { period, employeeId, sessionId } = req.query;
    let dateFilter = {};
    const now = new Date();
    if (period === 'today') { dateFilter = { gte: new Date(now.setHours(0,0,0,0)) }; }
    else if (period === 'week') { const d = new Date(); d.setDate(d.getDate() - 7); dateFilter = { gte: d }; }
    else if (period === 'month') { const d = new Date(); d.setDate(1); dateFilter = { gte: d }; }

    const where = { status: 'PAID' };
    if (dateFilter.gte) where.createdAt = dateFilter;
    if (employeeId) where.createdById = employeeId;
    if (sessionId) where.sessionId = sessionId;

    const orders = await prisma.order.findMany({ where, include: { lines: { include: { product: { include: { category: true } } } } } });
    const totalOrders = orders.length;
    const revenue = orders.reduce((s, o) => s + parseFloat(o.total), 0);
    const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

    const productMap = {};
    const categoryMap = {};
    orders.forEach(o => {
      o.lines.forEach(l => {
        const pName = l.product.name;
        if (!productMap[pName]) productMap[pName] = { name: pName, qty: 0, revenue: 0 };
        productMap[pName].qty += l.quantity;
        productMap[pName].revenue += parseFloat(l.lineTotal);
        const cName = l.product.category?.name || 'Unknown';
        if (!categoryMap[cName]) categoryMap[cName] = { name: cName, revenue: 0, color: l.product.category?.color };
        categoryMap[cName].revenue += parseFloat(l.lineTotal);
      });
    });

    const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const topCategories = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);
    const topOrders = orders.sort((a, b) => parseFloat(b.total) - parseFloat(a.total)).slice(0, 5).map(o => ({ id: o.id, orderNumber: o.orderNumber, total: o.total, createdAt: o.createdAt }));

    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dayStart = new Date(d.setHours(0,0,0,0));
      const dayEnd = new Date(d.setHours(23,59,59,999));
      const dayOrders = orders.filter(o => new Date(o.createdAt) >= dayStart && new Date(o.createdAt) <= dayEnd);
      trendData.push({ date: dayStart.toLocaleDateString('en-IN', { weekday: 'short' }), revenue: dayOrders.reduce((s, o) => s + parseFloat(o.total), 0), orders: dayOrders.length });
    }

    res.json({ totalOrders, revenue, avgOrderValue, topProducts, topCategories, topOrders, trendData });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Something went wrong' }); }
});

/* ─── CSV Export — sends file directly from server ──────── */
router.get('/export-csv', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { period, employeeId } = req.query;
    let dateFilter = {};
    if (period === 'today') { dateFilter = { gte: new Date(new Date().setHours(0,0,0,0)) }; }
    else if (period === 'week')  { const d = new Date(); d.setDate(d.getDate() - 7); dateFilter = { gte: d }; }
    else if (period === 'month') { const d = new Date(); d.setDate(1); dateFilter = { gte: d }; }

    const where = { status: 'PAID' };
    if (dateFilter.gte) where.createdAt = dateFilter;
    if (employeeId) where.createdById = employeeId;

    const orders = await prisma.order.findMany({
      where,
      include: { lines: { include: { product: { include: { category: true } } } } },
    });

    const revenue  = orders.reduce((s, o) => s + parseFloat(o.total), 0);
    const avgOrder = orders.length > 0 ? revenue / orders.length : 0;

    const productMap  = {};
    const categoryMap = {};
    orders.forEach(o => {
      o.lines.forEach(l => {
        const n = l.product.name;
        if (!productMap[n]) productMap[n] = { name: n, qty: 0, revenue: 0 };
        productMap[n].qty     += l.quantity;
        productMap[n].revenue += parseFloat(l.lineTotal);
        const c = l.product.category?.name || 'Unknown';
        if (!categoryMap[c]) categoryMap[c] = { name: c, revenue: 0 };
        categoryMap[c].revenue += parseFloat(l.lineTotal);
      });
    });

    const topProducts   = Object.values(productMap).sort((a,b) => b.revenue - a.revenue).slice(0,10);
    const topCategories = Object.values(categoryMap).sort((a,b) => b.revenue - a.revenue);
    const topOrders     = [...orders].sort((a,b) => parseFloat(b.total)-parseFloat(a.total)).slice(0,10);

    const q       = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const toFixed = (n) => Number(n || 0).toFixed(2);

    const rows = [
      ['Cafe POS - Sales Report'],
      ['Period: ' + (period||'all'), 'Generated: ' + new Date().toLocaleString('en-IN')],
      [],
      ['SUMMARY'],
      ['Total Orders', orders.length],
      ['Total Revenue (Rs.)', toFixed(revenue)],
      ['Avg Order Value (Rs.)', toFixed(avgOrder)],
      [],
      ['TOP PRODUCTS'],
      ['#','Product Name','Qty Sold','Revenue (Rs.)'],
      ...topProducts.map((p,i) => [i+1, p.name, p.qty, toFixed(p.revenue)]),
      [],
      ['TOP CATEGORIES'],
      ['Category','Revenue (Rs.)'],
      ...topCategories.map(c => [c.name, toFixed(c.revenue)]),
      [],
      ['TOP ORDERS'],
      ['Order Number','Amount (Rs.)','Date & Time'],
      ...topOrders.map(o => [o.orderNumber, toFixed(o.total), new Date(o.createdAt).toLocaleString('en-IN')]),
    ];

    // UTF-8 BOM so Excel opens with correct encoding
    const csv      = '\uFEFF' + rows.map(r => r.map(q).join(',')).join('\r\n');
    const filename = `cafe-pos-${period||'all'}-${new Date().toISOString().slice(0,10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Export failed' });
  }
});

module.exports = router;
