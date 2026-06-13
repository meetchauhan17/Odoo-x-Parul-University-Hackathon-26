import { useEffect, useState } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Ticket, Tag, Trash2, X, Plus, Percent, Coins } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-slate-800 rounded-2xl w-full max-w-md shadow-pop-lg animate-popIn">
        <div className="flex items-center justify-between p-5 border-b-2 border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 font-outfit">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function Coupons() {
  const [tab, setTab] = useState('coupons');
  const [coupons, setCoupons] = useState([]);
  const [promos, setPromos] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'PERCENTAGE', discountValue: '' });
  const [promoForm, setPromoForm] = useState({ name: '', applyTo: 'ORDER', productId: '', minQuantity: '', minOrderAmount: '', discountType: 'PERCENTAGE', discountValue: '' });

  const load = async () => {
    try {
      const [c, p, pr] = await Promise.all([api.get('/coupons'), api.get('/promotions'), api.get('/products')]);
      setCoupons(c); setPromos(p); setProducts(pr);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.post('/coupons', {
        ...couponForm,
        discountValue: parseFloat(couponForm.discountValue)
      });
      toast.success('Coupon added');
      setModal(null);
      setCouponForm({ code: '', discountType: 'PERCENTAGE', discountValue: '' });
      load();
    } catch (err) { toast.error(err.error || 'Failed'); }
  };

  const toggleCoupon = async (c) => {
    try { await api.put(`/coupons/${c.id}`, { isActive: !c.isActive }); load(); }
    catch { toast.error('Failed'); }
  };

  const deleteCoupon = async (id) => {
    try { await api.delete(`/coupons/${id}`); toast.success('Coupon deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const addPromo = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...promoForm,
        discountValue: parseFloat(promoForm.discountValue),
        minQuantity: promoForm.applyTo === 'PRODUCT' ? parseInt(promoForm.minQuantity || 1, 10) : null,
        minOrderAmount: promoForm.applyTo === 'ORDER' ? parseFloat(promoForm.minOrderAmount || 0) : null,
        productId: promoForm.applyTo === 'PRODUCT' ? promoForm.productId : null
      };
      await api.post('/promotions', payload);
      toast.success('Promotion added');
      setModal(null);
      load();
    } catch (err) { toast.error(err.error || 'Failed'); }
  };

  const togglePromo = async (p) => {
    try { await api.put(`/promotions/${p.id}`, { isActive: !p.isActive }); load(); }
    catch { toast.error('Failed'); }
  };

  const deletePromo = async (id) => {
    try { await api.delete(`/promotions/${id}`); toast.success('Promotion deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 font-semibold">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Ticket size={24} className="text-[#F472B6]" />
          <h1 className="text-2xl font-black text-slate-800 font-outfit">Coupons & Promotions</h1>
        </div>
        <button
          onClick={() => setModal(tab === 'coupons' ? 'addCoupon' : 'addPromo')}
          className="bg-[#F472B6] hover:bg-[#e45ea0] text-white border-2 border-slate-800 rounded-xl font-bold px-4 py-2.5 text-sm shadow-pop-sm hover:translate-y-[-2px] active:translate-y-[2px] transition-all flex items-center gap-1.5"
        >
          <Plus size={16} /> Add {tab === 'coupons' ? 'Coupon' : 'Promotion'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white border-2 border-slate-800 rounded-2xl p-1.5 mb-6 w-fit shadow-pop-sm">
        {['coupons', 'promotions'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
              tab === t
                ? 'bg-[#FBBF24] border-2 border-slate-800 text-slate-900 shadow-pop-sm'
                : 'text-slate-500 border-2 border-transparent hover:text-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'coupons' && (
        <div className="bg-white border-2 border-slate-800 rounded-2xl overflow-hidden shadow-pop">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b-2 border-slate-800">
                  {['Code', 'Type', 'Value', 'Used', 'Active', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left font-bold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-4 font-mono text-[#F472B6] font-bold text-sm">{c.code}</td>
                    <td className="px-5 py-4 text-slate-600 font-semibold text-sm">{c.discountType}</td>
                    <td className="px-5 py-4 text-slate-800 font-extrabold text-sm">
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-semibold text-sm">{c.usageCount}×</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleCoupon(c)}
                        className={`w-12 h-7 rounded-full border-2 border-slate-800 transition relative ${c.isActive ? 'bg-[#34D399]' : 'bg-slate-200'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white border-2 border-slate-800 rounded-full shadow transition-all ${c.isActive ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => deleteCoupon(c.id)}
                        className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-750 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {coupons.length === 0 && <div className="p-10 text-center text-slate-400 font-semibold">No coupons yet.</div>}
          </div>
        </div>
      )}

      {tab === 'promotions' && (
        <div className="bg-white border-2 border-slate-800 rounded-2xl overflow-hidden shadow-pop">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b-2 border-slate-800">
                  {['Name', 'Applies To', 'Condition', 'Discount', 'Active', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left font-bold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promos.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-4 text-slate-800 font-bold text-sm">{p.name}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${p.applyTo === 'PRODUCT' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' : 'bg-green-500/10 border-green-500/20 text-green-600'}`}>
                        {p.applyTo === 'PRODUCT' ? p.product?.name : 'Order-wide'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-semibold text-xs">
                      {p.applyTo === 'PRODUCT' ? `Min qty: ${p.minQuantity}` : `Min spend: ₹${p.minOrderAmount}`}
                    </td>
                    <td className="px-5 py-4 text-slate-800 font-extrabold text-sm">
                      {p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `₹${p.discountValue}`} Off
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => togglePromo(p)}
                        className={`w-12 h-7 rounded-full border-2 border-slate-800 transition relative ${p.isActive ? 'bg-[#34D399]' : 'bg-slate-200'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white border-2 border-slate-800 rounded-full shadow transition-all ${p.isActive ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => deletePromo(p.id)}
                        className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-750 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {promos.length === 0 && <div className="p-10 text-center text-slate-400 font-semibold">No promotions yet.</div>}
          </div>
        </div>
      )}

      {modal === 'addCoupon' && (
        <Modal title="Add Coupon Code" onClose={() => setModal(null)}>
          <form onSubmit={addCoupon} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Coupon Code *</label>
              <input required value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-mono uppercase font-semibold"
                placeholder="e.g. SAVE20" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Discount Type</label>
              <select value={couponForm.discountType} onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Value ({couponForm.discountType === 'PERCENTAGE' ? '%' : '₹'}) *
              </label>
              <input required type="number" step="0.01" min="0" value={couponForm.discountValue}
                onChange={e => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl transition font-bold text-sm">Cancel</button>
              <button type="submit" className="flex-1 bg-[#F472B6] hover:bg-[#e45ea0] text-white border-2 border-slate-800 py-2.5 rounded-xl transition font-bold text-sm shadow-pop-sm hover:translate-y-[-1px] active:translate-y-[1px]">Add Coupon</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'addPromo' && (
        <Modal title="Add Promotion" onClose={() => setModal(null)}>
          <form onSubmit={addPromo} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Promotion Name *</label>
              <input required value={promoForm.name} onChange={e => setPromoForm({ ...promoForm, name: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold"
                placeholder="e.g. Buy 2 get discount" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Applies To</label>
              <select value={promoForm.applyTo} onChange={e => setPromoForm({ ...promoForm, applyTo: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold">
                <option value="ORDER">Entire Order</option>
                <option value="PRODUCT">Specific Product</option>
              </select>
            </div>
            {promoForm.applyTo === 'PRODUCT' ? (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Product</label>
                  <select value={promoForm.productId} onChange={e => setPromoForm({ ...promoForm, productId: e.target.value })}
                    className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold">
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Min Quantity</label>
                  <input type="number" min="1" value={promoForm.minQuantity} onChange={e => setPromoForm({ ...promoForm, minQuantity: e.target.value })}
                    className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold" />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Min Order Amount (₹)</label>
                <input type="number" step="0.01" min="0" value={promoForm.minOrderAmount} onChange={e => setPromoForm({ ...promoForm, minOrderAmount: e.target.value })}
                  className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold" />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Discount Type</label>
              <select value={promoForm.discountType} onChange={e => setPromoForm({ ...promoForm, discountType: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Discount Value *</label>
              <input required type="number" step="0.01" min="0" value={promoForm.discountValue} onChange={e => setPromoForm({ ...promoForm, discountValue: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl transition font-bold text-sm">Cancel</button>
              <button type="submit" className="flex-1 bg-[#F472B6] hover:bg-[#e45ea0] text-white border-2 border-slate-800 py-2.5 rounded-xl transition font-bold text-sm shadow-pop-sm hover:translate-y-[-1px] active:translate-y-[1px]">Add Promotion</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
