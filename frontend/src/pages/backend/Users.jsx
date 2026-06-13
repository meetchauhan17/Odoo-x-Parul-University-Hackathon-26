import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Users, Key, Archive, Trash2, X, Plus } from 'lucide-react';

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

export default function UsersPage() {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' });
  const [newPassword, setNewPassword] = useState('');

  const load = async () => {
    try { const data = await api.get('/users'); setUsers(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', addForm);
      toast.success('User created');
      setModal(null);
      setAddForm({ name: '', email: '', password: '', role: 'EMPLOYEE' });
      load();
    } catch (err) { toast.error(err.error || 'Failed'); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${selected.id}/password`, { password: newPassword });
      toast.success('Password updated');
      setModal(null);
      setNewPassword('');
    } catch (err) { toast.error(err.error || 'Failed'); }
  };

  const archiveUser = async (id) => {
    try { await api.put(`/users/${id}/archive`); toast.success('User archived'); load(); }
    catch { toast.error('Failed'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try { await api.delete(`/users/${id}`); toast.success('User deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 font-semibold">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users size={24} className="text-[#FBBF24]" />
          <h1 className="text-2xl font-black text-slate-800 font-outfit">Users</h1>
        </div>
        <button
          onClick={() => setModal('add')}
          className="bg-[#FBBF24] hover:bg-[#e6ab1a] text-slate-900 border-2 border-slate-800 rounded-xl font-bold px-4 py-2.5 text-sm shadow-pop-sm hover:translate-y-[-2px] active:translate-y-[2px] transition-all flex items-center gap-1.5"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="bg-white border-2 border-slate-800 rounded-2xl overflow-hidden shadow-pop">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b-2 border-slate-800">
                {['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left font-bold text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className={`transition ${!u.isActive ? 'opacity-55 bg-slate-50/30' : 'hover:bg-slate-50/50'}`}>
                  <td className="px-5 py-4 text-slate-800 font-bold flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl border-2 border-slate-800 bg-[#FBBF24] text-slate-900 flex items-center justify-center text-sm font-black shadow-pop-sm shrink-0">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>{u.name}</span>
                      {u.id === me?.id && <span className="text-xs bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md font-bold">(you)</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-semibold text-sm">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${u.role === 'ADMIN' ? 'bg-orange-500/10 border-orange-500/20 text-orange-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${u.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                      {u.isActive ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 font-semibold text-sm">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelected(u); setNewPassword(''); setModal('password'); }}
                        className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-lg transition"
                      >
                        <Key size={12} /> Password
                      </button>
                      {u.id !== me?.id && u.isActive && (
                        <button
                          onClick={() => archiveUser(u.id)}
                          className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition"
                        >
                          <Archive size={12} /> Archive
                        </button>
                      )}
                      {u.id !== me?.id && (
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-750 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="p-10 text-center text-slate-400 font-semibold">No users found.</div>}
        </div>
      </div>

      {modal === 'add' && (
        <Modal title="Add User" onClose={() => setModal(null)}>
          <form onSubmit={addUser} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Full Name *</label>
              <input required value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#FBBF24] transition font-semibold" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email *</label>
              <input required type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#FBBF24] transition font-semibold" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Password * (min 8 chars)</label>
              <input required type="password" minLength={8} value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#FBBF24] transition font-semibold" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
              <select value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#FBBF24] transition font-semibold">
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl transition font-bold text-sm">Cancel</button>
              <button type="submit" className="flex-1 bg-[#FBBF24] hover:bg-[#e6ab1a] text-slate-900 border-2 border-slate-800 py-2.5 rounded-xl transition font-bold text-sm shadow-pop-sm hover:translate-y-[-1px] active:translate-y-[1px]">Create User</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'password' && (
        <Modal title={`Change Password — ${selected?.name}`} onClose={() => setModal(null)}>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">New Password * (min 8 chars)</label>
              <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#FBBF24] transition font-semibold" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl transition font-bold text-sm">Cancel</button>
              <button type="submit" className="flex-1 bg-[#FBBF24] hover:bg-[#e6ab1a] text-slate-900 border-2 border-slate-800 py-2.5 rounded-xl transition font-bold text-sm shadow-pop-sm hover:translate-y-[-1px] active:translate-y-[1px]">Update Password</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
