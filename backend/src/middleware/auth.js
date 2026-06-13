const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
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
