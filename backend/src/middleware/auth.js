const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const verifyToken = async (req, res, next) => {
  // Accept Bearer header OR ?token= query param (for file download links)
  const raw = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : req.query.token;
  if (!raw) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(raw, process.env.JWT_SECRET);
    req.user = decoded;

    // Fallback for active sessions logged in before migration
    if (!req.user.organizationId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { organizationId: true }
      });
      if (dbUser) {
        req.user.organizationId = dbUser.organizationId;
      } else {
        return res.status(401).json({ error: 'Organization not found for user' });
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
};

const requireEmployee = (req, res, next) => {
  if (!['ADMIN','EMPLOYEE'].includes(req.user?.role)) return res.status(403).json({ error: 'Access denied' });
  next();
};

module.exports = { verifyToken, requireAdmin, requireEmployee };
