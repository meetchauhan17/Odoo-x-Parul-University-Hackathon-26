const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validate, rules: v } = require('../middleware/validate');
const prisma = new PrismaClient();

const userValidation = validate({
  name:     [v.required, v.minLength(2)],
  email:    [v.required, v.isEmail],
  password: [v.required, v.minLength(8)],
  role:     [v.required, v.isEnum('ADMIN', 'EMPLOYEE')],
});

const passwordValidation = validate({
  password: [v.required, v.minLength(8)],
});

router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.post('/', verifyToken, requireAdmin, userValidation, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (exists) return res.status(400).json({ error: 'Email already registered', errors: { email: 'Already in use' } });
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase().trim(), password: hashed, role },
    });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.put('/:id/password', verifyToken, requireAdmin, passwordValidation, async (req, res) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 12);
    await prisma.user.update({ where: { id: req.params.id }, data: { password: hashed } });
    res.json({ message: 'Password updated' });
  } catch (e) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.put('/:id/archive', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot archive your own account' });
    }
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'User archived' });
  } catch (e) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    /* Safety: can't delete yourself */
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (e) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
