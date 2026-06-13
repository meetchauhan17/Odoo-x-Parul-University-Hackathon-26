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

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', color: '#F97316' });

  const load = async () => {
    try {
      const [c, p] = await Promise.all([api.get('/categories'), api.get('/products')]);
      setCategories(c); setProducts(p);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ name: '', color: '#F97316' }); setSelected(null); setModal('add'); };
  const openEdit = (c) => { setForm({ name: c.name, color: c.color }); setSelected(c); setModal('edit'); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') await api.post('/categories', form);
      else await api.put(`/categories/${selected.id}`, form);
      toast.success(modal === 'add' ? 'Category added' : 'Category updated');
      setModal(null); load();
    } catch (err) { toast.error(err.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/categories/${selected.id}`); toast.success('Category deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Categories</h1>
        <button onClick={openAdd} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition">+ Add Category</button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
              {['Color', 'Name', 'Products', 'Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {categories.map(c => {
              const count = products.filter(p => p.categoryId === c.id).length;
              return (
                <tr key={c.id} className="hover:bg-gray-800/50 transition">
                  <td className="px-6 py-4">
                    <div className="w-8 h-8 rounded-full border-2 border-gray-700" style={{ backgroundColor: c.color }} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: c.color + '33', border: `1px solid ${c.color}66` }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{count} product{count !== 1 ? 's' : ''}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(c)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                      <button onClick={() => { setSelected(c); setModal('delete'); }} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {categories.length === 0 && <div className="p-10 text-center text-gray-500">No categories yet.</div>}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Category' : 'Edit Category'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                placeholder="e.g. Hot Drinks" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Color</label>
              <div className="flex items-center gap-4">
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                  className="w-14 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                <div className="flex-1 h-10 rounded-lg border border-gray-700 flex items-center px-3 gap-2">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: form.color }} />
                  <span className="text-gray-400 text-sm font-mono">{form.color}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['#E53E3E','#DD6B20','#D69E2E','#38A169','#3182CE','#805AD5','#D53F8C','#F97316'].map(c => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full border-2 transition ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition">Cancel</button>
              <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition font-medium">
                {modal === 'add' ? 'Add Category' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'delete' && (
        <Modal title="Delete Category" onClose={() => setModal(null)}>
          <p className="text-gray-300 mb-6">Delete <span className="text-white font-semibold">"{selected?.name}"</span>? Products in this category will need to be reassigned.</p>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition">Cancel</button>
            <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition font-medium">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
