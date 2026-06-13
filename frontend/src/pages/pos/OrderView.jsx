import { useEffect, useState, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import api from '../../api/client';
import toast from 'react-hot-toast';
import {
  Armchair, ShoppingBag, User, Ticket, ChefHat, Search,
  Loader2, CheckCircle2, Wallet, CreditCard, Smartphone,
  Printer, Coins, Sparkles, Coffee, ShoppingCart, AlertTriangle,
  X, Mail, Plus, Check
} from 'lucide-react';


/* ─────────────────────────────────────────────────────────
   SMALL HELPERS
───────────────────────────────────────────────────────── */
const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Modal({ title, onClose, children, maxW = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className={`bg-white border-2 border-slate-800 rounded-2xl w-full ${maxW} max-h-[90vh] flex flex-col`}
        style={{ boxShadow: 'var(--pop-shadow-lg)', animation: 'modalIn 0.18s ease-out' }}
      >
        <div className="flex items-center justify-between p-5 border-b-2 border-slate-100 bg-white rounded-t-2xl shrink-0">
          <h3 className="text-slate-800 font-bold text-lg font-outfit">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 bg-[#FFFDF5] rounded-b-2xl font-jakarta text-slate-700 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   RECEIPT MODAL
───────────────────────────────────────────────────────── */
function ReceiptModal({ order, onClose, onNewOrder }) {
  const completedOrder = order;
  const [emailInput, setEmailInput] = useState(order?.customer?.email || '');
  const [sendingEmail, setSendingEmail] = useState(false);

  const handlePrint = () => {
    const o = completedOrder;
    const lines = (o.lines || [])
      .map(l => `<tr><td>${l.product?.name} &times; ${l.quantity}</td><td class="amt">${Number(l.lineTotal).toFixed(2)}</td></tr>`)
      .join('');
    const discount = parseFloat(o.discountAmount || 0);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${o.orderNumber}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Courier New',monospace;font-size:13px;color:#000;background:#fff;width:300px;padding:16px}
  h1{text-align:center;font-size:18px;font-weight:bold;margin-bottom:4px}
  .center{text-align:center;font-size:11px;color:#555;margin-bottom:12px}
  .row{display:flex;justify-content:space-between;margin:3px 0;font-size:12px}
  .divider{border-top:1px dashed #999;margin:8px 0}
  table{width:100%;border-collapse:collapse;margin:6px 0}
  td{padding:3px 0;font-size:12px}
  td.amt{text-align:right;white-space:nowrap}
  .total-row{display:flex;justify-content:space-between;font-weight:bold;font-size:15px;margin-top:6px;border-top:2px solid #000;padding-top:6px}
  .footer{text-align:center;font-size:11px;color:#555;margin-top:12px}
  @media print{@page{size:80mm auto;margin:0}body{width:80mm;padding:8px}}
</style></head><body>
  <h1>☕ Cafe POS</h1>
  <div class="center">Thank you for your visit!</div>
  <div class="row"><span>Order #</span><span>${o.orderNumber}</span></div>
  <div class="row"><span>Table</span><span>${o.table?.tableNumber || 'Takeaway'}</span></div>
  <div class="row"><span>Date</span><span>${new Date(o.createdAt).toLocaleString('en-IN')}</span></div>
  <div class="divider"></div>
  <table>${lines}</table>
  <div class="divider"></div>
  <div class="row"><span>Subtotal</span><span>Rs.${Number(o.subtotal||0).toFixed(2)}</span></div>
  ${discount > 0 ? `<div class="row"><span>Discount</span><span>-Rs.${discount.toFixed(2)}</span></div>` : ''}
  <div class="row"><span>Tax (5%)</span><span>Rs.${Number(o.taxAmount||0).toFixed(2)}</span></div>
  <div class="total-row"><span>TOTAL</span><span>Rs.${Number(o.total||0).toFixed(2)}</span></div>
  <div class="footer">Thank you! Visit again 🙏</div>
</body></html>`;

    const old = document.getElementById('__receipt_frame__');
    if (old) old.remove();
    const iframe = document.createElement('iframe');
    iframe.id = '__receipt_frame__';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open(); doc.write(html); doc.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 3000);
    }, 500);
  };

  const handleSendEmail = async () => {
    if (!emailInput) return toast.error('Enter an email address');
    setSendingEmail(true);
    try {
      await api.post(`/orders/${completedOrder.id}/send-receipt`,
        { email: emailInput });
      toast.success(`Receipt sent to ${emailInput}`);
    } catch (err) {
      toast.error(err.error || 'Failed to send email');
    } finally { setSendingEmail(false); }
  };

  return (
    <Modal title="Payment Complete" onClose={onClose} maxW="max-w-lg">

      <div className="text-center mb-6">
        <div className="flex justify-center mb-2">
          <CheckCircle2 className="text-emerald-500 animate-bounce" size={48} />
        </div>
        <div className="text-emerald-600 font-bold text-xl font-outfit">Payment Successful</div>
      </div>

      {/* Receipt body */}
      <div 
        className="bg-white border-2 border-slate-800 rounded-xl p-5 space-y-2 text-sm font-mono text-slate-800"
        style={{ boxShadow: 'var(--pop-shadow-sm)' }}
      >
        <div className="flex items-center justify-center gap-2 text-slate-800 font-bold text-lg mb-3 font-outfit">
          <Coffee size={18} className="text-violet-600" />
          <span>Cafe POS</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Order #</span><span className="text-slate-800 font-bold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Table</span><span className="text-slate-800 font-bold">{order.table?.tableNumber?.toUpperCase() || 'Takeaway'}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Date</span><span className="text-slate-800 font-bold">{new Date(order.createdAt).toLocaleString('en-IN')}</span>
        </div>
        <div className="border-t border-dashed border-slate-300 my-3" />
        {order.lines?.map(l => (
          <div key={l.id} className="flex justify-between">
            <span className="text-slate-600">{l.product?.name} × {l.quantity}</span>
            <span className="text-slate-800 font-bold">{fmt(l.lineTotal)}</span>
          </div>
        ))}
        <div className="border-t border-dashed border-slate-300 my-3" />
        <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="font-medium text-slate-800">{fmt(order.subtotal)}</span></div>
        {parseFloat(order.discountAmount) > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium"><span>Discount</span><span>−{fmt(order.discountAmount)}</span></div>
        )}
        <div className="flex justify-between text-slate-500"><span>Tax (5%)</span><span className="font-medium text-slate-800">{fmt(order.taxAmount)}</span></div>
        <div className="flex justify-between text-violet-600 font-bold text-base mt-2">
          <span>TOTAL</span><span>{fmt(order.total)}</span>
        </div>
        <div className="text-center text-slate-400 text-xs mt-4">Thank you! Visit again 🙏</div>
      </div>

      <div className="flex gap-4 mt-5 no-print font-outfit">
        <button 
          onClick={handlePrint} 
          className="flex-1 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-800 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5"
          style={{ boxShadow: 'var(--pop-shadow-sm)' }}
        >
          <Printer size={16} /> Print
        </button>
        <button 
          onClick={onNewOrder} 
          className="flex-1 bg-violet-600 hover:bg-violet-700 border-2 border-slate-800 text-white py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5"
          style={{ boxShadow: 'var(--pop-shadow-sm)' }}
        >
          <Plus size={16} /> New Order
        </button>
      </div>

      <div className="flex gap-3 mt-4 no-print font-jakarta">
        <input
          type="email"
          value={emailInput}
          onChange={e => setEmailInput(e.target.value)}
          placeholder="customer@email.com"
          className="flex-1 bg-white border-2 border-slate-300 text-slate-800
                     rounded-xl px-3 py-2 text-sm focus:outline-none
                     focus:border-slate-800 focus:ring-0 transition"
        />
        <button
          onClick={handleSendEmail}
          disabled={sendingEmail}
          className="bg-violet-600 hover:bg-violet-700 text-white border-2 border-slate-800 px-5 py-2
                     rounded-xl text-sm font-bold disabled:opacity-50 transition flex items-center justify-center"
          style={{ boxShadow: 'var(--pop-shadow-sm)' }}
        >
          {sendingEmail ? 'Sending...' : <span className="flex items-center gap-1.5"><Mail size={16} /> Send Receipt</span>}
        </button>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────
   COUPON MODAL
───────────────────────────────────────────────────────── */
function CouponModal({ onApply, onClose }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleApply = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const coupon = await api.post('/coupons/validate', { code });
      onApply(coupon);
      toast.success(`Coupon "${coupon.code}" applied!`);
      onClose();
    } catch (e) { setErr(e.error || 'Invalid coupon code'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Apply Coupon" onClose={onClose}>
      <form onSubmit={handleApply} className="space-y-4 font-jakarta">
        <input required value={code} onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code (e.g. SAVE20)"
          className="w-full bg-white border-2 border-slate-300 text-slate-800 rounded-xl px-3 py-2.5 font-mono uppercase focus:outline-none focus:border-slate-800 transition" />
        {err && <div className="text-rose-600 text-sm bg-rose-50 border-2 border-rose-200 rounded-xl px-3 py-2">{err}</div>}
        <div className="flex gap-4 font-outfit">
          <button type="button" onClick={onClose} className="flex-1 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-800 py-2.5 rounded-xl font-bold transition shadow-pop-sm">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 border-2 border-slate-800 text-white py-2.5 rounded-xl font-bold disabled:opacity-50 transition shadow-pop-sm">
            {loading ? 'Checking…' : 'Apply Coupon'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────
   CUSTOMER MODAL
───────────────────────────────────────────────────────── */
function CustomerModal({ onAssign, onClose }) {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [newForm, setNewForm] = useState({ name: '', email: '', phone: '' });
  const [tab, setTab] = useState('search');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const url = search.trim() ? `/customers?search=${search}` : '/customers';
        const res = await api.get(url);
        setCustomers(res || []);
      } catch {}
    };

    if (search.length === 0) {
      fetchCustomers();
      return;
    }

    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [search]);

  const createAndAssign = async (e) => {
    e.preventDefault();
    try {
      const c = await api.post('/customers', newForm);
      onAssign(c);
    } catch { toast.error('Failed to create customer'); }
  };

  return (
    <Modal title="Assign Customer" onClose={onClose}>
      <div className="flex gap-1 bg-slate-100 border-2 border-slate-800 rounded-xl p-1 mb-4 font-outfit">
        {['search', 'new'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-bold capitalize transition ${tab === t ? 'bg-violet-600 text-white border border-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
            style={{ boxShadow: tab === t ? 'var(--pop-shadow-sm)' : 'none' }}>
            {t === 'search' ? 'Search Existing' : 'Create New'}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <div className="space-y-3 font-jakarta">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full bg-white border-2 border-slate-300 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-slate-800 transition" />
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {customers.map(c => (
              <button key={c.id} onClick={() => onAssign(c)}
                className="w-full text-left px-3 py-2.5 bg-white border-2 border-slate-200 hover:border-slate-800 rounded-xl transition mb-2"
                style={{ boxShadow: 'var(--pop-shadow-sm)' }}>
                <div className="text-slate-800 text-sm font-bold font-outfit">{c.name}</div>
                <div className="text-slate-500 text-xs mt-0.5">{c.email || c.phone || '—'}</div>
              </button>
            ))}
            {search && customers.length === 0 && <div className="text-slate-500 text-sm text-center py-4">No customers found</div>}
          </div>
        </div>
      )}

      {tab === 'new' && (
        <form onSubmit={createAndAssign} className="space-y-3 font-jakarta">
          <input required value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })}
            placeholder="Full name *"
            className="w-full bg-white border-2 border-slate-300 text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-slate-800 transition" />
          <input type="email" value={newForm.email} onChange={e => setNewForm({ ...newForm, email: e.target.value })}
            placeholder="Email"
            className="w-full bg-white border-2 border-slate-300 text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-slate-800 transition" />
          <input value={newForm.phone} onChange={e => setNewForm({ ...newForm, phone: e.target.value })}
            placeholder="Phone"
            className="w-full bg-white border-2 border-slate-300 text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-slate-800 transition" />
          <div className="flex gap-4 pt-2 font-outfit">
            <button type="button" onClick={onClose} className="flex-1 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-800 py-2 rounded-xl font-bold transition shadow-pop-sm">Cancel</button>
            <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 border-2 border-slate-800 text-white py-2 rounded-xl font-bold transition shadow-pop-sm">Create & Assign</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN: ORDER VIEW
───────────────────────────────────────────────────────── */
export default function OrderView({ table, session, existingOrder, initialOrder, searchQuery, onOrderComplete, onOrderUpdate, onTableClick }) {
  /* ── data ── */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [activePromos, setActivePromos] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  /* ── cart ── */
  const [cartItems, setCartItems] = useState([]);
  const [activeCat, setActiveCat] = useState('all');
  const [localSearch, setLocalSearch] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(existingOrder);

  /* ── UI state ── */
  const [showPayment, setShowPayment] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [hideCustomerSuggest, setHideCustomerSuggest] = useState(false);
  const [paidOrder, setPaidOrder] = useState(null);
  const [payMethod, setPayMethod] = useState(null);
  const [cashReceived, setCashReceived] = useState('');
  const [cardRef, setCardRef] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [kitchenLoading, setKitchenLoading] = useState(false);
  const saveTimerRef = useRef(null);
  const loadedOrderIdRef = useRef(null);

  /* ── load master data ── */
  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/categories'),
      api.get('/payment-methods'),
      api.get('/promotions'),
    ]).then(([p, c, pm, pr]) => {
      setProducts(p || []);
      setCategories(c || []);
      setPaymentMethods((pm || []).filter(m => m.isEnabled));
      setPromotions(pr || []);
    }).catch(() => toast.error('Failed to load products'))
      .finally(() => setDataLoading(false));
  }, []);

  /* ── seed cart from existing order / initial order ── */
  useEffect(() => {
    const orderToLoad = initialOrder || existingOrder;
    if (!orderToLoad) {
      loadedOrderIdRef.current = null;
      setCurrentOrder(null);
      setCartItems([]);
      setCoupon(null);
      setCustomer(null);
      setPayMethod(null);
      setCashReceived('');
      setHideCustomerSuggest(false);
      return;
    }

    // Only load if the order ID is different from what we last loaded
    if (orderToLoad.id === loadedOrderIdRef.current) {
      return;
    }
    loadedOrderIdRef.current = orderToLoad.id;
    setCurrentOrder(orderToLoad);

    if (orderToLoad.cartItems) {
      setCartItems(orderToLoad.cartItems);
      if (orderToLoad.customer) {
        setCustomer(orderToLoad.customer);
      } else {
        setCustomer(null);
      }
      if (orderToLoad.couponCode) {
        api.post('/coupons/validate', { code: orderToLoad.couponCode })
          .then(setCoupon)
          .catch(() => {});
      }
    } else if (orderToLoad.lines) {
      setCartItems(orderToLoad.lines.map(l => ({
        productId: l.productId,
        name: l.product?.name,
        price: parseFloat(l.unitPrice),
        quantity: l.quantity,
        color: l.product?.category?.color,
      })));
      if (orderToLoad.customer) {
        setCustomer(orderToLoad.customer);
      } else {
        setCustomer(null);
      }
      if (orderToLoad.couponCode) {
        api.post('/coupons/validate', { code: orderToLoad.couponCode })
          .then(setCoupon)
          .catch(() => {});
      }
    }
  }, [existingOrder, initialOrder]);

  /* ── Socket.IO connection for real-time status updates ── */
  useEffect(() => {
    if (!currentOrder?.id) return;
    const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
      .replace(/\/api\/?$/, '');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.emit('join-kds');

    socket.on('ticket-updated', (updated) => {
      if (updated.orderId === currentOrder.id) {
        const nextStatus = updated.order?.status || (updated.stage === 'COMPLETED' ? 'READY' : 'SENT_TO_KITCHEN');
        setCurrentOrder(prev => {
          if (!prev) return prev;
          const nextOrder = { ...prev, status: nextStatus };
          onOrderUpdate?.(nextOrder);
          return nextOrder;
        });
      }
    });

    socket.on('order-cancelled', ({ orderId }) => {
      if (orderId === currentOrder.id) {
        setCurrentOrder(prev => {
          if (!prev) return prev;
          const nextOrder = { ...prev, status: 'CANCELLED' };
          onOrderUpdate?.(nextOrder);
          return nextOrder;
        });
      }
    });

    return () => { socket.disconnect(); };
  }, [currentOrder?.id, onOrderUpdate]);

  /* ── sync external search ── */
  useEffect(() => { setLocalSearch(searchQuery || ''); }, [searchQuery]);

  /* ─── Promotions check ─── */
  const checkPromotions = (cartItems) => {
    const subtotal = cartItems.reduce((s, i) => s + (i.price || i.unitPrice || 0) * i.quantity, 0);
    const triggered = [];

    promotions.forEach(promo => {
      if (!promo.isActive) return;

      if (promo.applyTo === 'ORDER' && subtotal >= parseFloat(promo.minOrderAmount)) {
        const disc = promo.discountType === 'PERCENTAGE'
          ? (subtotal * parseFloat(promo.discountValue)) / 100
          : parseFloat(promo.discountValue);
        triggered.push({ name: promo.name, discount: disc, type: 'auto' });
      }

      if (promo.applyTo === 'PRODUCT') {
        const cartItem = cartItems.find(i => i.productId === promo.productId);
        if (cartItem && cartItem.quantity >= promo.minQuantity) {
          const disc = promo.discountType === 'PERCENTAGE'
            ? (subtotal * parseFloat(promo.discountValue)) / 100
            : parseFloat(promo.discountValue);
          triggered.push({ name: promo.name, discount: disc, type: 'auto' });
        }
      }
    });

    setActivePromos(triggered);
  };

  useEffect(() => {
    checkPromotions(cartItems);
  }, [cartItems, promotions]);

  /* ── Frequently ordered together suggestions ── */
  useEffect(() => {
    if (cartItems.length === 0) { setSuggestions([]); return; }
    const lastItem = cartItems[cartItems.length - 1];
    api.get(`/products/frequently-together/${lastItem.productId}`)
      .then(res => setSuggestions(res))
      .catch(() => setSuggestions([]));
  }, [cartItems.length]);

  /* ────── computed values ────── */
  const subtotal = cartItems.reduce((s, i) => s + (i.price || i.unitPrice || 0) * i.quantity, 0);
  const promoDiscount = activePromos.reduce((s, p) => s + p.discount, 0);
  
  const couponData = coupon;
  const setCouponData = setCoupon;
  const couponDiscountAmt = couponData
    ? couponData.discountType === 'PERCENTAGE'
      ? (subtotal * parseFloat(couponData.discountValue)) / 100
      : parseFloat(couponData.discountValue)
    : 0;
  
  const totalDiscount = promoDiscount + couponDiscountAmt;
  const afterDiscount = Math.max(0, subtotal - totalDiscount);
  const tax = afterDiscount * 0.05;
  const taxAmount = tax;
  const total = afterDiscount + tax;

  const cashChange = cashReceived ? Math.max(0, parseFloat(cashReceived) - total) : null;

  /* ────── filtered products ────── */
  const visibleProducts = products.filter(p => {
    const matchCat = activeCat === 'all' || p.categoryId === activeCat;
    const q = localSearch.trim().toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  /* ────── cart helpers ────── */
  const addToCart = (product) => {
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.productId === product.id);
      if (idx >= 0) {
        const next = [...prev]; next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }; return next;
      }
      return [...prev, { productId: product.id, name: product.name, price: parseFloat(product.price), quantity: 1, color: product.category?.color }];
    });
    toast.success(`${product.name} added`, {
      duration: 1500,
      style: { background: '#065f46', color: '#d1fae5', border: '1px solid #047857' },
      icon: <CheckCircle2 size={18} className="text-green-400" />,
    });
  };

  const updateQty = (idx, delta) => {
    setCartItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: next[idx].quantity + delta };
      if (next[idx].quantity <= 0) next.splice(idx, 1);
      return next;
    });
  };

  const removeItem = (idx) => setCartItems(prev => prev.filter((_, i) => i !== idx));

  /* ────── save draft ────── */
  const saveDraft = useCallback(async () => {
    if (!session) return;
    // Guard against auto-saving orders that are already paid/cancelled (or not editable)
    if (currentOrder && currentOrder.status !== 'DRAFT' && currentOrder.status !== 'SENT_TO_KITCHEN' && currentOrder.status !== 'READY') return;

    try {
      const lines = cartItems.map(i => ({ productId: i.productId, quantity: i.quantity }));
      if (currentOrder) {
        if (currentOrder.status === 'DRAFT' || currentOrder.status === 'SENT_TO_KITCHEN' || currentOrder.status === 'READY') {
          const order = await api.put(`/orders/${currentOrder.id}`, {
            lines,
            tableId: table?.id || null,
            customerId: customer?.id || null,
            couponCode: coupon?.code || null,
          });
          setCurrentOrder(order);
          onOrderUpdate?.(order);
        }
      } else {
        const order = await api.post('/orders', {
          lines, sessionId: session.id,
          tableId: table?.id || null,
          customerId: customer?.id || null,
          couponCode: coupon?.code || null,
        });
        setCurrentOrder(order);
        onOrderUpdate?.(order);
      }
    } catch {}
  }, [cartItems, session, table, customer, coupon, currentOrder, onOrderUpdate]);

  /* debounce draft save */
  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(saveDraft, 1500);
    return () => clearTimeout(saveTimerRef.current);
  }, [cartItems, coupon, customer, saveDraft]);

  /* ────── send to kitchen ────── */
  const handleSendKitchen = async () => {
    if (!cartItems.length) return toast.error('Cart is empty');
    setKitchenLoading(true);
    try {
      let order = currentOrder;
      const lines = cartItems.map(i => ({ productId: i.productId, quantity: i.quantity }));
      if (order) {
        if (order.status === 'DRAFT' || order.status === 'SENT_TO_KITCHEN' || order.status === 'READY') {
          order = await api.put(`/orders/${order.id}`, {
            lines,
            tableId: table?.id || null,
            customerId: customer?.id || null,
            couponCode: coupon?.code || null,
          });
          setCurrentOrder(order);
          onOrderUpdate?.(order);
        }
      } else {
        order = await api.post('/orders', {
          lines: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
          sessionId: session.id, tableId: table?.id || null,
          customerId: customer?.id || null, couponCode: coupon?.code || null,
        });
        setCurrentOrder(order);
        onOrderUpdate?.(order);
      }
      const updatedOrder = await api.put(`/orders/${order.id}/send-kitchen`);
      setCurrentOrder(updatedOrder);
      onOrderUpdate?.(updatedOrder);
      toast.success('Order sent to kitchen!', {
        icon: <ChefHat size={18} className="text-blue-400" />
      });
    } catch { toast.error('Failed to send to kitchen'); }
    finally { setKitchenLoading(false); }
  };

  /* ────── payment ────── */
  const handlePay = async () => {
    if (!cartItems.length) return toast.error('Cart is empty');
    if (!payMethod) return toast.error('Select a payment method');
    setPayLoading(true);
    try {
      let order = currentOrder;
      const lines = cartItems.map(i => ({ productId: i.productId, quantity: i.quantity }));
      if (order) {
        if (order.status === 'DRAFT' || order.status === 'SENT_TO_KITCHEN' || order.status === 'READY') {
          order = await api.put(`/orders/${order.id}`, {
            lines,
            tableId: table?.id || null,
            customerId: customer?.id || null,
            couponCode: coupon?.code || null,
          });
          setCurrentOrder(order);
          onOrderUpdate?.(order);
        }
      } else {
        order = await api.post('/orders', {
          lines: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
          sessionId: session.id, tableId: table?.id || null,
          customerId: customer?.id || null, couponCode: coupon?.code || null,
        });
        setCurrentOrder(order);
        onOrderUpdate?.(order);
      }
      const paid = await api.put(`/orders/${order.id}/pay`, {
        paymentMethod: payMethod,
        paymentReference: payMethod === 'CARD' ? cardRef : null,
      });
      setCurrentOrder(paid);
      onOrderUpdate?.(paid);
      setPaidOrder(paid);
      setShowReceipt(true);
      setShowPayment(false);
      toast.success(`Payment of ${fmt(paid.total)} received!`, {
        duration: 3000,
        style: { background: '#064e3b', color: '#a7f3d0', border: '1px solid #059669' },
        icon: <Coins size={18} className="text-yellow-400" />,
      });
    } catch (err) { toast.error(err?.error || 'Payment failed'); }
    finally { setPayLoading(false); }
  };

  const handleNewOrder = () => {
    setCartItems([]); setCoupon(null); setCustomer(null);
    setCurrentOrder(null); setPayMethod(null); setCashReceived('');
    setShowReceipt(false); setPaidOrder(null);
    onOrderComplete?.();
  };


  const upiMethod = paymentMethods.find(m => m.name === 'UPI');

  /* ────── render ────── */
  const BG     = '#FFFDF5';
  const WHITE  = '#FFFFFF';
  const FG     = '#1E293B';
  const MUTED  = '#64748B';
  const BORDER = '#E2E8F0';
  const ACCENT = '#8B5CF6';
  const AMBER  = '#FBBF24';
  const EMERALD= '#34D399';
  const PINK   = '#F472B6';
  const FONT_H = "'Outfit', system-ui, sans-serif";
  const FONT_B = "'Plus Jakarta Sans', system-ui, sans-serif";

  return (
    <div className="pos-layout flex h-full overflow-hidden" style={{ background: BG, fontFamily: FONT_B }}>

      {/* ══ LEFT — Product Grid ══════════════════════════ */}
      <div className="pos-product-col flex flex-col shrink-0 border-r"
           style={{ width: '58%', borderColor: BORDER, background: BG }}>

        {/* Category tabs + Local search bar */}
        <div className="shrink-0 px-4 pt-3 pb-2 space-y-2" style={{ background: WHITE, borderBottom: `2px solid ${BORDER}` }}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
            <input
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full text-sm rounded-xl pl-9 pr-9 py-2.5 focus:outline-none transition"
              style={{ background: '#F8FAFC', border: `2px solid ${BORDER}`, color: FG }}
              onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `4px 4px 0px 0px ${ACCENT}`; }}
              onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 p-1 hover:bg-slate-200/50 rounded-lg transition"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setActiveCat('all')}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
              style={activeCat === 'all'
                ? { background: ACCENT, color: '#fff', border: `2px solid ${FG}`, boxShadow: '2px 2px 0px 0px #1E293B' }
                : { background: WHITE, color: MUTED, border: `2px solid ${BORDER}` }}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                style={activeCat === c.id
                  ? { background: c.color, color: '#fff', border: `2px solid ${FG}`, boxShadow: '2px 2px 0px 0px #1E293B' }
                  : { background: WHITE, color: MUTED, border: `2px solid ${BORDER}` }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-3" style={{ background: BG }}>
          {dataLoading ? (
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-2.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-xl" style={{ minHeight: 110, background: BORDER, animationDelay: `${i * 50}ms`, opacity: 0.6 }} />
              ))}
            </div>
          ) : (
            <div className="pos-product-grid grid grid-cols-3 xl:grid-cols-4 gap-2.5">
              {visibleProducts.map(p => {
                const catColor = p.category?.color || '#8B5CF6';
                const inCart = cartItems.find(i => i.productId === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="product-card group relative text-left rounded-xl p-3 transition-all duration-200 active:scale-95"
                    style={{
                      background: WHITE,
                      border: `2px solid ${inCart ? catColor : BORDER}`,
                      minHeight: 110,
                      boxShadow: inCart ? `4px 4px 0px 0px ${catColor}` : `4px 4px 0px 0px ${BORDER}`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = catColor; e.currentTarget.style.boxShadow = `4px 4px 0px 0px ${catColor}`; e.currentTarget.style.transform = 'translate(-2px,-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = inCart ? catColor : BORDER; e.currentTarget.style.boxShadow = inCart ? `4px 4px 0px 0px ${catColor}` : `4px 4px 0px 0px ${BORDER}`; e.currentTarget.style.transform = 'translate(0,0)'; }}
                  >
                    {/* Category color bar */}
                    <div className="w-full h-1 rounded-full mb-2.5" style={{ background: catColor }} />
                    <div className="product-card-name font-bold leading-tight mb-1.5" style={{ color: FG, fontSize: 13, fontFamily: FONT_H }}>{p.name}</div>
                    <div className="font-black" style={{ color: catColor, fontSize: 17 }}>₹{parseFloat(p.price).toFixed(0)}</div>
                    <div className="text-[10px] mt-0.5 font-semibold" style={{ color: MUTED }}>{p.unitOfMeasure}</div>

                    {/* Qty badge if in cart */}
                    {inCart && (
                      <div
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white border-2 border-white"
                        style={{ background: catColor }}
                      >
                        {inCart.quantity}
                      </div>
                    )}
                    {/* Add (+) on hover */}
                    {!inCart && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-black opacity-0 group-hover:opacity-100 transition border-2 border-white"
                           style={{ background: catColor }}>
                        +
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {!dataLoading && visibleProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-2" style={{ background: WHITE, borderColor: BORDER, boxShadow: `4px 4px 0px 0px ${BORDER}` }}>
                <Search size={28} style={{ color: MUTED }} />
              </div>
              <div className="text-sm font-semibold" style={{ color: MUTED }}>
                {localSearch ? `No products matching "${localSearch}"` : 'No products in this category'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ RIGHT — Cart + Payment ════════════════════════ */}
      <div className="pos-cart-col flex flex-col flex-1" style={{ background: WHITE, borderLeft: `2px solid ${BORDER}` }}>

        {/* ── Cart Header ── */}
        <div className="px-4 py-3 shrink-0" style={{ borderBottom: `2px solid ${BORDER}`, background: WHITE }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-base" style={{ color: FG, fontFamily: FONT_H }}>
                {currentOrder ? (
                  <span className="flex items-center gap-2">
                    <span style={{ color: MUTED, fontWeight: 500, fontSize: 13 }}>Order</span>
                    <span style={{ color: ACCENT, fontFamily: 'monospace', fontSize: 15 }}>{currentOrder.orderNumber}</span>
                    {currentOrder.status === 'READY' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-2"
                        style={{ background: '#EDE9FE', color: '#7C3AED', borderColor: '#C4B5FD' }}>
                        Ready
                      </span>
                    )}
                    {currentOrder.status === 'SENT_TO_KITCHEN' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-2"
                        style={{ background: '#FEF3C7', color: '#D97706', borderColor: '#FCD34D' }}>
                        Cooking
                      </span>
                    )}
                    {currentOrder.status === 'DRAFT' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-2"
                        style={{ background: '#F1F5F9', color: '#475569', borderColor: '#CBD5E1' }}>
                        Draft
                      </span>
                    )}
                    {currentOrder.status === 'PAID' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-2"
                        style={{ background: '#D1FAE5', color: '#059669', borderColor: '#A7F3D0' }}>
                        Paid
                      </span>
                    )}
                    {currentOrder.status === 'CANCELLED' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-2"
                        style={{ background: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5' }}>
                        Cancelled
                      </span>
                    )}
                  </span>
                ) : 'New Order'}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap" style={{ color: MUTED, fontSize: 12 }}>
                {table ? (
                  <span className="flex items-center gap-1"><Armchair size={11} /> Table {table.tableNumber.toUpperCase()}</span>
                ) : (
                  <span className="flex items-center gap-1"><ShoppingBag size={11} /> Takeaway</span>
                )}
                {customer && (
                  <span className="flex items-center gap-1 bg-violet-50 text-violet-850 border border-violet-200 px-2 py-0.5 rounded-lg text-xs font-bold font-jakarta">
                    <User size={10} /> {customer.name}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCustomer(null); }}
                      className="ml-1 text-violet-400 hover:text-rose-500 font-black text-xs shrink-0 cursor-pointer"
                      title="Remove Customer"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full text-xs font-bold border-2" style={{ background: `${ACCENT}15`, borderColor: `${ACCENT}40`, color: ACCENT }}>
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* ── Cart Items ── */}
        {!showPayment && (
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5" style={{ background: '#FAFAFA' }}>
            {!customer && !hideCustomerSuggest && (
              <div 
                className="border-2 border-dashed rounded-xl p-3 mb-2 flex items-center justify-between gap-2 text-xs font-semibold transition-all duration-200"
                style={{ 
                  background: '#F5F3FF', 
                  borderColor: '#C4B5FD', 
                  color: '#6D28D9',
                  boxShadow: '2px 2px 0px 0px #E2E8F0' 
                }}
              >
                <div className="flex items-center gap-2">
                  <User size={14} className="text-violet-500 shrink-0" />
                  <span><strong>Suggested:</strong> Assign a customer to track history & loyalty.</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => setShowCustomer(true)}
                    className="px-2.5 py-1 text-white rounded-lg font-bold transition text-[11px] border border-slate-800"
                    style={{ background: ACCENT, boxShadow: '1.5px 1.5px 0px 0px #1E293B' }}
                  >
                    Assign
                  </button>
                  <button 
                    onClick={() => setHideCustomerSuggest(true)}
                    className="w-5 h-5 rounded flex items-center justify-center text-violet-400 hover:text-violet-750 hover:bg-violet-100 transition shrink-0"
                    title="Dismiss suggestion"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-2" style={{ background: WHITE, borderColor: BORDER, boxShadow: `4px 4px 0px 0px ${BORDER}` }}>
                  <ShoppingCart size={28} style={{ color: BORDER }} />
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: MUTED, fontFamily: FONT_H }}>Cart is empty</div>
                  <div className="text-xs mt-0.5" style={{ color: '#CBD5E1' }}>Tap a product to add it</div>
                </div>
              </div>
            ) : (
              cartItems.map((item, idx) => {
                const itemColor = item.color || ACCENT;
                return (
                  <div key={idx}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                    style={{ background: WHITE, border: `2px solid ${BORDER}`, boxShadow: `3px 3px 0px 0px ${BORDER}` }}>
                    {/* Color bar */}
                    <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: itemColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: FG, fontFamily: FONT_H }}>{item.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: MUTED }}>₹{item.price.toFixed(2)} each</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => updateQty(idx, -1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition border-2"
                        style={{ background: WHITE, color: FG, borderColor: BORDER }}>−</button>
                      <span className="w-7 text-center font-black text-sm" style={{ color: FG }}>{item.quantity}</span>
                      <button onClick={() => updateQty(idx, +1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition border-2"
                        style={{ background: itemColor, color: '#fff', borderColor: FG }}>+</button>
                    </div>
                    <div className="font-black text-sm w-16 text-right shrink-0" style={{ color: ACCENT }}>
                      {fmt(item.price * item.quantity)}
                    </div>
                    <button onClick={() => removeItem(idx)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition opacity-40 hover:opacity-100"
                      style={{ color: '#EF4444' }}>
                      <X size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Promo + Coupon banners ── */}
        {!showPayment && (
          <div className="px-3 space-y-1.5 shrink-0">
            {suggestions.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: `${AMBER}15`, border: `2px solid ${AMBER}50` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#92400E', fontFamily: FONT_H }}>
                  <Sparkles size={11} style={{ color: AMBER }} /> Frequently ordered with this
                </p>
                <div className="flex gap-2 flex-wrap">
                  {suggestions.map(product => (
                    <button key={product.id} onClick={() => addToCart(product)}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200 active:scale-95 border-2"
                      style={{ background: WHITE, color: FG, borderColor: BORDER, boxShadow: '2px 2px 0px 0px #E2E8F0' }}>
                      <span className="font-semibold">{product.name}</span>
                      <span className="font-black" style={{ color: ACCENT }}>+₹{parseFloat(product.price).toFixed(0)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activePromos.map((promo, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border-2"
                style={{ background: `${EMERALD}15`, borderColor: `${EMERALD}50`, color: '#059669' }}>
                <Sparkles size={13} />
                <span className="flex-1 font-semibold">{promo.name}</span>
                <span className="font-black">-₹{promo.discount.toFixed(2)}</span>
              </div>
            ))}

            {couponData && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-1 border-2"
                style={{ background: `${ACCENT}12`, borderColor: `${ACCENT}40`, color: '#6D28D9' }}>
                <Ticket size={13} />
                <span className="flex-1 font-semibold">Coupon: {couponData.code}</span>
                <span className="font-black">-₹{couponDiscountAmt.toFixed(2)}</span>
                <button onClick={() => setCouponData(null)} style={{ color: '#EF4444' }}><X size={13} /></button>
              </div>
            )}
          </div>
        )}

        {/* ── Order Totals ── */}
        {!showPayment && (
          <div className="px-3 pb-2 shrink-0">
            <div className="rounded-xl p-3 space-y-1.5 border-2" style={{ background: WHITE, borderColor: BORDER, boxShadow: '4px 4px 0px 0px #E2E8F0' }}>
              <div className="flex justify-between text-sm" style={{ color: MUTED }}>
                <span>Subtotal</span><span style={{ color: FG, fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: MUTED }}>Discount</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm" style={{ color: MUTED }}>
                <span>Tax (5%)</span><span style={{ color: FG, fontWeight: 600 }}>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 mt-1" style={{ borderTop: `2px solid ${BORDER}` }}>
                <span className="font-black text-base" style={{ color: FG, fontFamily: FONT_H }}>Total</span>
                <span className="font-black text-xl" style={{ color: ACCENT }}>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Action Buttons ── */}
        {!showPayment && (
          <div className="px-3 pb-3 grid grid-cols-2 gap-2 shrink-0">
            <button onClick={() => setShowCustomer(true)}
              className="h-11 flex items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-all duration-200 border-2"
              style={customer
                ? { background: `${ACCENT}15`, color: ACCENT, borderColor: ACCENT, boxShadow: `2px 2px 0px 0px ${FG}` }
                : { background: WHITE, color: MUTED, borderColor: BORDER }}>
              <User size={14} strokeWidth={2.5} /> {customer ? customer.name.split(' ')[0] : 'Customer'}
            </button>
            <button onClick={() => setShowCoupon(true)}
              className="h-11 flex items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-all duration-200 border-2"
              style={coupon
                ? { background: `${PINK}15`, color: '#9D174D', borderColor: PINK, boxShadow: `2px 2px 0px 0px ${FG}` }
                : { background: WHITE, color: MUTED, borderColor: BORDER }}>
              <Ticket size={14} strokeWidth={2.5} /> {coupon ? coupon.code : 'Coupon'}
            </button>
            <button onClick={handleSendKitchen} disabled={kitchenLoading || !cartItems.length}
              className="h-11 flex items-center justify-center gap-1.5 rounded-xl text-sm font-black transition-all duration-200 border-2 disabled:opacity-40"
              style={{ background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE', boxShadow: `2px 2px 0px 0px ${FG}` }}>
              {kitchenLoading ? <Loader2 size={14} className="animate-spin" /> : <ChefHat size={14} strokeWidth={2.5} />}
              Kitchen
            </button>
            <button onClick={() => {
              setShowPayment(true);
            }} disabled={!cartItems.length}
              className="h-11 flex items-center justify-center gap-1.5 rounded-xl font-black text-sm transition-all duration-200 border-2 disabled:opacity-40"
              style={{ background: ACCENT, color: '#fff', borderColor: FG, boxShadow: `3px 3px 0px 0px ${FG}` }}>
              <CreditCard size={14} strokeWidth={2.5} /> Charge {cartItems.length > 0 ? fmt(total) : ''}
            </button>
          </div>
        )}

        {/* ══ Payment Panel ══ */}
        {showPayment && (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: WHITE }}>
            <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: `2px solid ${BORDER}` }}>
              <div>
                <div className="font-black text-base" style={{ color: FG, fontFamily: FONT_H }}>Checkout</div>
                <div className="text-3xl font-black mt-0.5" style={{ color: ACCENT, fontFamily: FONT_H }}>{fmt(total)}</div>
                {table && <div className="text-xs mt-0.5 font-semibold" style={{ color: MUTED }}>Table {table.tableNumber.toUpperCase()}</div>}
              </div>
              <button onClick={() => setShowPayment(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition border-2"
                style={{ background: WHITE, color: MUTED, borderColor: BORDER }}>
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2 pt-3">
              <div className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: MUTED, fontFamily: FONT_H }}>Payment Method</div>
              {paymentMethods.map(m => (
                <button key={m.id} onClick={() => setPayMethod(m.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border-2"
                  style={payMethod === m.name
                    ? { borderColor: ACCENT, background: `${ACCENT}12`, boxShadow: `3px 3px 0px 0px ${FG}` }
                    : { borderColor: BORDER, background: WHITE }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border-2" style={{ background: payMethod === m.name ? ACCENT : '#F8FAFC', borderColor: payMethod === m.name ? FG : BORDER }}>
                    {m.name === 'CASH' ? <Wallet size={16} strokeWidth={2.5} color={payMethod === m.name ? '#fff' : MUTED} /> : m.name === 'CARD' ? <CreditCard size={16} strokeWidth={2.5} color={payMethod === m.name ? '#fff' : MUTED} /> : <Smartphone size={16} strokeWidth={2.5} color={payMethod === m.name ? '#fff' : MUTED} />}
                  </div>
                  <span className="font-bold" style={{ color: FG, fontFamily: FONT_H }}>
                    {m.name === 'UPI' ? 'UPI / Scan to Pay' : m.name === 'CASH' ? 'Cash' : 'Card / Digital'}
                  </span>
                  {payMethod === m.name && <Check size={18} strokeWidth={3} className="ml-auto" style={{ color: ACCENT }} />}
                </button>
              ))}

              {payMethod === 'CASH' && (
                <div className="rounded-xl p-3 space-y-2 border-2" style={{ background: WHITE, borderColor: BORDER }}>
                  <label className="block text-xs font-black uppercase tracking-wide" style={{ color: MUTED, fontFamily: FONT_H }}>Cash Received (₹)</label>
                  <input type="number" step="0.01" value={cashReceived} onChange={e => setCashReceived(e.target.value)}
                    placeholder={total.toFixed(2)}
                    className="w-full rounded-xl px-3 py-2.5 text-lg font-mono font-bold focus:outline-none border-2 transition"
                    style={{ background: '#F8FAFC', borderColor: BORDER, color: FG }}
                    onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `4px 4px 0px 0px ${ACCENT}`; }}
                    onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }} />
                  {cashChange !== null && cashChange >= 0 && (
                    <div className="flex justify-between rounded-xl px-3 py-2 border-2"
                      style={{ background: `${EMERALD}15`, borderColor: `${EMERALD}60` }}>
                      <span className="text-sm font-bold" style={{ color: '#059669' }}>Change to Return</span>
                      <span className="font-black" style={{ color: '#059669' }}>{fmt(cashChange)}</span>
                    </div>
                  )}
                </div>
              )}

              {payMethod === 'CARD' && (
                <div className="rounded-xl p-3 border-2" style={{ background: WHITE, borderColor: BORDER }}>
                  <label className="block text-xs font-black uppercase tracking-wide mb-2" style={{ color: MUTED, fontFamily: FONT_H }}>Transaction Reference (optional)</label>
                  <input value={cardRef} onChange={e => setCardRef(e.target.value)} placeholder="e.g. TXN-1234567"
                    className="w-full rounded-xl px-3 py-2.5 focus:outline-none border-2 transition font-mono"
                    style={{ background: '#F8FAFC', borderColor: BORDER, color: FG }}
                    onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `4px 4px 0px 0px ${ACCENT}`; }}
                    onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }} />
                </div>
              )}

              {payMethod === 'UPI' && upiMethod?.upiId && (
                <div className="rounded-xl p-4 flex flex-col items-center gap-3 border-2" style={{ background: WHITE, borderColor: BORDER }}>
                  <div className="text-sm font-semibold" style={{ color: MUTED }}>Scan to pay {fmt(total)}</div>
                  <div className="bg-white p-2 rounded-xl border-2" style={{ borderColor: BORDER }}>
                    <QRCodeSVG value={`upi://pay?pa=${upiMethod.upiId}&am=${total.toFixed(2)}&cu=INR&tn=CafePOS`} size={130} />
                  </div>
                  <div className="text-xs font-semibold" style={{ color: MUTED }}>UPI ID: {upiMethod.upiId}</div>
                </div>
              )}
              {payMethod === 'UPI' && !upiMethod?.upiId && (
                <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs border-2" style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}>
                  <AlertTriangle size={13} className="shrink-0" />
                  No UPI ID configured. Go to Backend → Payment Methods.
                </div>
              )}
            </div>

            <div className="px-4 pb-4 shrink-0">
              <button onClick={handlePay} disabled={payLoading || !payMethod}
                className="w-full h-14 rounded-xl font-black text-base transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 border-2"
                style={{ background: ACCENT, color: '#fff', borderColor: FG, boxShadow: `4px 4px 0px 0px ${FG}`, fontFamily: FONT_H }}>
                {payLoading ? (
                  <><Loader2 size={18} className="animate-spin" /><span>Processing…</span></>
                ) : (
                  <><CheckCircle2 size={18} strokeWidth={2.5} /><span>Complete Payment · {fmt(total)}</span></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCoupon && <CouponModal onApply={setCoupon} onClose={() => setShowCoupon(false)} />}
      {showCustomer && (
        <CustomerModal
          onAssign={(c) => {
            setCustomer(c);
            setShowCustomer(false);
          }}
          onClose={() => {
            setShowCustomer(false);
          }}
        />
      )}
      {showReceipt && paidOrder && (
        <ReceiptModal order={paidOrder} onClose={handleNewOrder} onNewOrder={handleNewOrder} />
      )}
    </div>
  );
}
