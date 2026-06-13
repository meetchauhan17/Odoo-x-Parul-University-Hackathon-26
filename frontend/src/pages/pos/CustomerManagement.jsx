import { useEffect, useState } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.get(`/customers${search ? `?search=${search}` : ''}`);
        setCustomers(data || []);
      } catch { toast.error('Failed to load customers'); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const c = await api.post('/customers', form);
      setCustomers(prev => [c, ...prev]);
      setForm({ name: '', email: '', phone: '' });
      setShowForm(false);
      toast.success(`${c.name} added!`);
    } catch (err) {
      toast.error(err?.error || 'Failed to create customer');
    } finally { setSaving(false); }
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-bold text-lg">Customers</h2>
          <p className="text-gray-500 text-sm mt-0.5">{customers.length} customers</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + Add Customer
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="px-6 py-4 border-b border-gray-800 bg-gray-900 shrink-0">
          <div className="grid grid-cols-3 gap-3">
            <input
              required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Full name *"
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
            />
            <input
              type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
            />
            <input
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Customer'}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="px-6 py-3 shrink-0">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="space-y-2 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <div className="text-5xl opacity-20">👤</div>
            <div className="text-gray-500 font-medium">{search ? `No customers matching "${search}"` : 'No customers yet.'}</div>
            {!search && <div className="text-gray-600 text-sm">Add your first customer using the button above.</div>}
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {customers.map(c => (
              <div key={c.id}
                onClick={() => setSelected(selected?.id === c.id ? null : c)}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-4 py-3 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-sm shrink-0">
                    {c.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm">{c.name}</div>
                    <div className="text-gray-500 text-xs mt-0.5 truncate">
                      {[c.email, c.phone].filter(Boolean).join(' · ') || 'No contact info'}
                    </div>
                  </div>
                  <div className="text-gray-600 text-xs">
                    {c.orders?.length || 0} orders
                  </div>
                </div>

                {/* Expanded order history */}
                {selected?.id === c.id && c.orders?.length > 0 && (
                  <div className="mt-3 border-t border-gray-800 pt-3 space-y-1">
                    <div className="text-xs text-gray-500 mb-2 uppercase font-semibold tracking-wide">Order History</div>
                    {c.orders.slice(0, 5).map(o => (
                      <div key={o.id} className="flex justify-between text-xs text-gray-400">
                        <span>{o.orderNumber} · {new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
                        <span className="text-orange-400">{fmt(o.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
