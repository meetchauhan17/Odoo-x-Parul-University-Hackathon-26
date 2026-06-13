import { useEffect, useState } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { UtensilsCrossed, Edit3, Trash2, X, Plus, Check } from 'lucide-react';

const UNITS = ['piece', 'cup', 'glass', 'plate', 'bowl', 'bottle', 'kg', 'g', 'ml', 'l'];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-slate-800 rounded-2xl w-full max-w-lg shadow-pop-lg animate-popIn max-h-[90vh] overflow-y-auto">
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

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [newCat, setNewCat] = useState(false);
  const [form, setForm] = useState({ name: '', categoryId: '', price: '', unitOfMeasure: 'piece', tax: '5', description: '', showOnKds: true });
  const [catForm, setCatForm] = useState({ name: '', color: '#6B7280' });

  const load = async () => {
    try {
      const [p, c] = await Promise.all([api.get('/products'), api.get('/categories')]);
      setProducts(p); setCategories(c);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ name: '', categoryId: categories[0]?.id || '', price: '', unitOfMeasure: 'piece', tax: '5', description: '', showOnKds: true }); setNewCat(false); setCatForm({ name: '', color: '#6B7280' }); setSelected(null); setModal('add'); };
  const openEdit = (p) => { setForm({ name: p.name, categoryId: p.categoryId, price: p.price, unitOfMeasure: p.unitOfMeasure, tax: p.tax, description: p.description || '', showOnKds: p.showOnKds }); setNewCat(false); setSelected(p); setModal('edit'); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, price: parseFloat(form.price), tax: parseFloat(form.tax), categoryId: newCat ? catForm : form.categoryId };
      if (modal === 'add') await api.post('/products', payload);
      else await api.put(`/products/${selected.id}`, payload);
      toast.success(modal === 'add' ? 'Product added' : 'Product updated');
      setModal(null); load();
    } catch (err) { toast.error(err.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/products/${selected.id}`); toast.success('Product removed'); setModal(null); load(); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 font-semibold">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={24} className="text-[#F472B6]" />
          <h1 className="text-2xl font-black text-slate-800 font-outfit">Products</h1>
        </div>
        <button
          onClick={openAdd}
          className="bg-[#F472B6] hover:bg-[#e45ea0] text-white border-2 border-slate-800 rounded-xl font-bold px-4 py-2.5 text-sm shadow-pop-sm hover:translate-y-[-2px] active:translate-y-[2px] transition-all flex items-center gap-1.5"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white border-2 border-slate-800 rounded-2xl overflow-hidden shadow-pop">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b-2 border-slate-800">
                {['Name', 'Category', 'Price', 'Tax', 'Unit', 'KDS', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left font-bold text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-4 text-slate-800 font-bold">{p.name}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: (p.category?.color || '#6B7280') + '15', color: p.category?.color || '#6B7280', border: `1px solid ${(p.category?.color || '#6B7280')}33` }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.category?.color || '#6B7280' }} />
                      {p.category?.name}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-800 font-bold">₹{parseFloat(p.price).toFixed(2)}</td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">{p.tax}%</td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">{p.unitOfMeasure}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${p.showOnKds ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                      {p.showOnKds ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-lg transition"
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => { setSelected(p); setModal('delete'); }}
                        className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-750 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <div className="p-10 text-center text-slate-400 font-semibold">No products yet. Add one!</div>}
        </div>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Product' : 'Edit Product'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Category *</label>
              <select value={newCat ? '__new__' : form.categoryId}
                onChange={e => { if (e.target.value === '__new__') setNewCat(true); else { setNewCat(false); setForm({ ...form, categoryId: e.target.value }); } }}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="__new__">+ Create new category</option>
              </select>
            </div>
            {newCat && (
              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">New Category Name</label>
                  <input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                    className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F472B6] font-semibold" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-600">Color</label>
                  <input type="color" value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-2 border-slate-800 bg-transparent p-0 overflow-hidden" />
                  <div className="w-6 h-6 rounded-full border border-slate-200 shadow-pop-sm" style={{ backgroundColor: catForm.color }} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Price (₹) *</label>
                <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tax %</label>
                <input type="number" step="0.01" min="0" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })}
                  className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Unit of Measure</label>
              <select value={form.unitOfMeasure} onChange={e => setForm({ ...form, unitOfMeasure: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F472B6] transition font-semibold resize-none" />
            </div>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <label className="text-sm font-bold text-slate-700">Show on KDS</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, showOnKds: !form.showOnKds })}
                className={`w-12 h-7 rounded-full border-2 border-slate-800 transition ${form.showOnKds ? 'bg-[#F472B6]' : 'bg-slate-200'} relative`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white border-2 border-slate-800 rounded-full shadow transition-all ${form.showOnKds ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl transition font-bold text-sm">Cancel</button>
              <button type="submit" className="flex-1 bg-[#F472B6] hover:bg-[#e45ea0] text-white border-2 border-slate-800 py-2.5 rounded-xl transition font-bold text-sm shadow-pop-sm hover:translate-y-[-1px] active:translate-y-[1px]">
                {modal === 'add' ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'delete' && (
        <Modal title="Delete Product" onClose={() => setModal(null)}>
          <p className="text-slate-600 mb-6 font-semibold">Are you sure you want to deactivate <span className="text-slate-800 font-extrabold">"{selected?.name}"</span>? It will be hidden from the POS.</p>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl transition font-bold text-sm">Cancel</button>
            <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-650 text-white border-2 border-slate-800 py-2.5 rounded-xl transition font-bold text-sm shadow-pop-sm hover:translate-y-[-1px] active:translate-y-[1px]">Deactivate</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
