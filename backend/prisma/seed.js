/**
 * Cafe POS — Complete Demo Seed
 * Run: npx prisma db seed
 * Tells the story of a busy cafe morning.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

/* ─── helpers ─────────────────────────────────────────── */
const today9am = () => {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
};
const minsAgo = (n) => new Date(Date.now() - n * 60 * 1000);

async function main() {
  console.log('🌱 Seeding Cafe POS demo data…');

  /* ── 1. USERS ──────────────────────────────────────── */
  const adminPw = await bcrypt.hash('Admin@123', 12);
  const empPw1  = await bcrypt.hash('Rahul@123', 12);
  const empPw2  = await bcrypt.hash('Priya@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cafe.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@cafe.com', password: adminPw, role: 'ADMIN' },
  });
  const rahul = await prisma.user.upsert({
    where: { email: 'rahul@cafe.com' },
    update: {},
    create: { name: 'Rahul Sharma', email: 'rahul@cafe.com', password: empPw1, role: 'EMPLOYEE' },
  });
  const priya = await prisma.user.upsert({
    where: { email: 'priya@cafe.com' },
    update: {},
    create: { name: 'Priya Patel', email: 'priya@cafe.com', password: empPw2, role: 'EMPLOYEE' },
  });
  console.log('  ✅ Users created');

  /* ── 2. CATEGORIES ─────────────────────────────────── */
  const [hotDrinks, coldDrinks, snacks, mains, desserts] = await Promise.all([
    prisma.productCategory.upsert({ where: { name: 'Hot Drinks' }, update: {}, create: { name: 'Hot Drinks', color: '#E53E3E' } }),
    prisma.productCategory.upsert({ where: { name: 'Cold Drinks' }, update: {}, create: { name: 'Cold Drinks', color: '#3182CE' } }),
    prisma.productCategory.upsert({ where: { name: 'Snacks' }, update: {}, create: { name: 'Snacks', color: '#DD6B20' } }),
    prisma.productCategory.upsert({ where: { name: 'Mains' }, update: {}, create: { name: 'Mains', color: '#38A169' } }),
    prisma.productCategory.upsert({ where: { name: 'Desserts' }, update: {}, create: { name: 'Desserts', color: '#805AD5' } }),
  ]);
  console.log('  ✅ Categories created');

  /* ── 3. PRODUCTS ───────────────────────────────────── */
  const productDefs = [
    // Hot Drinks
    { name: 'Espresso',        categoryId: hotDrinks.id,  price: 80,  unitOfMeasure: 'cup',  tax: 5, showOnKds: true },
    { name: 'Cappuccino',      categoryId: hotDrinks.id,  price: 120, unitOfMeasure: 'cup',  tax: 5, showOnKds: true },
    { name: 'Masala Chai',     categoryId: hotDrinks.id,  price: 60,  unitOfMeasure: 'cup',  tax: 5, showOnKds: true },
    // Cold Drinks
    { name: 'Cold Coffee',     categoryId: coldDrinks.id, price: 150, unitOfMeasure: 'glass', tax: 5, showOnKds: true },
    { name: 'Mango Lassi',     categoryId: coldDrinks.id, price: 120, unitOfMeasure: 'glass', tax: 5, showOnKds: false },
    { name: 'Iced Americano',  categoryId: coldDrinks.id, price: 140, unitOfMeasure: 'glass', tax: 5, showOnKds: true },
    // Snacks
    { name: 'Veg Sandwich',    categoryId: snacks.id,     price: 130, unitOfMeasure: 'piece', tax: 5, showOnKds: true },
    { name: 'Cheese Toast',    categoryId: snacks.id,     price: 110, unitOfMeasure: 'piece', tax: 5, showOnKds: true },
    // Mains
    { name: 'Paneer Pasta',    categoryId: mains.id,      price: 220, unitOfMeasure: 'plate', tax: 5, showOnKds: true },
    { name: 'Club Sandwich',   categoryId: mains.id,      price: 180, unitOfMeasure: 'piece', tax: 5, showOnKds: true },
    // Desserts
    { name: 'Chocolate Cake',  categoryId: desserts.id,   price: 140, unitOfMeasure: 'slice', tax: 5, showOnKds: true },
    { name: 'Gulab Jamun',     categoryId: desserts.id,   price: 80,  unitOfMeasure: 'plate', tax: 5, showOnKds: false },
  ];

  const products = {};
  for (const def of productDefs) {
    let p = await prisma.product.findFirst({ where: { name: def.name } });
    if (!p) p = await prisma.product.create({ data: def });
    products[p.name] = p;
  }
  console.log('  ✅ Products created (12)');

  /* ── 4. PAYMENT METHODS ────────────────────────────── */
  const pmDefs = [
    { name: 'CASH', isEnabled: true },
    { name: 'CARD', isEnabled: true },
    { name: 'UPI',  isEnabled: true, upiId: 'cafe@upi' },
  ];
  for (const pm of pmDefs) {
    const exists = await prisma.paymentMethod.findFirst({ where: { name: pm.name } });
    if (!exists) await prisma.paymentMethod.create({ data: pm });
  }
  console.log('  ✅ Payment methods created');

  /* ── 5. FLOORS & TABLES ────────────────────────────── */
  let groundFloor = await prisma.floor.findFirst({ where: { name: 'Ground Floor' } });
  if (!groundFloor) groundFloor = await prisma.floor.create({ data: { name: 'Ground Floor' } });

  let rooftop = await prisma.floor.findFirst({ where: { name: 'Rooftop' } });
  if (!rooftop) rooftop = await prisma.floor.create({ data: { name: 'Rooftop' } });

  const tablesDef = [
    { tableNumber: 'T1', seats: 2, floorId: groundFloor.id },
    { tableNumber: 'T2', seats: 4, floorId: groundFloor.id },
    { tableNumber: 'T3', seats: 4, floorId: groundFloor.id },
    { tableNumber: 'T4', seats: 6, floorId: groundFloor.id },
    { tableNumber: 'T5', seats: 2, floorId: groundFloor.id },
    { tableNumber: 'R1', seats: 4, floorId: rooftop.id    },
    { tableNumber: 'R2', seats: 4, floorId: rooftop.id    },
    { tableNumber: 'R3', seats: 6, floorId: rooftop.id    },
  ];

  const tables = {};
  for (const def of tablesDef) {
    let t = await prisma.table.findFirst({ where: { tableNumber: def.tableNumber } });
    if (!t) t = await prisma.table.create({ data: { ...def, isActive: true } });
    tables[t.tableNumber] = t;
  }
  console.log('  ✅ Floors & tables created');

  /* ── 6. COUPONS ────────────────────────────────────── */
  await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: { code: 'WELCOME20', discountType: 'PERCENTAGE', discountValue: 20, isActive: true },
  });
  await prisma.coupon.upsert({
    where: { code: 'SAVE50' },
    update: {},
    create: { code: 'SAVE50', discountType: 'FIXED', discountValue: 50, isActive: true },
  });
  await prisma.coupon.upsert({
    where: { code: 'FLAT10' },
    update: {},
    create: { code: 'FLAT10', discountType: 'PERCENTAGE', discountValue: 10, isActive: true },
  });
  console.log('  ✅ Coupons created (WELCOME20, SAVE50, FLAT10)');

  /* ── 7. PROMOTION ──────────────────────────────────── */
  const existingPromo = await prisma.promotion.findFirst({ where: { name: 'Happy Hour Deal' } });
  if (!existingPromo) {
    await prisma.promotion.create({
      data: {
        name: 'Happy Hour Deal',
        discountType: 'PERCENTAGE',
        discountValue: 5,
        applyTo: 'ORDER',
        minOrderAmount: 300,
        isActive: true,
      },
    });
  }
  console.log('  ✅ Promotion created (5% off orders ≥ ₹300)');

  /* ── 8. OPEN POS SESSION ───────────────────────────── */
  // Close any stale open sessions first
  await prisma.posSession.updateMany({
    where: { status: 'OPEN' },
    data: { status: 'CLOSED', closedAt: new Date() },
  });

  const session = await prisma.posSession.create({
    data: {
      openedById: rahul.id,
      status: 'OPEN',
      openedAt: today9am(),
    },
  });
  console.log('  ✅ POS session opened (9:00 AM today, by Rahul)');

  /* ── pre-clean: delete any existing seeded orders ──── */
  const seedOrderNums = ['ORD-001','ORD-002','ORD-003','ORD-004','ORD-005','ORD-006','ORD-007','ORD-008'];
  await prisma.order.deleteMany({ where: { orderNumber: { in: seedOrderNums } } });

  /* ── helper: build order total ────────────────────── */
  const buildOrder = (lines) => {
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const taxAmount = subtotal * 0.05;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  /* ── 9. ORDERS ─────────────────────────────────────── */

  // ORD-001: PAID — Cash — Table T1
  {
    const lines = [
      { productId: products['Cappuccino'].id,    quantity: 2, unitPrice: 120 },
      { productId: products['Veg Sandwich'].id,  quantity: 2, unitPrice: 130 },
    ];
    const { subtotal, taxAmount, total } = buildOrder(lines);
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-001',
        sessionId: session.id,
        createdById: rahul.id,
        tableId: tables['T1'].id,
        status: 'PAID',
        subtotal, taxAmount, discountAmount: 0, total,
        paymentMethod: 'CASH',
        createdAt: minsAgo(95),
        lines: { create: lines.map(l => ({ ...l, lineTotal: l.unitPrice * l.quantity })) },
      },
    });
    await prisma.table.update({ where: { id: tables['T1'].id }, data: { currentOrderId: null } });
  }

  // ORD-002: PAID — UPI — Table T2 — with WELCOME20 coupon
  {
    const lines = [
      { productId: products['Cold Coffee'].id,   quantity: 2, unitPrice: 150 },
      { productId: products['Paneer Pasta'].id,  quantity: 1, unitPrice: 220 },
      { productId: products['Chocolate Cake'].id,quantity: 1, unitPrice: 140 },
    ];
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0); // 660
    const discountAmount = subtotal * 0.20; // WELCOME20 = 20%
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * 0.05;
    const total = afterDiscount + taxAmount;
    await prisma.order.create({
      data: {
        orderNumber: 'ORD-002',
        sessionId: session.id,
        createdById: priya.id,
        tableId: tables['T2'].id,
        status: 'PAID',
        subtotal, taxAmount, discountAmount, total,
        paymentMethod: 'UPI',
        couponCode: 'WELCOME20',
        createdAt: minsAgo(75),
        lines: { create: lines.map(l => ({ ...l, lineTotal: l.unitPrice * l.quantity })) },
      },
    });
    await prisma.table.update({ where: { id: tables['T2'].id }, data: { currentOrderId: null } });
  }

  // ORD-003: PAID — CARD — Table R1
  {
    const lines = [
      { productId: products['Espresso'].id,      quantity: 3, unitPrice: 80 },
      { productId: products['Cheese Toast'].id,  quantity: 3, unitPrice: 110 },
    ];
    const { subtotal, taxAmount, total } = buildOrder(lines);
    await prisma.order.create({
      data: {
        orderNumber: 'ORD-003',
        sessionId: session.id,
        createdById: rahul.id,
        tableId: tables['R1'].id,
        status: 'PAID',
        subtotal, taxAmount, discountAmount: 0, total,
        paymentMethod: 'CARD',
        paymentReference: 'TXN-4829301',
        createdAt: minsAgo(55),
        lines: { create: lines.map(l => ({ ...l, lineTotal: l.unitPrice * l.quantity })) },
      },
    });
  }

  // ORD-004: PAID — CASH — Takeaway (no table) — with SAVE50 coupon
  {
    const lines = [
      { productId: products['Club Sandwich'].id, quantity: 1, unitPrice: 180 },
      { productId: products['Mango Lassi'].id,   quantity: 2, unitPrice: 120 },
    ];
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0); // 420
    const discountAmount = 50; // SAVE50
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * 0.05;
    const total = afterDiscount + taxAmount;
    await prisma.order.create({
      data: {
        orderNumber: 'ORD-004',
        sessionId: session.id,
        createdById: priya.id,
        status: 'PAID',
        subtotal, taxAmount, discountAmount, total,
        paymentMethod: 'CASH',
        couponCode: 'SAVE50',
        createdAt: minsAgo(40),
        lines: { create: lines.map(l => ({ ...l, lineTotal: l.unitPrice * l.quantity })) },
      },
    });
  }
  console.log('  ✅ 4 PAID orders created');

  // ORD-005: SENT_TO_KITCHEN — Table T3 (shows on KDS)
  {
    const lines = [
      { productId: products['Masala Chai'].id,   quantity: 2, unitPrice: 60 },
      { productId: products['Paneer Pasta'].id,  quantity: 1, unitPrice: 220 },
      { productId: products['Gulab Jamun'].id,   quantity: 2, unitPrice: 80 },
    ];
    const { subtotal, taxAmount, total } = buildOrder(lines);
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-005',
        sessionId: session.id,
        createdById: rahul.id,
        tableId: tables['T3'].id,
        status: 'SENT_TO_KITCHEN',
        subtotal, taxAmount, discountAmount: 0, total,
        createdAt: minsAgo(12),
        lines: {
          create: lines.map(l => ({
            ...l,
            lineTotal: l.unitPrice * l.quantity,
            kdsStatus: 'PENDING',
          })),
        },
      },
      include: { lines: true, table: true },
    });
    await prisma.table.update({ where: { id: tables['T3'].id }, data: { currentOrderId: order.id } });

    // Create KDS ticket in PREPARING stage (to show action already in progress)
    await prisma.kdsTicket.create({
      data: {
        orderId: order.id,
        stage: 'PREPARING',
        createdAt: minsAgo(10),
      },
    });
  }

  // ORD-006: SENT_TO_KITCHEN — Table R2 (shows on KDS — URGENT, 18 min old)
  {
    const lines = [
      { productId: products['Cold Coffee'].id,     quantity: 1, unitPrice: 150 },
      { productId: products['Club Sandwich'].id,   quantity: 2, unitPrice: 180 },
      { productId: products['Chocolate Cake'].id,  quantity: 1, unitPrice: 140 },
    ];
    const { subtotal, taxAmount, total } = buildOrder(lines);
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-006',
        sessionId: session.id,
        createdById: priya.id,
        tableId: tables['R2'].id,
        status: 'SENT_TO_KITCHEN',
        subtotal, taxAmount, discountAmount: 0, total,
        createdAt: minsAgo(18),
        lines: {
          create: lines.map(l => ({
            ...l,
            lineTotal: l.unitPrice * l.quantity,
            kdsStatus: 'PENDING',
          })),
        },
      },
      include: { lines: true, table: true },
    });
    await prisma.table.update({ where: { id: tables['R2'].id }, data: { currentOrderId: order.id } });

    // KDS ticket still TO_COOK (urgent — shows pulsing red border)
    await prisma.kdsTicket.create({
      data: {
        orderId: order.id,
        stage: 'TO_COOK',
        createdAt: minsAgo(18),
      },
    });
  }
  console.log('  ✅ 2 SENT_TO_KITCHEN orders created (visible on KDS)');

  // ORD-007: DRAFT — Table T4
  {
    const lines = [
      { productId: products['Iced Americano'].id, quantity: 2, unitPrice: 140 },
      { productId: products['Veg Sandwich'].id,   quantity: 1, unitPrice: 130 },
    ];
    const { subtotal, taxAmount, total } = buildOrder(lines);
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-007',
        sessionId: session.id,
        createdById: rahul.id,
        tableId: tables['T4'].id,
        status: 'DRAFT',
        subtotal, taxAmount, discountAmount: 0, total,
        createdAt: minsAgo(5),
        lines: { create: lines.map(l => ({ ...l, lineTotal: l.unitPrice * l.quantity })) },
      },
    });
    await prisma.table.update({ where: { id: tables['T4'].id }, data: { currentOrderId: order.id } });
  }
  console.log('  ✅ 1 DRAFT order created (Table T4 shows as occupied)');

  // ORD-008: CANCELLED — Table T5
  {
    const lines = [
      { productId: products['Cappuccino'].id, quantity: 1, unitPrice: 120 },
    ];
    const { subtotal, taxAmount, total } = buildOrder(lines);
    await prisma.order.create({
      data: {
        orderNumber: 'ORD-008',
        sessionId: session.id,
        createdById: priya.id,
        tableId: tables['T5'].id,
        status: 'CANCELLED',
        subtotal, taxAmount, discountAmount: 0, total,
        createdAt: minsAgo(30),
        lines: { create: lines.map(l => ({ ...l, lineTotal: l.unitPrice * l.quantity })) },
      },
    });
  }
  console.log('  ✅ 1 CANCELLED order created');

  /* ── 10. Session totals snapshot ───────────────────── */
  const paidOrders = await prisma.order.findMany({
    where: { sessionId: session.id, status: 'PAID' },
  });
  const sessionRevenue = paidOrders.reduce((s, o) => s + parseFloat(o.total), 0);
  await prisma.posSession.update({
    where: { id: session.id },
    data: { totalOrders: paidOrders.length, totalRevenue: sessionRevenue },
  });

  console.log('\n🎉 Seed complete! Summary:');
  console.log(`   👤 Users:       3 (1 admin, 2 employees)`);
  console.log(`   🏷️  Categories:  5`);
  console.log(`   🛍️  Products:    12`);
  console.log(`   🪑 Tables:      8 (2 floors)`);
  console.log(`   🎫 Coupons:     3`);
  console.log(`   📋 Orders:      8 (4 PAID, 2 KITCHEN, 1 DRAFT, 1 CANCELLED)`);
  console.log(`   💰 Revenue:     ₹${sessionRevenue.toFixed(2)}`);
  console.log(`\n   🔑 Login: admin@cafe.com / Admin@123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
