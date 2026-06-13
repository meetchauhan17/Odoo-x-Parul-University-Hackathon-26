import { useEffect, useState } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
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
    try { await api.post('/coupons', couponForm); toast.success('Coupon added'); setModal(null); setCouponForm({ code: '', discountType: 'PERCENTAGE', discountValue: '' }); load(); }
    catch (err) { toast.error(err.error || 'Failed'); }
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
    try { await api.post('/promotions', promoForm); toast.success('Promotion added'); setModal(null); load(); }
    catch (err) { toast.error(err.error || 'Failed'); }
  };

  const togglePromo = async (p) => {
    try { await api.put(`/promotions/${p.id}`, { isActive: !p.isActive }); load(); }
    catch { toast.error('Failed'); }
  };

  const deletePromo = async (id) => {
    try { await api.delete(`/promotions/${id}`); toast.success('Promotion deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Coupons & Promotions</h1>
        <button onClick={() => setModal(tab === 'coupons' ? 'addCoupon' : 'addPromo')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition">
          + Add {tab === 'coupons' ? 'Coupon' : 'Promotion'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
        {['coupons', 'promotions'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'coupons' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
                {['Code', 'Type', 'Value', 'Used', 'Active', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {coupons.map(c => (
                <tr key={c.id} className="hover:bg-gray-800/50 transition">
                  <td className="px-4 py-3 font-mono text-orange-400 font-bold">{c.code}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{c.discountType}</td>
                  <td className="px-4 py-3 text-white font-medium">
                    {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{c.usageCount}×</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleCoupon(c)}
                      className={`w-10 h-5 rounded-full relative transition ${c.isActive ? 'bg-orange-500' : 'bg-gray-700'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${c.isActive ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteCoupon(c.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && <div className="p-10 text-center text-gray-500">No coupons yet.</div>}
        </div>
      )}

      {tab === 'promotions' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
                {['Name', 'Applies To', 'Condition', 'Discount', 'Active', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {promos.map(p => (
                <tr key={p.id} className="hover:bg-gray-800/50 transition">
                  <td className="px-4 py-3 text-white text-sm">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.applyTo === 'PRODUCT' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                      {p.applyTo === 'PRODUCT' ? p.product?.name : 'Order'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {p.applyTo === 'PRODUCT' ? `Min qty: ${p.minQuantity}` : `Min ₹${p.minOrderAmount}`}
                  </td>
                  <td className="px-4 py-3 text-white font-medium text-sm">
                    {p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `₹${p.discountValue}`} off
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePromo(p)}
                      className={`w-10 h-5 rounded-full relative transition ${p.isActive ? 'bg-orange-500' : 'bg-gray-700'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${p.isActive ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deletePromo(p.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {promos.length === 0 && <div className="p-10 text-center text-gray-500">No promotions yet.</div>}
        </div>
      )}

      {modal === 'addCoupon' && (
        <Modal title="Add Coupon Code" onClose={() => setModal(null)}>
          <form onSubmit={addCoupon} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Coupon Code *</label>
              <input required value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 font-mono uppercase"
                placeholder="e.g. SAVE20" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Discount Type</label>
              <select value={couponForm.discountType} onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Value ({couponForm.discountType === 'PERCENTAGE' ? '%' : '₹'}) *
              </label>
              <input required type="number" step="0.01" min="0" value={couponForm.discountValue}
                onChange={e => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg">Cancel</button>
              <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium">Add Coupon</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'addPromo' && (
        <Modal title="Add Promotion" onClose={() => setModal(null)}>
          <form onSubmit={addPromo} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Promotion Name *</label>
              <input required value={promoForm.name} onChange={e => setPromoForm({ ...promoForm, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                placeholder="e.g. Buy 2 get discount" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Applies To</label>
              <select value={promoForm.applyTo} onChange={e => setPromoForm({ ...promoForm, applyTo: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500">
                <option value="ORDER">Entire Order</option>
                <option value="PRODUCT">Specific Product</option>
              </select>
            </div>
            {promoForm.applyTo === 'PRODUCT' ? (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Product</label>
                  <select value={promoForm.productId} onChange={e => setPromoForm({ ...promoForm, productId: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500">
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Min Quantity</label>
                  <input type="number" min="1" value={promoForm.minQuantity} onChange={e => setPromoForm({ ...promoForm, minQuantity: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Min Order Amount (₹)</label>
                <input type="number" step="0.01" min="0" value={promoForm.minOrderAmount} onChange={e => setPromoForm({ ...promoForm, minOrderAmount: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Discount Type</label>
              <select value={promoForm.discountType} onChange={e => setPromoForm({ ...promoForm, discountType: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Discount Value *</label>
              <input required type="number" step="0.01" min="0" value={promoForm.discountValue} onChange={e => setPromoForm({ ...promoForm, discountValue: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg">Cancel</button>
              <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium">Add Promotion</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
