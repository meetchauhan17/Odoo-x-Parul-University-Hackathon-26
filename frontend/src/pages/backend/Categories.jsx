import { useEffect, useState } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Tag, Edit3, Trash2, X, Plus } from 'lucide-react';

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
    try {
      await api.delete(`/categories/${selected.id}`);
      toast.success('Category deleted');
      setModal(null);
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 font-semibold">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Tag size={24} className="text-[#8B5CF6]" />
          <h1 className="text-2xl font-black text-slate-800 font-outfit">Categories</h1>
        </div>
        <button
          onClick={openAdd}
          className="bg-[#8B5CF6] hover:bg-[#7c4ee4] text-white border-2 border-slate-800 rounded-xl font-bold px-4 py-2.5 text-sm shadow-pop-sm hover:translate-y-[-2px] active:translate-y-[2px] transition-all flex items-center gap-1.5"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="bg-white border-2 border-slate-800 rounded-2xl overflow-hidden shadow-pop">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b-2 border-slate-800">
                {['Color', 'Name', 'Products Count', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3.5 text-left font-bold text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map(c => {
                const count = products.filter(p => p.categoryId === c.id).length;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 rounded-xl border-2 border-slate-800 shadow-pop-sm" style={{ backgroundColor: c.color }} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold text-slate-800"
                        style={{ backgroundColor: c.color + '15', border: `1px solid ${c.color}44` }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-semibold">{count} product{count !== 1 ? 's' : ''}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-lg transition"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => { setSelected(c); setModal('delete'); }}
                          className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-750 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {categories.length === 0 && <div className="p-10 text-center text-slate-400 font-semibold">No categories yet.</div>}
        </div>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Category' : 'Edit Category'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#8B5CF6] transition font-semibold"
                placeholder="e.g. Hot Drinks" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Color</label>
              <div className="flex items-center gap-4">
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                  className="w-14 h-11 rounded-xl cursor-pointer border-2 border-slate-800 bg-transparent p-0 overflow-hidden shrink-0" />
                <div className="flex-1 h-11 rounded-xl border-2 border-slate-200 flex items-center px-3 gap-2">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: form.color }} />
                  <span className="text-slate-500 text-sm font-mono font-bold">{form.color}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['#E53E3E','#DD6B20','#D69E2E','#38A169','#3182CE','#805AD5','#D53F8C','#F97316'].map(c => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full border-2 transition ${form.color === c ? 'border-slate-800 scale-110 shadow-pop-sm' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl transition font-bold text-sm">Cancel</button>
              <button type="submit" className="flex-1 bg-[#8B5CF6] hover:bg-[#7c4ee4] text-white border-2 border-slate-800 py-2.5 rounded-xl transition font-bold text-sm shadow-pop-sm hover:translate-y-[-1px] active:translate-y-[1px]">
                {modal === 'add' ? 'Add Category' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'delete' && (
        <Modal title="Delete Category" onClose={() => setModal(null)}>
          <p className="text-slate-600 mb-6 font-semibold">Delete <span className="text-slate-800 font-extrabold">"{selected?.name}"</span>? Products in this category will need to be reassigned.</p>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl transition font-bold text-sm">Cancel</button>
            <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-650 text-white border-2 border-slate-800 py-2.5 rounded-xl transition font-bold text-sm shadow-pop-sm hover:translate-y-[-1px] active:translate-y-[1px]">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
