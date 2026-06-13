const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validate, rules: v } = require('../middleware/validate');
const prisma = new PrismaClient();

const productValidation = validate({
  name:       [v.required, v.minLength(2)],
  categoryId: [v.required],
  price:      [v.required, v.isPositive],
});

// PUBLIC route — no auth required (for QR menu)
router.get('/public-menu', async (req, res) => {
  try {
    const categories = await prisma.productCategory.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true },
          select: {
            id: true, name: true, price: true,
            description: true, unitOfMeasure: true, tax: true,
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.get('/frequently-together/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;

    // Find all orders that contain this product
    const ordersWithProduct = await prisma.orderLine.findMany({
      where: { productId },
      select: { orderId: true },
    });
    const orderIds = ordersWithProduct.map(o => o.orderId);

    if (orderIds.length === 0) return res.json([]);

    // Find other products in those same orders
    const coProducts = await prisma.orderLine.groupBy({
      by: ['productId'],
      where: {
        orderId: { in: orderIds },
        productId: { not: productId },
      },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 3,
    });

    const productIds = coProducts.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { category: true },
    });

    // Sort by frequency
    const sorted = productIds
      .map(id => products.find(p => p.id === id))
      .filter(Boolean);

    res.json(sorted);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/', verifyToken, requireAdmin, productValidation, async (req, res) => {
  try {
    const { name, categoryId, price, unitOfMeasure, tax, description, showOnKds } = req.body;

    let catId = categoryId;
    if (typeof categoryId === 'object' && categoryId?.name) {
      const newCat = await prisma.productCategory.create({
        data: { name: categoryId.name, color: categoryId.color || '#6B7280' },
      });
      catId = newCat.id;
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        categoryId: catId,
        price:         parseFloat(price),
        unitOfMeasure: unitOfMeasure || 'piece',
        tax:           parseFloat(tax) || 0,
        description:   description?.trim() || null,
        showOnKds:     showOnKds !== false,
      },
      include: { category: true },
    });
    res.status(201).json(product);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, categoryId, price, unitOfMeasure, tax, description, showOnKds } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name:          name?.trim(),
        categoryId,
        price:         price  ? parseFloat(price)  : undefined,
        unitOfMeasure: unitOfMeasure || undefined,
        tax:           tax    ? parseFloat(tax)    : undefined,
        description:   description?.trim() ?? undefined,
        showOnKds,
      },
      include: { category: true },
    });
    res.json(product);
  } catch (e) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Product not found' });
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Product deactivated' });
  } catch (e) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Product not found' });
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
