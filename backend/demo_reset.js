/**
 * demo_reset.js — Run before every hackathon demo
 * Usage: node demo_reset.js
 *
 * What it does:
 * 1. Closes any stale sessions
 * 2. Deletes all runtime orders, sessions, customers
 * 3. Re-creates 1 OPEN session (started 2 hours ago)
 * 4. Creates 2 live KDS tickets so kitchen looks busy
 * 5. Sets UPI ID + ensures SAVE10 coupon & Happy Hour promo are active
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const minsAgo = (n) => new Date(Date.now() - n * 60 * 1000);

async function main() {
  console.log('\n🔄  Demo Reset Starting…\n');

  /* ── 1. Find the seeded employee (Rahul) ─────────────── */
  const rahul = await prisma.user.findFirst({ where: { email: 'rahul@cafe.com' } });
  const priya = await prisma.user.findFirst({ where: { email: 'priya@cafe.com' } });
  if (!rahul) {
    console.error('❌  Seed data not found. Run: npx prisma db seed first.');
    process.exit(1);
  }

  /* ── 2. Wipe runtime data ────────────────────────────── */
  await prisma.kdsTicket.deleteMany({});
  await prisma.orderLine.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.posSession.deleteMany({});
  await prisma.customer.deleteMany({});
  console.log('  ✅  Cleared: sessions, orders, KDS tickets, customers');

  /* ── 3. Reset table occupancy ────────────────────────── */
  await prisma.table.updateMany({ data: { currentOrderId: null } });
  console.log('  ✅  All tables set to Available');

  /* ── 4. Ensure SAVE10 coupon exists ──────────────────── */
  const save10 = await prisma.coupon.findFirst({ where: { code: 'SAVE10' } });
  if (!save10) {
    await prisma.coupon.create({
      data: { code: 'SAVE10', discountType: 'PERCENTAGE', discountValue: 10, isActive: true },
    });
    console.log('  ✅  Coupon SAVE10 (10% off) created');
  } else {
    await prisma.coupon.update({ where: { id: save10.id }, data: { isActive: true } });
    console.log('  ✅  Coupon SAVE10 confirmed active');
  }

  /* ── 5. Ensure Happy Hour promotion exists ───────────── */
  const promo = await prisma.promotion.findFirst({ where: { name: 'Happy Hour Deal' } });
  if (!promo) {
    await prisma.promotion.create({
      data: {
        name: 'Happy Hour Deal',
        discountType: 'PERCENTAGE',
        discountValue: 5,
        applyTo: 'ORDER',
        minOrderAmount: 500,
        isActive: true,
      },
    });
    console.log('  ✅  Promotion "Happy Hour Deal" (5% off ≥ ₹500) created');
  } else {
    await prisma.promotion.update({ where: { id: promo.id }, data: { isActive: true, minOrderAmount: 500 } });
    console.log('  ✅  Promotion "Happy Hour Deal" confirmed active (≥ ₹500)');
  }

  /* ── 6. Set UPI ID ───────────────────────────────────── */
  await prisma.paymentMethod.updateMany({
    where: { name: 'UPI' },
    data: { isEnabled: true, upiId: 'cafe@ybl' },
  });
  console.log('  ✅  UPI ID set to cafe@ybl');

  /* ── 7. Ensure all payment methods enabled ───────────── */
  await prisma.paymentMethod.updateMany({ data: { isEnabled: true } });
  console.log('  ✅  All payment methods enabled (CASH, CARD, UPI)');

  /* ── 8. Open fresh session (started 2 hours ago) ─────── */
  const session = await prisma.posSession.create({
    data: {
      openedById: rahul.id,
      status: 'OPEN',
      openedAt: minsAgo(120), // looks like a full shift has been running
    },
  });
  console.log(`  ✅  Session OPEN (started 2h ago) — ID: ${session.id.slice(0, 8)}…`);

  /* ── 9. Get products for live orders ─────────────────── */
  const getProduct = async (name) => {
    const p = await prisma.product.findFirst({ where: { name, isActive: true } });
    if (!p) throw new Error(`Product "${name}" not found — run seed first.`);
    return p;
  };

  const cappuccino   = await getProduct('Cappuccino');
  const paneerPasta  = await getProduct('Paneer Pasta');
  const coldCoffee   = await getProduct('Cold Coffee');
  const clubSandwich = await getProduct('Club Sandwich');
  const chocCake     = await getProduct('Chocolate Cake');
  const espresso     = await getProduct('Espresso');
  const vegSandwich  = await getProduct('Veg Sandwich');

  /* ── 10. Get tables ──────────────────────────────────── */
  const t3 = await prisma.table.findFirst({ where: { tableNumber: 'T3' } });
  const r2 = await prisma.table.findFirst({ where: { tableNumber: 'R2' } });
  const t2 = await prisma.table.findFirst({ where: { tableNumber: 'T2' } });

  /* ── 11. Create 3 live orders ────────────────────────── */

  // PAID order (dashboard shows revenue)
  const paidLines = [
    { productId: cappuccino.id,  quantity: 2, unitPrice: parseFloat(cappuccino.price),  lineTotal: parseFloat(cappuccino.price)  * 2 },
    { productId: espresso.id,    quantity: 1, unitPrice: parseFloat(espresso.price),    lineTotal: parseFloat(espresso.price)    * 1 },
  ];
  const paidSubtotal = paidLines.reduce((s, l) => s + l.lineTotal, 0);
  const paidTax = paidSubtotal * 0.05;
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-D01',
      sessionId:   session.id,
      createdById: rahul.id,
      status:      'PAID',
      paymentMethod: 'CASH',
      subtotal:    paidSubtotal,
      taxAmount:   paidTax,
      discountAmount: 0,
      total:       paidSubtotal + paidTax,
      createdAt:   minsAgo(90),
      lines: { create: paidLines },
    },
  });
  await prisma.posSession.update({
    where: { id: session.id },
    data: {
      totalOrders:  { increment: 1 },
      totalRevenue: { increment: paidSubtotal + paidTax },
    },
  });
  console.log('  ✅  PAID order ORD-D01 created (revenue on dashboard)');

  // SENT_TO_KITCHEN: Table T3 — PREPARING (12 min ago) — medium urgency
  const t3Lines = [
    { productId: paneerPasta.id,  quantity: 1, unitPrice: parseFloat(paneerPasta.price),  lineTotal: parseFloat(paneerPasta.price) },
    { productId: cappuccino.id,   quantity: 2, unitPrice: parseFloat(cappuccino.price),   lineTotal: parseFloat(cappuccino.price) * 2 },
    { productId: chocCake.id,     quantity: 1, unitPrice: parseFloat(chocCake.price),     lineTotal: parseFloat(chocCake.price) },
  ];
  const t3Sub = t3Lines.reduce((s, l) => s + l.lineTotal, 0);
  const order_t3 = await prisma.order.create({
    data: {
      orderNumber:  'ORD-D02',
      sessionId:    session.id,
      createdById:  rahul.id,
      tableId:      t3?.id || null,
      status:       'SENT_TO_KITCHEN',
      subtotal:     t3Sub,
      taxAmount:    t3Sub * 0.05,
      discountAmount: 0,
      total:        t3Sub + t3Sub * 0.05,
      createdAt:    minsAgo(12),
      lines: { create: t3Lines.map(l => ({ ...l, kdsStatus: 'PENDING' })) },
    },
  });
  if (t3) await prisma.table.update({ where: { id: t3.id }, data: { currentOrderId: order_t3.id } });
  await prisma.kdsTicket.create({
    data: { orderId: order_t3.id, stage: 'PREPARING', createdAt: minsAgo(10) },
  });
  console.log('  ✅  KDS ticket ORD-D02: Table T3 — PREPARING (12 min old)');

  // SENT_TO_KITCHEN: Table R2 — TO_COOK (20 min ago) — URGENT 🔴
  const r2Lines = [
    { productId: coldCoffee.id,   quantity: 2, unitPrice: parseFloat(coldCoffee.price),   lineTotal: parseFloat(coldCoffee.price) * 2 },
    { productId: clubSandwich.id, quantity: 2, unitPrice: parseFloat(clubSandwich.price),  lineTotal: parseFloat(clubSandwich.price) * 2 },
  ];
  const r2Sub = r2Lines.reduce((s, l) => s + l.lineTotal, 0);
  const order_r2 = await prisma.order.create({
    data: {
      orderNumber:  'ORD-D03',
      sessionId:    session.id,
      createdById:  priya?.id || rahul.id,
      tableId:      r2?.id || null,
      status:       'SENT_TO_KITCHEN',
      subtotal:     r2Sub,
      taxAmount:    r2Sub * 0.05,
      discountAmount: 0,
      total:        r2Sub + r2Sub * 0.05,
      createdAt:    minsAgo(20), // URGENT — over 15 min
      lines: { create: r2Lines.map(l => ({ ...l, kdsStatus: 'PENDING' })) },
    },
  });
  if (r2) await prisma.table.update({ where: { id: r2.id }, data: { currentOrderId: order_r2.id } });
  await prisma.kdsTicket.create({
    data: { orderId: order_r2.id, stage: 'TO_COOK', createdAt: minsAgo(20) },
  });
  console.log('  ✅  KDS ticket ORD-D03: Table R2 — TO_COOK URGENT 🔴 (20 min old)');

  // DRAFT: Table T2 (shows as occupied in floor popup)
  const draftLines = [
    { productId: vegSandwich.id,  quantity: 2, unitPrice: parseFloat(vegSandwich.price),  lineTotal: parseFloat(vegSandwich.price) * 2 },
    { productId: coldCoffee.id,   quantity: 1, unitPrice: parseFloat(coldCoffee.price),   lineTotal: parseFloat(coldCoffee.price) },
  ];
  const draftSub = draftLines.reduce((s, l) => s + l.lineTotal, 0);
  const order_t2 = await prisma.order.create({
    data: {
      orderNumber:  'ORD-D04',
      sessionId:    session.id,
      createdById:  rahul.id,
      tableId:      t2?.id || null,
      status:       'DRAFT',
      subtotal:     draftSub,
      taxAmount:    draftSub * 0.05,
      discountAmount: 0,
      total:        draftSub + draftSub * 0.05,
      createdAt:    minsAgo(5),
      lines: { create: draftLines },
    },
  });
  if (t2) await prisma.table.update({ where: { id: t2.id }, data: { currentOrderId: order_t2.id } });
  console.log('  ✅  DRAFT order ORD-D04: Table T2 appears occupied in floor popup');

  /* ── Summary ─────────────────────────────────────────── */
  console.log('\n══════════════════════════════════════════');
  console.log('  🚀  DEMO READY! Pre-flight checklist:');
  console.log('══════════════════════════════════════════');
  console.log('  ✅  Session OPEN (2h running)');
  console.log('  ✅  KDS has 2 live tickets (T3 PREPARING, R2 URGENT)');
  console.log('  ✅  Table T2 occupied (Draft), T3 + R2 occupied');
  console.log('  ✅  Tables T1, T4, T5, R1, R3 available (green)');
  console.log('  ✅  Coupon SAVE10 active (10% off)');
  console.log('  ✅  Coupon WELCOME20 active (20% off)');
  console.log('  ✅  Coupon SAVE50 active (₹50 flat)');
  console.log('  ✅  Promotion: 5% off orders ≥ ₹500');
  console.log('  ✅  UPI ID: cafe@ybl');
  console.log('  ✅  All payment methods: CASH, CARD, UPI');
  console.log('\n  🔑  Login: admin@cafe.com / Admin@123');
  console.log('  🍳  Kitchen: open /kitchen in separate tab');
  console.log('\n  💡  60-sec demo order path:');
  console.log('      Table T1 → Cappuccino×2 + Paneer Pasta → Kitchen');
  console.log('      → See KDS update live → Pay UPI → Show QR');
  console.log('══════════════════════════════════════════\n');
}

main()
  .catch((e) => { console.error('\n❌ Reset failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
