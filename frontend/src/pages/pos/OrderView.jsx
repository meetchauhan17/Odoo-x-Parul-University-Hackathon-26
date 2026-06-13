import { useEffect, useState, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api/client';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────
   SMALL HELPERS
───────────────────────────────────────────────────────── */
const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Modal({ title, onClose, children, maxW = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className={`bg-gray-900 border border-gray-700 rounded-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   RECEIPT MODAL
───────────────────────────────────────────────────────── */
function ReceiptModal({ order, onClose, onNewOrder }) {
  const completedOrder = order;
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const handlePrint = () => window.print();

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
    <Modal title="Payment Complete 🎉" onClose={onClose} maxW="max-w-lg">
      {/* Print-only styles */}
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="text-center mb-6">
        <div className="text-5xl mb-2">✅</div>
        <div className="text-green-400 font-bold text-xl">Payment Successful</div>
      </div>

      {/* Receipt body */}
      <div className="bg-gray-800 rounded-xl p-5 space-y-2 text-sm font-mono">
        <div className="text-center text-white font-bold text-lg mb-3">☕ Cafe POS</div>
        <div className="flex justify-between text-gray-400">
          <span>Order #</span><span className="text-white">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Table</span><span className="text-white">{order.table?.tableNumber || 'Takeaway'}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Date</span><span className="text-white">{new Date(order.createdAt).toLocaleString('en-IN')}</span>
        </div>
        <div className="border-t border-dashed border-gray-600 my-3" />
        {order.lines?.map(l => (
          <div key={l.id} className="flex justify-between">
            <span className="text-gray-300">{l.product?.name} × {l.quantity}</span>
            <span className="text-white">{fmt(l.lineTotal)}</span>
          </div>
        ))}
        <div className="border-t border-dashed border-gray-600 my-3" />
        <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
        {parseFloat(order.discountAmount) > 0 && (
          <div className="flex justify-between text-green-400"><span>Discount</span><span>−{fmt(order.discountAmount)}</span></div>
        )}
        <div className="flex justify-between text-gray-400"><span>Tax (5%)</span><span>{fmt(order.taxAmount)}</span></div>
        <div className="flex justify-between text-orange-400 font-bold text-base mt-2">
          <span>TOTAL</span><span>{fmt(order.total)}</span>
        </div>
        <div className="text-center text-gray-500 text-xs mt-4">Thank you! Visit again 🙏</div>
      </div>

      <div className="flex gap-2 mt-5 no-print">
        <button onClick={handlePrint} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition">🖨 Print</button>
        <button onClick={onNewOrder} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-medium transition">+ New Order</button>
      </div>

      <div className="flex gap-2 mt-3 no-print">
        <input
          type="email"
          value={emailInput}
          onChange={e => setEmailInput(e.target.value)}
          placeholder="customer@email.com"
          className="flex-1 bg-gray-700 border border-gray-600 text-white
                     rounded-lg px-3 py-2 text-sm focus:outline-none
                     focus:border-orange-500"
        />
        <button
          onClick={handleSendEmail}
          disabled={sendingEmail}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2
                     rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {sendingEmail ? 'Sending...' : '📧 Send'}
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
      <form onSubmit={handleApply} className="space-y-4">
        <input required value={code} onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code (e.g. SAVE20)"
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 font-mono uppercase focus:outline-none focus:border-orange-500" />
        {err && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 bg-gray-800 text-white py-2 rounded-lg">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium disabled:opacity-50">
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
    if (search.length < 1) { setCustomers([]); return; }
    const t = setTimeout(async () => {
      try { const res = await api.get(`/customers?search=${search}`); setCustomers(res); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const createAndAssign = async (e) => {
    e.preventDefault();
    try {
      const c = await api.post('/customers', newForm);
      onAssign(c); onClose();
    } catch { toast.error('Failed to create customer'); }
  };

  return (
    <Modal title="Assign Customer" onClose={onClose}>
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 mb-4">
        {['search', 'new'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-md text-sm capitalize transition ${tab === t ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t === 'search' ? 'Search Existing' : 'Create New'}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <div className="space-y-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-500" />
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {customers.map(c => (
              <button key={c.id} onClick={() => { onAssign(c); onClose(); }}
                className="w-full text-left px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition">
                <div className="text-white text-sm font-medium">{c.name}</div>
                <div className="text-gray-500 text-xs">{c.email || c.phone || '—'}</div>
              </button>
            ))}
            {search && customers.length === 0 && <div className="text-gray-600 text-sm text-center py-4">No customers found</div>}
          </div>
        </div>
      )}

      {tab === 'new' && (
        <form onSubmit={createAndAssign} className="space-y-3">
          <input required value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })}
            placeholder="Full name *"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
          <input type="email" value={newForm.email} onChange={e => setNewForm({ ...newForm, email: e.target.value })}
            placeholder="Email"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
          <input value={newForm.phone} onChange={e => setNewForm({ ...newForm, phone: e.target.value })}
            placeholder="Phone"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 text-white py-2 rounded-lg">Cancel</button>
            <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium">Create & Assign</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN: ORDER VIEW
───────────────────────────────────────────────────────── */
export default function OrderView({ table, session, existingOrder, initialOrder, searchQuery, onOrderComplete, onOrderUpdate }) {
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
      if (orderToLoad.customer) setCustomer(orderToLoad.customer);
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
      if (orderToLoad.customer) setCustomer(orderToLoad.customer);
      if (orderToLoad.couponCode) {
        api.post('/coupons/validate', { code: orderToLoad.couponCode })
          .then(setCoupon)
          .catch(() => {});
      }
    }
  }, [existingOrder, initialOrder]);

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
      icon: '✅',
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
    if (!cartItems.length || !session) return;
    try {
      const lines = cartItems.map(i => ({ productId: i.productId, quantity: i.quantity }));
      if (currentOrder) {
        if (currentOrder.status === 'DRAFT') {
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
        if (order.status === 'DRAFT') {
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
      await api.put(`/orders/${order.id}/send-kitchen`);
      toast.success('Order sent to kitchen! 👨‍🍳');
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
        if (order.status === 'DRAFT') {
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
      setPaidOrder(paid);
      setShowReceipt(true);
      setShowPayment(false);
      toast.success(`Payment of ${fmt(paid.total)} received!`, {
        duration: 3000,
        style: { background: '#064e3b', color: '#a7f3d0', border: '1px solid #059669' },
        icon: '💰',
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
  return (
    <div className="pos-layout flex h-full overflow-hidden">
      {/* ══ LEFT — Product Grid ══════════════════════════ */}
      <div className="pos-product-col flex flex-col w-[420px] xl:w-[480px] shrink-0 border-r border-gray-800 bg-gray-950">
        {/* Local search */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input value={localSearch} onChange={e => setLocalSearch(e.target.value)}
              placeholder="Filter products…"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-orange-500" />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto shrink-0 scrollbar-none">
          <button onClick={() => setActiveCat('all')}
            className={`btn-touch shrink-0 px-3 rounded-lg text-xs font-medium transition border ${activeCat === 'all' ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'}`}>
            All
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              style={activeCat === c.id ? { backgroundColor: c.color, borderColor: c.color } : { borderColor: c.color + '66' }}
              className={`btn-touch shrink-0 px-3 rounded-lg text-xs font-medium transition border ${activeCat === c.id ? 'text-white' : 'text-gray-300 hover:text-white'}`}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {dataLoading ? (
            <div className="pos-product-grid grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="skeleton rounded-xl" style={{ minHeight: 120, animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          ) : (
            <div className="pos-product-grid grid grid-cols-3 gap-2">
              {visibleProducts.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="product-card group relative text-left bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-600 rounded-xl p-3 transition active:scale-95"
                  style={{ borderLeftColor: p.category?.color || '#6B7280', borderLeftWidth: 3 }}>
                  <div className="product-card-name text-white leading-tight mb-2">{p.name}</div>
                  <div className="product-card-price text-orange-400">₹{parseFloat(p.price).toFixed(0)}</div>
                  <div className="text-gray-600 text-[10px] mt-1">{p.unitOfMeasure}</div>
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition">+</div>
                </button>
              ))}
            </div>
          )}
          {!dataLoading && visibleProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <div className="text-5xl opacity-30">🔍</div>
              <div className="text-gray-500 text-sm font-medium">
                {localSearch ? `No products matching "${localSearch}"` : 'No products in this category'}
              </div>
              {!localSearch && <div className="text-gray-600 text-xs">Add products in Backend → Products</div>}
            </div>
          )}
        </div>
      </div>

      {/* ══ MIDDLE — Cart ════════════════════════════════ */}
      <div className={`pos-cart-col flex flex-col ${showPayment ? 'hidden xl:flex xl:w-80' : 'flex-1'} bg-gray-950 border-r border-gray-800`}>
        {/* Cart Header */}
        <div className="px-4 py-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-semibold">
                {currentOrder ? `Order ${currentOrder.orderNumber}` : 'New Order'}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {table ? `🪑 Table ${table.tableNumber}` : '🥡 Takeaway'}
                {customer ? ` · 👤 ${customer.name}` : ''}
              </div>
            </div>
            <div className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {cartItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
              <div className="text-5xl opacity-20">🛒</div>
              <div className="text-gray-500 text-sm font-medium">Cart is empty</div>
              <div className="text-gray-600 text-xs">No orders this session yet.<br/>Tap a product on the left to add it.</div>
            </div>
          )}
          {cartItems.map((item, idx) => (
            <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-semibold truncate">{item.name}</div>
                <div className="text-gray-500 text-xs mt-0.5">₹{item.price.toFixed(2)} each</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => updateQty(idx, -1)} className="qty-btn bg-gray-800 hover:bg-gray-700 text-white">−</button>
                <span className="w-8 text-center text-white text-base font-bold">{item.quantity}</span>
                <button onClick={() => updateQty(idx, +1)} className="qty-btn bg-gray-800 hover:bg-gray-700 text-white">+</button>
              </div>
              <div className="text-orange-400 font-bold text-sm w-16 text-right shrink-0">
                {fmt(item.price * item.quantity)}
              </div>
              <button onClick={() => removeItem(idx)}
                className="btn-touch text-gray-600 hover:text-red-400 transition text-xl">
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Promo banners */}
        <div className="px-4">
          {suggestions.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-3 mb-3 animate-slide-in">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                ✨ Frequently ordered with this
              </p>
              <div className="flex gap-2 flex-wrap">
                {suggestions.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex items-center gap-2 bg-gray-750 hover:bg-gray-700
                               text-white text-xs px-3 py-2 rounded-lg transition
                               border border-gray-700 hover:border-orange-500/80 active:scale-95"
                    style={{ borderLeftColor: product.category?.color || '#6b7280', borderLeftWidth: 3 }}
                  >
                    <span>{product.name}</span>
                    <span className="text-orange-400 font-semibold">
                      +₹{parseFloat(product.price).toFixed(0)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activePromos.length > 0 && (
            <div className="space-y-2 mb-3">
              {activePromos.map((promo, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-green-900 border border-green-700
                             text-green-300 rounded-lg px-3 py-2 text-sm"
                >
                  <span>🎉</span>
                  <span className="flex-1">{promo.name}</span>
                  <span className="font-semibold">-₹{promo.discount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {couponData && (
            <div className="flex items-center gap-2 bg-blue-900 border border-blue-700
                            text-blue-300 rounded-lg px-3 py-2 text-sm mb-3">
              <span>🎟️</span>
              <span className="flex-1">Coupon: {couponData.code}</span>
              <span className="font-semibold">-₹{couponDiscountAmt.toFixed(2)}</span>
              <button onClick={() => setCouponData(null)} className="text-red-400 ml-1">×</button>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="px-4 pb-3 shrink-0">
          <div className="bg-gray-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span className="text-white">₹{subtotal.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Discount</span>
                <span className="text-green-400">-₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-400">
              <span>Tax (5%)</span>
              <span className="text-white">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t
                            border-gray-700 pt-2 mt-2">
              <span className="text-white">Total</span>
              <span className="text-orange-400">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-3 pb-3 grid grid-cols-2 gap-2 shrink-0">
          <button onClick={() => setShowCustomer(true)}
            className="btn-touch flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white px-3 rounded-xl text-sm transition border border-gray-700">
            👤 {customer ? customer.name.split(' ')[0] : 'Customer'}
          </button>
          <button onClick={() => setShowCoupon(true)}
            className={`btn-touch flex items-center justify-center gap-1.5 px-3 rounded-xl text-sm transition border ${
              coupon ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
            }`}>
            🎫 {coupon ? coupon.code : 'Coupon'}
          </button>
          <button onClick={handleSendKitchen} disabled={kitchenLoading || !cartItems.length}
            className="btn-touch flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-xl text-sm font-medium transition disabled:opacity-50">
            {kitchenLoading ? '⏳' : '👨\u200d🍳 Kitchen'}
          </button>
          <button onClick={() => setShowPayment(true)} disabled={!cartItems.length}
            className="pay-btn flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 rounded-xl font-bold transition disabled:opacity-50 w-full">
            💳 Charge {cartItems.length > 0 ? fmt(total) : ''}
          </button>
        </div>
      </div>

      {/* ══ RIGHT — Payment Panel ════════════════════════ */}
      {showPayment && (
        <div className="flex flex-col w-80 xl:w-96 bg-gray-950 border-l border-gray-800 shrink-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
            <h2 className="text-white font-bold text-lg">Checkout</h2>
            <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
          </div>

          {/* Total */}
          <div className="px-5 py-5 border-b border-gray-800 shrink-0">
            <div className="text-gray-400 text-sm mb-1">Amount Due</div>
            <div className="text-4xl font-bold text-orange-400">{fmt(total)}</div>
            {table && <div className="text-xs text-gray-500 mt-1">Table {table.tableNumber}</div>}
          </div>

          {/* Payment Method Selection */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Select Payment Method</div>
            {paymentMethods.map(m => (
              <button key={m.id} onClick={() => setPayMethod(m.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition ${payMethod === m.name ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-900 hover:border-gray-600'}`}>
                <span className="text-2xl">{m.name === 'CASH' ? '💵' : m.name === 'CARD' ? '💳' : '📱'}</span>
                <span className="text-white font-medium">{m.name === 'UPI' ? 'UPI' : m.name === 'CASH' ? 'Cash' : 'Card / Digital'}</span>
                {payMethod === m.name && <span className="ml-auto text-orange-400">✓</span>}
              </button>
            ))}

            {/* Cash change calculator */}
            {payMethod === 'CASH' && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cash Received (₹)</label>
                  <input type="number" step="0.01" value={cashReceived} onChange={e => setCashReceived(e.target.value)}
                    placeholder={total.toFixed(2)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-500 text-lg font-mono" />
                </div>
                {cashChange !== null && cashChange >= 0 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2.5 flex justify-between">
                    <span className="text-green-400 text-sm">Change to Return</span>
                    <span className="text-green-400 font-bold text-lg">{fmt(cashChange)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Card reference */}
            {payMethod === 'CARD' && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <label className="block text-xs text-gray-400 mb-1">Transaction Reference (optional)</label>
                <input value={cardRef} onChange={e => setCardRef(e.target.value)}
                  placeholder="e.g. TXN-1234567"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
              </div>
            )}

            {/* UPI QR */}
            {payMethod === 'UPI' && upiMethod?.upiId && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col items-center gap-3">
                <div className="text-sm text-gray-400">Scan to pay {fmt(total)}</div>
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG value={`upi://pay?pa=${upiMethod.upiId}&am=${total.toFixed(2)}&cu=INR&tn=CafePOS`} size={160} />
                </div>
                <div className="text-xs text-gray-500">UPI ID: {upiMethod.upiId}</div>
              </div>
            )}
            {payMethod === 'UPI' && !upiMethod?.upiId && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-xs text-yellow-400">
                ⚠ No UPI ID configured. Go to Backend → Payment Methods.
              </div>
            )}
          </div>

          {/* Complete Payment */}
          <div className="px-5 pb-5 shrink-0">
            <button onClick={handlePay} disabled={payLoading || !payMethod}
              className="pay-btn w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition disabled:opacity-50">
              {payLoading ? '⏳ Processing…' : `Complete Payment · ${fmt(total)}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showCoupon && <CouponModal onApply={setCoupon} onClose={() => setShowCoupon(false)} />}
      {showCustomer && <CustomerModal onAssign={setCustomer} onClose={() => setShowCustomer(false)} />}
      {showReceipt && paidOrder && (
        <ReceiptModal order={paidOrder} onClose={() => setShowReceipt(false)} onNewOrder={handleNewOrder} />
      )}
    </div>
  );
}
