const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireEmployee } = require('../middleware/auth');
const { applyPromotions } = require('../utils/promotionEngine');
const prisma = new PrismaClient();
const { sendReceiptEmail } = require('../utils/emailService');

const calcOrder = async (lines, couponCode) => {
  let subtotal = 0;
  const processedLines = [];
  for (const line of lines) {
    const product = await prisma.product.findUnique({ where: { id: line.productId } });
    const lineTotal = parseFloat(product.price) * line.quantity;
    subtotal += lineTotal;
    processedLines.push({ productId: line.productId, quantity: line.quantity, unitPrice: parseFloat(product.price), lineTotal, discount: 0 });
  }
  const { totalDiscount: promoDiscount } = await applyPromotions(lines, subtotal);
  let couponDiscount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({ where: { code: couponCode.trim().toUpperCase(), isActive: true } });
    if (coupon) {
      couponDiscount = coupon.discountType === 'PERCENTAGE' ? (subtotal * parseFloat(coupon.discountValue)) / 100 : parseFloat(coupon.discountValue);
    }
  }
  const discountAmount = promoDiscount + couponDiscount;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = afterDiscount * 0.05;
  const total = afterDiscount + taxAmount;
  return { processedLines, subtotal, taxAmount, discountAmount, total };
};


router.get('/', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { sessionId, status } = req.query;
    const where = {};
    if (sessionId) where.sessionId = sessionId;
    if (status) where.status = status;
    const orders = await prisma.order.findMany({
      where, include: { lines: { include: { product: true } }, customer: true, table: true, kdsTicket: true, createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.post('/', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { tableId, customerId, lines, couponCode, sessionId } = req.body;
    const finalLines = lines || [];
    const ts = Date.now().toString().slice(-6);
    const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const orderNumber = `ORD-${ts}${rand}`;
    const { processedLines, subtotal, taxAmount, discountAmount, total } = await calcOrder(finalLines, couponCode);
    const order = await prisma.order.create({
      data: {
        orderNumber, sessionId, tableId, customerId, couponCode,
        subtotal, taxAmount, discountAmount, total,
        createdById: req.user.id,
        lines: { create: processedLines }
      },
      include: { lines: { include: { product: true } }, customer: true, table: true }
    });
    if (tableId) await prisma.table.update({ where: { id: tableId }, data: { currentOrderId: order.id } });
    res.status(201).json(order);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Something went wrong' }); }
});

router.get('/:id', verifyToken, requireEmployee, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { lines: { include: { product: { include: { category: true } } } }, customer: true, table: true, kdsTicket: true }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.put('/:id/send-kitchen', verifyToken, requireEmployee, async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'SENT_TO_KITCHEN' },
      include: { lines: { include: { product: true } }, table: true }
    });
    let ticket = await prisma.kdsTicket.findUnique({ where: { orderId: order.id } });
    const isNew = !ticket;
    if (isNew) ticket = await prisma.kdsTicket.create({ data: { orderId: order.id, stage: 'TO_COOK' } });

    // Fetch the full ticket details to match the GET /kds/tickets schema
    const fullTicket = await prisma.kdsTicket.findUnique({
      where: { id: ticket.id },
      include: {
        order: {
          include: {
            lines: {
              include: {
                product: true
              }
            },
            table: true,
            customer: true
          }
        }
      }
    });

    const io = req.app.get('io');
    if (isNew) {
      io.to('kds-room').emit('new-order', fullTicket);
    } else {
      io.to('kds-room').emit('ticket-updated', fullTicket);
    }
    res.json(order);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Something went wrong' }); }
});

router.put('/:id/pay', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { paymentMethod, paymentReference } = req.body;
    if (!paymentMethod) return res.status(400).json({ error: 'Payment method required' });
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paymentMethod, paymentReference },
      include: { lines: { include: { product: true } }, customer: true, table: true }
    });
    if (order.tableId) await prisma.table.update({ where: { id: order.tableId }, data: { currentOrderId: null } });
    await prisma.posSession.update({ where: { id: order.sessionId }, data: { lastSaleAmount: order.total, totalOrders: { increment: 1 }, totalRevenue: { increment: order.total } } });
    const io = req.app.get('io');
    io.to('kds-room').emit('order-paid', { orderId: order.id });
    res.json(order);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.put('/:id/cancel', verifyToken, requireEmployee, async (req, res) => {
  try {
    const existing = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { kdsTicket: true }
    });
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (existing.status === 'READY') {
      return res.status(400).json({ error: 'Cannot cancel an order that is ready from the kitchen. Please complete the payment.' });
    }
    
    if (existing.kdsTicket) {
      await prisma.kdsTicket.delete({ where: { id: existing.kdsTicket.id } });
    }

    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    if (order.tableId) await prisma.table.update({ where: { id: order.tableId }, data: { currentOrderId: null } });

    const io = req.app.get('io');
    io.to('kds-room').emit('order-cancelled', { orderId: order.id });

    res.json(order);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});
router.put('/:id', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { tableId, customerId, lines, couponCode } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { lines: true }
    });
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (existingOrder.status !== 'DRAFT' && existingOrder.status !== 'SENT_TO_KITCHEN' && existingOrder.status !== 'READY') {
      return res.status(400).json({ error: 'Only draft, kitchen, or ready orders can be updated' });
    }

    const finalLines = lines || [];
    const { processedLines, subtotal, taxAmount, discountAmount, total } = await calcOrder(finalLines, couponCode);

    const order = await prisma.$transaction(async (tx) => {
      // Delete old lines
      await tx.orderLine.deleteMany({ where: { orderId: id } });

      // Update order
      const updated = await tx.order.update({
        where: { id },
        data: {
          tableId: tableId || null,
          customerId: customerId || null,
          couponCode: couponCode || null,
          subtotal,
          taxAmount,
          discountAmount,
          total,
          lines: { create: processedLines }
        },
        include: { lines: { include: { product: true } }, customer: true, table: true }
      });

      // Update table currentOrderId
      const oldTableId = existingOrder.tableId;
      if (oldTableId !== tableId) {
        if (oldTableId) {
          await tx.table.update({ where: { id: oldTableId }, data: { currentOrderId: null } });
        }
        if (tableId) {
          await tx.table.update({ where: { id: tableId }, data: { currentOrderId: id } });
        }
      } else if (tableId) {
        await tx.table.update({ where: { id: tableId }, data: { currentOrderId: id } });
      }

      return updated;
    });

    // Check if there is an active KDS ticket for this order to notify the KDS room in real-time
    const ticket = await prisma.kdsTicket.findUnique({ where: { orderId: order.id } });
    if (ticket) {
      const fullTicket = await prisma.kdsTicket.findUnique({
        where: { id: ticket.id },
        include: {
          order: {
            include: {
              lines: {
                include: {
                  product: true
                }
              },
              table: true,
              customer: true
            }
          }
        }
      });
      const io = req.app.get('io');
      io.to('kds-room').emit('ticket-updated', fullTicket);
    }

    res.json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
router.post('/:id/send-receipt', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address required' });

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        lines: { include: { product: true } },
        table: true,
        customer: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    await sendReceiptEmail(email, order);
    res.json({ message: `Receipt sent to ${email}` });
  } catch (e) {
    console.error('Email error:', e);
    res.status(500).json({ error: 'Failed to send email. Check EMAIL_USER and EMAIL_PASS in .env' });
  }
});

module.exports = router;
