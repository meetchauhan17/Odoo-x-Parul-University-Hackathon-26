const nodemailer = require('nodemailer');

/* ── explicit SMTP (more reliable than service:'gmail') ── */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,          // STARTTLS on port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: (process.env.EMAIL_PASS || '').replace(/\s/g, ''), // strip spaces from app-password
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 5000, // 5 seconds
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

/* ── verify connection at startup so errors appear in logs ── */
transporter.verify((err) => {
  if (err) console.error('❌ Email transporter error:', err.message);
  else     console.log(`✅ Email ready — sending as ${process.env.EMAIL_USER}`);
});

const sendReceiptEmail = async (to, order) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials (EMAIL_USER / EMAIL_PASS) are not configured on the hosted server.');
  }
  const itemRows = order.lines.map(l =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #333">${l.product.name}</td>
      <td style="padding:8px;border-bottom:1px solid #333;text-align:center">${l.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #333;text-align:right">Rs.${parseFloat(l.unitPrice).toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #333;text-align:right">Rs.${parseFloat(l.lineTotal).toFixed(2)}</td>
    </tr>`
  ).join('');

  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;background:#1a1a1a;color:#fff;padding:24px;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="color:#f97316;margin:0">Cafe POS</h1>
        <p style="color:#9ca3af;margin:4px 0">Thank you for your visit!</p>
      </div>
      <div style="background:#262626;padding:16px;border-radius:8px;margin-bottom:16px">
        <p style="margin:4px 0;color:#9ca3af">Order: <span style="color:#fff;font-weight:bold">${order.orderNumber}</span></p>
        <p style="margin:4px 0;color:#9ca3af">Date: <span style="color:#fff">${new Date(order.createdAt).toLocaleString('en-IN')}</span></p>
        ${order.table ? `<p style="margin:4px 0;color:#9ca3af">Table: <span style="color:#fff">${order.table.tableNumber}</span></p>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f97316">
            <th style="padding:10px;text-align:left">Item</th>
            <th style="padding:10px;text-align:center">Qty</th>
            <th style="padding:10px;text-align:right">Price</th>
            <th style="padding:10px;text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div style="margin-top:16px;padding:16px;background:#262626;border-radius:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#9ca3af">Subtotal</span>
          <span>Rs.${parseFloat(order.subtotal).toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#9ca3af">Tax (5%)</span>
          <span>Rs.${parseFloat(order.taxAmount).toFixed(2)}</span>
        </div>
        ${parseFloat(order.discountAmount) > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#9ca3af">Discount</span>
          <span style="color:#10b981">-Rs.${parseFloat(order.discountAmount).toFixed(2)}</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold;border-top:1px solid #444;padding-top:12px;margin-top:8px">
          <span>Total</span>
          <span style="color:#f97316">Rs.${parseFloat(order.total).toFixed(2)}</span>
        </div>
        <div style="margin-top:8px;color:#9ca3af;font-size:12px">
          Payment: ${order.paymentMethod || 'N/A'}
        </div>
      </div>
      <p style="text-align:center;color:#6b7280;font-size:12px;margin-top:24px">
        Visit us again! | ${process.env.EMAIL_USER}
      </p>
    </div>
  `;

  /* plain-text fallback (improves inbox placement) */
  const text = [
    'Cafe POS — Receipt',
    `Order: ${order.orderNumber}`,
    `Date: ${new Date(order.createdAt).toLocaleString('en-IN')}`,
    order.table ? `Table: ${order.table.tableNumber}` : '',
    '',
    ...order.lines.map(l => `${l.product.name} x${l.quantity}  Rs.${parseFloat(l.lineTotal).toFixed(2)}`),
    '',
    `Subtotal: Rs.${parseFloat(order.subtotal).toFixed(2)}`,
    `Tax:      Rs.${parseFloat(order.taxAmount).toFixed(2)}`,
    `TOTAL:    Rs.${parseFloat(order.total).toFixed(2)}`,
    '',
    'Thank you for visiting Cafe POS!',
  ].filter(l => l !== undefined).join('\n');

  const info = await transporter.sendMail({
    from: `"Cafe POS" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your receipt for ${order.orderNumber} — Rs.${parseFloat(order.total).toFixed(2)}`,
    text,
    html,
  });

  console.log(`📧 Email sent to ${to} — messageId: ${info.messageId}`);
};

module.exports = { sendReceiptEmail };

