/**
 * bulk_seed.js — Add bulk demo data to both databases
 * Usage:
 *   node bulk_seed.js                         ← local DB (.env)
 *   DATABASE_URL="<prod_url>" node bulk_seed.js ← deployed DB
 *
 * Adds (idempotent — safe to run multiple times):
 *   20 categories, 100 products, 10 coupons,
 *   25 orders, 20 tables across 3 floors, 5 employees
 *   → for admin@cafe.com AND meetc8030@gmail.com
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const ORG_ID = '00000000-0000-0000-0000-000000000000';
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const minsAgo = (n) => new Date(Date.now() - n * 60 * 1000);
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  console.log('\n🌱  Bulk Seed Starting…\n');

  /* ── 0. Ensure org exists ──────────────────────────── */
  await prisma.organization.upsert({
    where: { id: ORG_ID },
    update: { name: 'Default Cafe' },
    create: { id: ORG_ID, name: 'Default Cafe' },
  });

  /* ── 1. Users ──────────────────────────────────────── */
  const adminPw   = await bcrypt.hash('Admin@123', 12);
  const meetPw    = await bcrypt.hash('Meet@8030', 12);
  const empPw     = await bcrypt.hash('Emp@1234', 12);

  // Ensure admin@cafe.com exists
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cafe.com' },
    update: { organizationId: ORG_ID },
    create: { name: 'Admin User', email: 'admin@cafe.com', password: adminPw, role: 'ADMIN', organizationId: ORG_ID },
  });

  // Add meetc8030@gmail.com as admin
  const meetAdmin = await prisma.user.upsert({
    where: { email: 'meetc8030@gmail.com' },
    update: { organizationId: ORG_ID, role: 'ADMIN' },
    create: { name: 'Meet Chauhan', email: 'meetc8030@gmail.com', password: meetPw, role: 'ADMIN', organizationId: ORG_ID },
  });

  // 5 new employees
  const employeeDefs = [
    { name: 'Rahul Sharma',  email: 'rahul@cafe.com',  pass: 'Rahul@123'  },
    { name: 'Priya Patel',   email: 'priya@cafe.com',  pass: 'Priya@123'  },
    { name: 'Amit Kumar',    email: 'amit@cafe.com',   pass: 'Emp@1234'   },
    { name: 'Sneha Mehta',   email: 'sneha@cafe.com',  pass: 'Emp@1234'   },
    { name: 'Rohan Verma',   email: 'rohan@cafe.com',  pass: 'Emp@1234'   },
  ];
  const employees = [];
  for (const def of employeeDefs) {
    const pw = await bcrypt.hash(def.pass, 12);
    const u = await prisma.user.upsert({
      where: { email: def.email },
      update: { organizationId: ORG_ID },
      create: { name: def.name, email: def.email, password: pw, role: 'EMPLOYEE', organizationId: ORG_ID },
    });
    employees.push(u);
  }
  console.log(`  ✅  Users: admin@cafe.com, meetc8030@gmail.com + 5 employees`);

  /* ── 2. 20 Categories ──────────────────────────────── */
  const categoryDefs = [
    { name: 'Hot Drinks',      color: '#E53E3E' },
    { name: 'Cold Drinks',     color: '#3182CE' },
    { name: 'Snacks',          color: '#DD6B20' },
    { name: 'Mains',           color: '#38A169' },
    { name: 'Desserts',        color: '#805AD5' },
    { name: 'Juices',          color: '#F6AD55' },
    { name: 'Milkshakes',      color: '#9F7AEA' },
    { name: 'Salads',          color: '#68D391' },
    { name: 'Soups',           color: '#FC8181' },
    { name: 'Starters',        color: '#F6E05E' },
    { name: 'Burgers',         color: '#FBBF24' },
    { name: 'Pizza',           color: '#EF4444' },
    { name: 'Pasta',           color: '#F97316' },
    { name: 'Rice Bowls',      color: '#10B981' },
    { name: 'Wraps & Rolls',   color: '#06B6D4' },
    { name: 'Beverages',       color: '#8B5CF6' },
    { name: 'Bakery',          color: '#F59E0B' },
    { name: 'Ice Cream',       color: '#EC4899' },
    { name: 'Health Drinks',   color: '#84CC16' },
    { name: 'Specials',        color: '#14B8A6' },
  ];

  const cats = {};
  for (const def of categoryDefs) {
    const c = await prisma.productCategory.upsert({
      where: { organizationId_name: { organizationId: ORG_ID, name: def.name } },
      update: {},
      create: { ...def, organizationId: ORG_ID },
    });
    cats[def.name] = c;
  }
  console.log('  ✅  20 categories created/verified');

  /* ── 3. 100 Products ───────────────────────────────── */
  const productDefs = [
    // Hot Drinks (10)
    { name: 'Espresso',           cat: 'Hot Drinks',    price: 80,  tax: 5,  uom: 'cup'   },
    { name: 'Cappuccino',         cat: 'Hot Drinks',    price: 120, tax: 5,  uom: 'cup'   },
    { name: 'Latte',              cat: 'Hot Drinks',    price: 130, tax: 5,  uom: 'cup'   },
    { name: 'Masala Chai',        cat: 'Hot Drinks',    price: 60,  tax: 5,  uom: 'cup'   },
    { name: 'Green Tea',          cat: 'Hot Drinks',    price: 90,  tax: 5,  uom: 'cup'   },
    { name: 'Hot Chocolate',      cat: 'Hot Drinks',    price: 140, tax: 5,  uom: 'cup'   },
    { name: 'Americano',          cat: 'Hot Drinks',    price: 100, tax: 5,  uom: 'cup'   },
    { name: 'Flat White',         cat: 'Hot Drinks',    price: 130, tax: 5,  uom: 'cup'   },
    { name: 'Cortado',            cat: 'Hot Drinks',    price: 110, tax: 5,  uom: 'cup'   },
    { name: 'Macchiato',          cat: 'Hot Drinks',    price: 120, tax: 5,  uom: 'cup'   },
    // Cold Drinks (10)
    { name: 'Cold Coffee',        cat: 'Cold Drinks',   price: 150, tax: 5,  uom: 'glass' },
    { name: 'Iced Americano',     cat: 'Cold Drinks',   price: 140, tax: 5,  uom: 'glass' },
    { name: 'Cold Brew',          cat: 'Cold Drinks',   price: 180, tax: 5,  uom: 'glass' },
    { name: 'Mango Lassi',        cat: 'Cold Drinks',   price: 120, tax: 5,  uom: 'glass' },
    { name: 'Lemon Soda',         cat: 'Cold Drinks',   price: 80,  tax: 5,  uom: 'glass' },
    { name: 'Virgin Mojito',      cat: 'Cold Drinks',   price: 130, tax: 5,  uom: 'glass' },
    { name: 'Iced Tea',           cat: 'Cold Drinks',   price: 100, tax: 5,  uom: 'glass' },
    { name: 'Sparkling Water',    cat: 'Cold Drinks',   price: 60,  tax: 0,  uom: 'bottle'},
    { name: 'Oreo Shake',         cat: 'Cold Drinks',   price: 160, tax: 5,  uom: 'glass' },
    { name: 'Strawberry Shake',   cat: 'Cold Drinks',   price: 150, tax: 5,  uom: 'glass' },
    // Snacks (5)
    { name: 'Veg Sandwich',       cat: 'Snacks',        price: 130, tax: 5,  uom: 'piece' },
    { name: 'Cheese Toast',       cat: 'Snacks',        price: 110, tax: 5,  uom: 'piece' },
    { name: 'Nachos',             cat: 'Snacks',        price: 180, tax: 10, uom: 'plate' },
    { name: 'French Fries',       cat: 'Snacks',        price: 120, tax: 10, uom: 'plate' },
    { name: 'Onion Rings',        cat: 'Snacks',        price: 140, tax: 10, uom: 'plate' },
    // Mains (5)
    { name: 'Paneer Pasta',       cat: 'Mains',         price: 220, tax: 5,  uom: 'plate' },
    { name: 'Club Sandwich',      cat: 'Mains',         price: 180, tax: 5,  uom: 'piece' },
    { name: 'Grilled Chicken',    cat: 'Mains',         price: 280, tax: 10, uom: 'plate' },
    { name: 'Veg Platter',        cat: 'Mains',         price: 250, tax: 5,  uom: 'plate' },
    { name: 'Fish & Chips',       cat: 'Mains',         price: 320, tax: 10, uom: 'plate' },
    // Desserts (5)
    { name: 'Chocolate Cake',     cat: 'Desserts',      price: 140, tax: 5,  uom: 'slice' },
    { name: 'Gulab Jamun',        cat: 'Desserts',      price: 80,  tax: 5,  uom: 'plate' },
    { name: 'Tiramisu',           cat: 'Desserts',      price: 180, tax: 5,  uom: 'slice' },
    { name: 'Brownie',            cat: 'Desserts',      price: 120, tax: 5,  uom: 'piece' },
    { name: 'Cheesecake',         cat: 'Desserts',      price: 160, tax: 5,  uom: 'slice' },
    // Juices (5)
    { name: 'Orange Juice',       cat: 'Juices',        price: 100, tax: 0,  uom: 'glass' },
    { name: 'Watermelon Juice',   cat: 'Juices',        price: 90,  tax: 0,  uom: 'glass' },
    { name: 'Pineapple Juice',    cat: 'Juices',        price: 100, tax: 0,  uom: 'glass' },
    { name: 'Mixed Fruit Juice',  cat: 'Juices',        price: 120, tax: 0,  uom: 'glass' },
    { name: 'Sugarcane Juice',    cat: 'Juices',        price: 70,  tax: 0,  uom: 'glass' },
    // Milkshakes (5)
    { name: 'Chocolate Shake',    cat: 'Milkshakes',    price: 160, tax: 5,  uom: 'glass' },
    { name: 'Vanilla Shake',      cat: 'Milkshakes',    price: 150, tax: 5,  uom: 'glass' },
    { name: 'Mango Shake',        cat: 'Milkshakes',    price: 160, tax: 5,  uom: 'glass' },
    { name: 'Banana Shake',       cat: 'Milkshakes',    price: 140, tax: 5,  uom: 'glass' },
    { name: 'Butterscotch Shake', cat: 'Milkshakes',    price: 170, tax: 5,  uom: 'glass' },
    // Salads (5)
    { name: 'Caesar Salad',       cat: 'Salads',        price: 180, tax: 5,  uom: 'bowl'  },
    { name: 'Greek Salad',        cat: 'Salads',        price: 160, tax: 5,  uom: 'bowl'  },
    { name: 'Garden Salad',       cat: 'Salads',        price: 140, tax: 5,  uom: 'bowl'  },
    { name: 'Pasta Salad',        cat: 'Salads',        price: 170, tax: 5,  uom: 'bowl'  },
    { name: 'Fruit Salad',        cat: 'Salads',        price: 120, tax: 0,  uom: 'bowl'  },
    // Soups (5)
    { name: 'Tomato Soup',        cat: 'Soups',         price: 120, tax: 5,  uom: 'bowl'  },
    { name: 'Mushroom Soup',      cat: 'Soups',         price: 140, tax: 5,  uom: 'bowl'  },
    { name: 'Sweet Corn Soup',    cat: 'Soups',         price: 130, tax: 5,  uom: 'bowl'  },
    { name: 'Hot & Sour Soup',    cat: 'Soups',         price: 130, tax: 5,  uom: 'bowl'  },
    { name: 'Veg Clear Soup',     cat: 'Soups',         price: 110, tax: 5,  uom: 'bowl'  },
    // Starters (5)
    { name: 'Paneer Tikka',       cat: 'Starters',      price: 250, tax: 10, uom: 'plate' },
    { name: 'Veg Spring Rolls',   cat: 'Starters',      price: 160, tax: 10, uom: 'plate' },
    { name: 'Chicken Wings',      cat: 'Starters',      price: 280, tax: 10, uom: 'plate' },
    { name: 'Stuffed Mushrooms',  cat: 'Starters',      price: 180, tax: 10, uom: 'plate' },
    { name: 'Bruschetta',         cat: 'Starters',      price: 170, tax: 10, uom: 'plate' },
    // Burgers (5)
    { name: 'Veg Burger',         cat: 'Burgers',       price: 180, tax: 10, uom: 'piece' },
    { name: 'Cheese Burger',      cat: 'Burgers',       price: 220, tax: 10, uom: 'piece' },
    { name: 'Chicken Burger',     cat: 'Burgers',       price: 240, tax: 10, uom: 'piece' },
    { name: 'Double Patty Burger',cat: 'Burgers',       price: 280, tax: 10, uom: 'piece' },
    { name: 'Mushroom Burger',    cat: 'Burgers',       price: 200, tax: 10, uom: 'piece' },
    // Pizza (5)
    { name: 'Margherita Pizza',   cat: 'Pizza',         price: 280, tax: 10, uom: 'piece' },
    { name: 'Veg Supreme Pizza',  cat: 'Pizza',         price: 320, tax: 10, uom: 'piece' },
    { name: 'Pepperoni Pizza',    cat: 'Pizza',         price: 360, tax: 10, uom: 'piece' },
    { name: 'BBQ Chicken Pizza',  cat: 'Pizza',         price: 380, tax: 10, uom: 'piece' },
    { name: 'Farmhouse Pizza',    cat: 'Pizza',         price: 300, tax: 10, uom: 'piece' },
    // Pasta (5)
    { name: 'Penne Arrabbiata',   cat: 'Pasta',         price: 200, tax: 5,  uom: 'plate' },
    { name: 'Spaghetti Aglio',    cat: 'Pasta',         price: 210, tax: 5,  uom: 'plate' },
    { name: 'Mac & Cheese',       cat: 'Pasta',         price: 220, tax: 5,  uom: 'plate' },
    { name: 'Pesto Pasta',        cat: 'Pasta',         price: 230, tax: 5,  uom: 'plate' },
    { name: 'Lasagna',            cat: 'Pasta',         price: 250, tax: 5,  uom: 'plate' },
    // Rice Bowls (5)
    { name: 'Veg Biryani',        cat: 'Rice Bowls',    price: 200, tax: 5,  uom: 'bowl'  },
    { name: 'Chicken Biryani',    cat: 'Rice Bowls',    price: 260, tax: 5,  uom: 'bowl'  },
    { name: 'Fried Rice',         cat: 'Rice Bowls',    price: 180, tax: 5,  uom: 'bowl'  },
    { name: 'Thai Basil Bowl',    cat: 'Rice Bowls',    price: 220, tax: 5,  uom: 'bowl'  },
    { name: 'Quinoa Bowl',        cat: 'Rice Bowls',    price: 240, tax: 0,  uom: 'bowl'  },
    // Wraps & Rolls (5)
    { name: 'Paneer Wrap',        cat: 'Wraps & Rolls', price: 160, tax: 5,  uom: 'piece' },
    { name: 'Chicken Wrap',       cat: 'Wraps & Rolls', price: 180, tax: 5,  uom: 'piece' },
    { name: 'Veg Frankie',        cat: 'Wraps & Rolls', price: 120, tax: 5,  uom: 'piece' },
    { name: 'Cheese Wrap',        cat: 'Wraps & Rolls', price: 150, tax: 5,  uom: 'piece' },
    { name: 'Falafel Wrap',       cat: 'Wraps & Rolls', price: 170, tax: 5,  uom: 'piece' },
    // Bakery (5)
    { name: 'Croissant',          cat: 'Bakery',        price: 90,  tax: 0,  uom: 'piece' },
    { name: 'Blueberry Muffin',   cat: 'Bakery',        price: 100, tax: 0,  uom: 'piece' },
    { name: 'Cinnamon Roll',      cat: 'Bakery',        price: 110, tax: 0,  uom: 'piece' },
    { name: 'Banana Bread',       cat: 'Bakery',        price: 120, tax: 0,  uom: 'slice' },
    { name: 'Sourdough Toast',    cat: 'Bakery',        price: 80,  tax: 0,  uom: 'slice' },
    // Ice Cream (3)
    { name: 'Vanilla Ice Cream',  cat: 'Ice Cream',     price: 90,  tax: 0,  uom: 'scoop' },
    { name: 'Chocolate Ice Cream',cat: 'Ice Cream',     price: 100, tax: 0,  uom: 'scoop' },
    { name: 'Strawberry Ice Cream',cat:'Ice Cream',     price: 100, tax: 0,  uom: 'scoop' },
    // Health Drinks (3)
    { name: 'Protein Smoothie',   cat: 'Health Drinks', price: 180, tax: 0,  uom: 'glass' },
    { name: 'Detox Green Juice',  cat: 'Health Drinks', price: 160, tax: 0,  uom: 'glass' },
    { name: 'Turmeric Latte',     cat: 'Health Drinks', price: 140, tax: 5,  uom: 'cup'   },
    // Specials (4)
    { name: 'Chef Special',       cat: 'Specials',      price: 350, tax: 10, uom: 'plate' },
    { name: 'Weekend Brunch Box', cat: 'Specials',      price: 420, tax: 10, uom: 'set'   },
    { name: 'Combo Meal A',       cat: 'Specials',      price: 299, tax: 5,  uom: 'set'   },
    { name: 'Combo Meal B',       cat: 'Specials',      price: 349, tax: 5,  uom: 'set'   },
  ];

  const prods = {};
  let createdCount = 0;
  for (const def of productDefs) {
    const catId = cats[def.cat].id;
    let p = await prisma.product.findFirst({ where: { name: def.name, organizationId: ORG_ID } });
    if (!p) {
      p = await prisma.product.create({
        data: {
          name: def.name,
          categoryId: catId,
          price: def.price,
          tax: def.tax,
          unitOfMeasure: def.uom,
          showOnKds: true,
          isActive: true,
          organizationId: ORG_ID,
        },
      });
      createdCount++;
    }
    prods[def.name] = p;
  }
  console.log(`  ✅  Products: ${createdCount} created, ${productDefs.length} total verified`);

  /* ── 4. Payment methods ─────────────────────────────── */
  for (const pm of [
    { name: 'CASH', isEnabled: true },
    { name: 'CARD', isEnabled: true },
    { name: 'UPI',  isEnabled: true, upiId: 'cafe@ybl' },
  ]) {
    const exists = await prisma.paymentMethod.findFirst({ where: { name: pm.name, organizationId: ORG_ID } });
    if (!exists) await prisma.paymentMethod.create({ data: { ...pm, organizationId: ORG_ID } });
  }
  console.log('  ✅  Payment methods ensured');

  /* ── 5. 3 Floors + 20 Tables ────────────────────────── */
  const floorDefs = [
    { name: 'Ground Floor', tables: ['G1','G2','G3','G4','G5','G6','G7','G8'] },
    { name: 'First Floor',  tables: ['F1','F2','F3','F4','F5','F6','F7'] },
    { name: 'Rooftop',      tables: ['R1','R2','R3','R4','R5'] },
  ];

  const allTables = {};
  for (const fd of floorDefs) {
    let floor = await prisma.floor.findFirst({ where: { name: fd.name, organizationId: ORG_ID } });
    if (!floor) floor = await prisma.floor.create({ data: { name: fd.name, organizationId: ORG_ID } });

    let xPos = 0;
    for (const tn of fd.tables) {
      let t = await prisma.table.findFirst({ where: { tableNumber: tn, organizationId: ORG_ID } });
      if (!t) {
        t = await prisma.table.create({
          data: {
            tableNumber: tn,
            seats: [2,4,4,6,2,4,6,4][Math.floor(Math.random()*8)],
            floorId: floor.id,
            isActive: true,
            x: xPos * 120,
            y: 80,
            shape: Math.random() > 0.5 ? 'square' : 'circle',
            organizationId: ORG_ID,
          },
        });
      }
      allTables[tn] = t;
      xPos++;
    }
  }
  console.log('  ✅  3 floors + 20 tables created/verified');

  /* ── 6. 10 Coupons ──────────────────────────────────── */
  const couponDefs = [
    { code: 'WELCOME20', discountType: 'PERCENTAGE', discountValue: 20 },
    { code: 'SAVE50',    discountType: 'FIXED',       discountValue: 50 },
    { code: 'FLAT10',    discountType: 'PERCENTAGE', discountValue: 10 },
    { code: 'SAVE10',    discountType: 'PERCENTAGE', discountValue: 10 },
    { code: 'MEET20',    discountType: 'PERCENTAGE', discountValue: 20 },
    { code: 'HAPPY15',   discountType: 'PERCENTAGE', discountValue: 15 },
    { code: 'FLAT100',   discountType: 'FIXED',       discountValue: 100 },
    { code: 'NEWUSER25', discountType: 'PERCENTAGE', discountValue: 25 },
    { code: 'VIP30',     discountType: 'PERCENTAGE', discountValue: 30 },
    { code: 'WEEKEND5',  discountType: 'PERCENTAGE', discountValue: 5  },
  ];
  for (const c of couponDefs) {
    await prisma.coupon.upsert({
      where: { organizationId_code: { organizationId: ORG_ID, code: c.code } },
      update: { isActive: true },
      create: { ...c, isActive: true, organizationId: ORG_ID },
    });
  }
  console.log('  ✅  10 coupons created/verified');

  /* ── 7. Promotions ──────────────────────────────────── */
  const promoDefs = [
    { name: 'Happy Hour Deal',  discountType: 'PERCENTAGE', discountValue: 5,  applyTo: 'ORDER', minOrderAmount: 300 },
    { name: 'Lunch Special',    discountType: 'PERCENTAGE', discountValue: 10, applyTo: 'ORDER', minOrderAmount: 500 },
    { name: 'Weekend Bonanza',  discountType: 'FIXED',      discountValue: 50, applyTo: 'ORDER', minOrderAmount: 400 },
  ];
  for (const p of promoDefs) {
    const exists = await prisma.promotion.findFirst({ where: { name: p.name, organizationId: ORG_ID } });
    if (!exists) await prisma.promotion.create({ data: { ...p, isActive: true, organizationId: ORG_ID } });
  }
  console.log('  ✅  3 promotions ensured');

  /* ── 8. Open POS Session (if none open) ─────────────── */
  let session = await prisma.posSession.findFirst({
    where: { status: 'OPEN', organizationId: ORG_ID },
  });
  if (!session) {
    session = await prisma.posSession.create({
      data: {
        openedById: employees[0].id,
        status: 'OPEN',
        openedAt: new Date(new Date().setHours(9, 0, 0, 0)),
        organizationId: ORG_ID,
      },
    });
  }
  console.log(`  ✅  POS session ready (ID: ${session.id.slice(0,8)}…)`);

  /* ── 9. 25 Orders ───────────────────────────────────── */
  const paidMethods = ['CASH', 'CARD', 'UPI'];
  const tableKeys   = Object.keys(allTables);
  const productKeys = Object.keys(prods);
  const coupons     = [null, null, null, 'FLAT10', 'SAVE50', 'WELCOME20', 'HAPPY15'];
  const creators    = [admin, meetAdmin, ...employees];

  // Clean up any previously seeded bulk orders to stay idempotent
  const existingBulkNums = Array.from({ length: 25 }, (_, i) => `BULK-${String(i+1).padStart(3,'0')}`);
  await prisma.order.deleteMany({ where: { orderNumber: { in: existingBulkNums }, organizationId: ORG_ID } });

  const orderStatuses = [
    'PAID','PAID','PAID','PAID','PAID','PAID','PAID','PAID','PAID','PAID',  // 10 paid
    'PAID','PAID','PAID','PAID','PAID',                                       // 15 paid
    'SENT_TO_KITCHEN','SENT_TO_KITCHEN',                                      // 2 kitchen
    'DRAFT','DRAFT',                                                          // 2 draft
    'CANCELLED','CANCELLED',                                                  // 2 cancelled
    'PAID','PAID','PAID',                                                     // 3 more paid (25 total)
  ];

  let createdOrders = 0;
  for (let i = 0; i < 25; i++) {
    const orderNum = `BULK-${String(i+1).padStart(3,'0')}`;
    const status   = orderStatuses[i];
    const creator  = creators[i % creators.length];
    const tableKey = Math.random() > 0.3 ? tableKeys[i % tableKeys.length] : null;
    const table    = tableKey ? allTables[tableKey] : null;
    const coupon   = coupons[i % coupons.length];
    const pm       = paidMethods[i % 3];

    // Pick 1-4 random products for this order
    const numLines = Math.floor(Math.random() * 3) + 1;
    const chosenKeys = [];
    for (let j = 0; j < numLines; j++) {
      chosenKeys.push(rand(productKeys));
    }

    const lines = chosenKeys.map(k => ({
      productId: prods[k].id,
      quantity:  Math.floor(Math.random() * 3) + 1,
      unitPrice: parseFloat(prods[k].price),
      lineTotal: parseFloat(prods[k].price) * (Math.floor(Math.random() * 3) + 1),
    }));
    // Correct lineTotal
    lines.forEach(l => { l.lineTotal = l.unitPrice * l.quantity; });

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    let discountAmount = 0;
    if (coupon === 'FLAT10')   discountAmount = subtotal * 0.10;
    if (coupon === 'SAVE50')   discountAmount = Math.min(50, subtotal);
    if (coupon === 'WELCOME20') discountAmount = subtotal * 0.20;
    if (coupon === 'HAPPY15')  discountAmount = subtotal * 0.15;

    const afterDiscount = subtotal - discountAmount;
    // Per-product tax (simplified as average 5% for seed data)
    const taxAmount = lines.reduce((s, l) => {
      const p = prods[chosenKeys[lines.indexOf(l)] || productKeys[0]];
      return s + l.lineTotal * (parseFloat(p?.tax || 5) / 100);
    }, 0) * (afterDiscount / (subtotal || 1));

    const total = afterDiscount + taxAmount;
    const createdAt = daysAgo(Math.floor(Math.random() * 7)); // within last week

    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: orderNum,
          sessionId:   session.id,
          createdById: creator.id,
          tableId:     table?.id || null,
          status,
          subtotal,
          taxAmount,
          discountAmount,
          total,
          paymentMethod:    status === 'PAID' ? pm : null,
          paymentReference: status === 'PAID' && pm === 'CARD' ? `TXN-${Math.floor(Math.random()*99999)}` : null,
          couponCode:       coupon,
          createdAt,
          organizationId: ORG_ID,
          lines: {
            create: lines.map(l => ({
              ...l,
              kdsStatus: status === 'SENT_TO_KITCHEN' ? 'PENDING' : 'PENDING',
            })),
          },
        },
      });

      // KDS ticket for kitchen orders
      if (status === 'SENT_TO_KITCHEN') {
        await prisma.kdsTicket.create({
          data: { orderId: order.id, stage: rand(['TO_COOK','PREPARING']), createdAt },
        });
        if (table) {
          await prisma.table.update({ where: { id: table.id }, data: { currentOrderId: order.id } });
        }
      }

      // Update session totals for paid orders
      if (status === 'PAID') {
        await prisma.posSession.update({
          where: { id: session.id },
          data: {
            totalOrders:  { increment: 1 },
            totalRevenue: { increment: total },
          },
        });
      }

      createdOrders++;
    } catch (e) {
      console.warn(`  ⚠️  Order ${orderNum} skipped: ${e.message}`);
    }
  }
  console.log(`  ✅  ${createdOrders}/25 orders created`);

  /* ── Summary ─────────────────────────────────────────── */
  console.log('\n══════════════════════════════════════════');
  console.log('  🎉  BULK SEED COMPLETE!');
  console.log('══════════════════════════════════════════');
  console.log('  👤  Users:       admin@cafe.com + meetc8030@gmail.com + 5 employees');
  console.log('  🏷️   Categories:  20');
  console.log('  🛍️   Products:    100');
  console.log('  🎫  Coupons:     10');
  console.log('  🪑  Tables:      20 (3 floors)');
  console.log('  📋  Orders:      25 (PAID/KITCHEN/DRAFT/CANCELLED)');
  console.log('\n  🔑  admin@cafe.com       → Admin@123');
  console.log('  🔑  meetc8030@gmail.com  → Meet@8030');
  console.log('══════════════════════════════════════════\n');
}

main()
  .catch((e) => { console.error('\n❌ Bulk seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
