const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireEmployee } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { search } = req.query;
    const customers = await prisma.customer.findMany({
      where: search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] } : {},
      orderBy: { name: 'asc' }
    });
    res.json(customers);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.post('/', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const customer = await prisma.customer.create({ data: { name, email, phone } });
    res.status(201).json(customer);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.put('/:id', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const customer = await prisma.customer.update({ where: { id: req.params.id }, data: { name, email, phone } });
    res.json(customer);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.delete('/:id', verifyToken, requireEmployee, async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ message: 'Customer deleted' });
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

module.exports = router;
