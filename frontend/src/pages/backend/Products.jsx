import { useEffect, useState } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const UNITS = ['piece', 'cup', 'glass', 'plate', 'bowl', 'bottle', 'kg', 'g', 'ml', 'l'];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
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
      const payload = { ...form, categoryId: newCat ? catForm : form.categoryId };
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

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <button onClick={openAdd} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition">+ Add Product</button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
              {['Name', 'Category', 'Price', 'Tax', 'Unit', 'KDS', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-800/50 transition">
                <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: p.category?.color || '#6B7280' }}>
                    {p.category?.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-white">₹{parseFloat(p.price).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-300">{p.tax}%</td>
                <td className="px-4 py-3 text-gray-300">{p.unitOfMeasure}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${p.showOnKds ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {p.showOnKds ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                    <button onClick={() => { setSelected(p); setModal('delete'); }} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <div className="p-10 text-center text-gray-500">No products yet. Add one!</div>}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Product' : 'Edit Product'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category *</label>
              <select value={newCat ? '__new__' : form.categoryId}
                onChange={e => { if (e.target.value === '__new__') setNewCat(true); else { setNewCat(false); setForm({ ...form, categoryId: e.target.value }); } }}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="__new__">+ Create new category</option>
              </select>
            </div>
            {newCat && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">New Category Name</label>
                  <input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-400">Color</label>
                  <input type="color" value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: catForm.color }} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Price (₹) *</label>
                <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tax %</label>
                <input type="number" step="0.01" min="0" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Unit of Measure</label>
              <select value={form.unitOfMeasure} onChange={e => setForm({ ...form, unitOfMeasure: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 resize-none" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Show on KDS</label>
              <button type="button" onClick={() => setForm({ ...form, showOnKds: !form.showOnKds })}
                className={`w-11 h-6 rounded-full transition ${form.showOnKds ? 'bg-orange-500' : 'bg-gray-700'} relative`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.showOnKds ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition">Cancel</button>
              <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition font-medium">
                {modal === 'add' ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'delete' && (
        <Modal title="Delete Product" onClose={() => setModal(null)}>
          <p className="text-gray-300 mb-6">Are you sure you want to deactivate <span className="text-white font-semibold">"{selected?.name}"</span>? It will be hidden from the POS.</p>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition">Cancel</button>
            <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition font-medium">Deactivate</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
