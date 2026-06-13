const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true }
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.set('io', io);

app.use('/api/auth',           require('./src/routes/auth'));
app.use('/api/products',       require('./src/routes/products'));
app.use('/api/categories',     require('./src/routes/categories'));
app.use('/api/payment-methods',require('./src/routes/paymentMethods'));
app.use('/api/floors',         require('./src/routes/floors'));
app.use('/api/tables',         require('./src/routes/tables'));
app.use('/api/coupons',        require('./src/routes/coupons'));
app.use('/api/promotions',     require('./src/routes/promotions'));
app.use('/api/users',          require('./src/routes/users'));
app.use('/api/orders',         require('./src/routes/orders'));
app.use('/api/customers',      require('./src/routes/customers'));
app.use('/api/kds',            require('./src/routes/kds'));
app.use('/api/session',        require('./src/routes/session'));
app.use('/api/reports',        require('./src/routes/reports'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

/* ── 404 handler ───────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

/* ── Global error handler ───────────────────────────── */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join-kds', () => socket.join('kds-room'));
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`Cafe POS server running on port ${process.env.PORT}`);

  // Self-ping every 14 minutes to prevent Render free tier spin-down
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    const pingUrl = `${process.env.RENDER_EXTERNAL_URL}/api/health`;
    setInterval(async () => {
      try {
        const res = await fetch(pingUrl);
        console.log(`[Self-ping] ${new Date().toISOString()} — status: ${res.status}`);
      } catch (err) {
        console.warn(`[Self-ping] Failed: ${err.message}`);
      }
    }, 14 * 60 * 1000); // every 14 minutes
    console.log(`[Self-ping] Enabled — pinging ${pingUrl} every 14 minutes`);
  }
});

module.exports = { io };
