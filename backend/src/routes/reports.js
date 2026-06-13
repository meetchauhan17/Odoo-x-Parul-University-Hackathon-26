const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin, requireEmployee } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/dashboard', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { period, employeeId, sessionId, from, to } = req.query;
    let dateFilter = {};
    const now = new Date();
    if (period === 'today') { dateFilter = { gte: new Date(now.setHours(0,0,0,0)) }; }
    else if (period === 'week') { const d = new Date(); d.setDate(d.getDate() - 7); dateFilter = { gte: d }; }
    else if (period === 'month') { const d = new Date(); d.setDate(1); dateFilter = { gte: d }; }
    else if (period === 'custom' && from && to) {
      dateFilter = {
        gte: new Date(from),
        lte: new Date(new Date(to).setHours(23,59,59,999))
      };
    }

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
    if (period === 'custom' && from && to) {
      const start = new Date(from);
      const end = new Date(to);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      const step = diffDays <= 14 ? 1 : Math.ceil(diffDays / 7);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + step)) {
        const dayStart = new Date(d.setHours(0,0,0,0));
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + step - 1, 23, 59, 59, 999);
        const rangeOrders = orders.filter(o => {
          const co = new Date(o.createdAt);
          return co >= dayStart && co <= dayEnd;
        });
        trendData.push({
          date: dayStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          revenue: rangeOrders.reduce((s, o) => s + parseFloat(o.total), 0),
          orders: rangeOrders.length
        });
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dayStart = new Date(d.setHours(0,0,0,0));
        const dayEnd = new Date(d.setHours(23,59,59,999));
        const dayOrders = orders.filter(o => new Date(o.createdAt) >= dayStart && new Date(o.createdAt) <= dayEnd);
        trendData.push({ date: dayStart.toLocaleDateString('en-IN', { weekday: 'short' }), revenue: dayOrders.reduce((s, o) => s + parseFloat(o.total), 0), orders: dayOrders.length });
      }
    }

    res.json({ totalOrders, revenue, avgOrderValue, topProducts, topCategories, topOrders, trendData });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Something went wrong' }); }
});

/* ─── CSV Export — sends file directly from server ──────── */
router.get('/export-csv', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { period, employeeId, from, to } = req.query;
    let dateFilter = {};
    if (period === 'today') { dateFilter = { gte: new Date(new Date().setHours(0,0,0,0)) }; }
    else if (period === 'week')  { const d = new Date(); d.setDate(d.getDate() - 7); dateFilter = { gte: d }; }
    else if (period === 'month') { const d = new Date(); d.setDate(1); dateFilter = { gte: d }; }
    else if (period === 'custom' && from && to) {
      dateFilter = {
        gte: new Date(from),
        lte: new Date(new Date(to).setHours(23,59,59,999))
      };
    }

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

/* ─── XLSX Export — real Excel file from server ──────────── */
router.get('/export-xlsx', verifyToken, requireEmployee, async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const { period, employeeId, from, to } = req.query;
    let dateFilter = {};
    if (period === 'today') { dateFilter = { gte: new Date(new Date().setHours(0,0,0,0)) }; }
    else if (period === 'week')  { const d = new Date(); d.setDate(d.getDate() - 7); dateFilter = { gte: d }; }
    else if (period === 'month') { const d = new Date(); d.setDate(1); dateFilter = { gte: d }; }
    else if (period === 'custom' && from && to) {
      dateFilter = {
        gte: new Date(from),
        lte: new Date(new Date(to).setHours(23,59,59,999))
      };
    }

    const where = { status: 'PAID' };
    if (dateFilter.gte) where.createdAt = dateFilter;
    if (employeeId) where.createdById = employeeId;

    const orders = await prisma.order.findMany({
      where,
      include: { lines: { include: { product: { include: { category: true } } } } },
    });

    const revenue  = orders.reduce((s, o) => s + parseFloat(o.total), 0);
    const avgOrder = orders.length > 0 ? revenue / orders.length : 0;

    const productMap = {}, categoryMap = {};
    orders.forEach(o => {
      o.lines.forEach(l => {
        const n = l.product.name;
        if (!productMap[n]) productMap[n] = { name: n, qty: 0, revenue: 0 };
        productMap[n].qty += l.quantity;
        productMap[n].revenue += parseFloat(l.lineTotal);
        const c = l.product.category?.name || 'Unknown';
        if (!categoryMap[c]) categoryMap[c] = { name: c, revenue: 0 };
        categoryMap[c].revenue += parseFloat(l.lineTotal);
      });
    });

    const top = (map, key) => Object.values(map).sort((a,b) => b[key]-a[key]);
    const topProducts   = top(productMap, 'revenue').slice(0,10);
    const topCategories = top(categoryMap, 'revenue');
    const topOrders     = [...orders].sort((a,b) => parseFloat(b.total)-parseFloat(a.total)).slice(0,10);
    const f = n => Number(n||0).toFixed(2);
    const date = new Date().toLocaleString('en-IN');

    const wb = XLSX.utils.book_new();

    // Sheet 1 — Summary
    const wsSummary = XLSX.utils.aoa_to_sheet([
      ['Cafe POS - Sales Report'],
      [`Period: ${period||'all'}`, `Generated: ${date}`],
      [],
      ['Metric', 'Value'],
      ['Total Orders', orders.length],
      ['Total Revenue (Rs.)', f(revenue)],
      ['Avg Order Value (Rs.)', f(avgOrder)],
      ['Top Product', topProducts[0]?.name || '-'],
    ]);
    wsSummary['!cols'] = [{wch:28},{wch:22}];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Sheet 2 — Products
    const wsP = XLSX.utils.aoa_to_sheet([
      ['#','Product Name','Qty Sold','Revenue (Rs.)'],
      ...topProducts.map((p,i) => [i+1, p.name, p.qty, f(p.revenue)]),
    ]);
    wsP['!cols'] = [{wch:5},{wch:30},{wch:12},{wch:16}];
    XLSX.utils.book_append_sheet(wb, wsP, 'Top Products');

    // Sheet 3 — Categories
    const wsC = XLSX.utils.aoa_to_sheet([
      ['Category','Revenue (Rs.)'],
      ...topCategories.map(c => [c.name, f(c.revenue)]),
    ]);
    wsC['!cols'] = [{wch:24},{wch:16}];
    XLSX.utils.book_append_sheet(wb, wsC, 'Categories');

    // Sheet 4 — Orders
    const wsO = XLSX.utils.aoa_to_sheet([
      ['Order Number','Amount (Rs.)','Date & Time'],
      ...topOrders.map(o => [o.orderNumber, f(o.total), new Date(o.createdAt).toLocaleString('en-IN')]),
    ]);
    wsO['!cols'] = [{wch:20},{wch:16},{wch:24}];
    XLSX.utils.book_append_sheet(wb, wsO, 'Orders');

    const filename = `cafe-pos-${period||'all'}-${new Date().toISOString().slice(0,10)}.xlsx`;
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Export failed' });
  }
});

module.exports = router;
