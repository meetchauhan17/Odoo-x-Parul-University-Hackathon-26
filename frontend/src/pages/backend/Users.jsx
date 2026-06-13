import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
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

export default function Users() {
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
    try { await api.post('/users', addForm); toast.success('User created'); setModal(null); setAddForm({ name: '', email: '', password: '', role: 'EMPLOYEE' }); load(); }
    catch (err) { toast.error(err.error || 'Failed'); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    try { await api.put(`/users/${selected.id}/password`, { password: newPassword }); toast.success('Password updated'); setModal(null); setNewPassword(''); }
    catch (err) { toast.error(err.error || 'Failed'); }
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

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <button onClick={() => setModal('add')} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition">+ Add User</button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
              {['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map(u => (
              <tr key={u.id} className={`transition ${!u.isActive ? 'opacity-50' : 'hover:bg-gray-800/50'}`}>
                <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold">
                    {u.name[0].toUpperCase()}
                  </div>
                  {u.name}
                  {u.id === me?.id && <span className="text-xs text-orange-400">(you)</span>}
                </td>
                <td className="px-4 py-3 text-gray-300 text-sm">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.role === 'ADMIN' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                    {u.isActive ? 'Active' : 'Archived'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setSelected(u); setNewPassword(''); setModal('password'); }} className="text-xs text-blue-400 hover:text-blue-300">Password</button>
                    {u.id !== me?.id && u.isActive && (
                      <button onClick={() => archiveUser(u.id)} className="text-xs text-yellow-400 hover:text-yellow-300">Archive</button>
                    )}
                    {u.id !== me?.id && (
                      <button onClick={() => deleteUser(u.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="p-10 text-center text-gray-500">No users found.</div>}
      </div>

      {modal === 'add' && (
        <Modal title="Add User" onClose={() => setModal(null)}>
          <form onSubmit={addUser} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
              <input required value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email *</label>
              <input required type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password * (min 8 chars)</label>
              <input required type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Role</label>
              <select value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500">
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg">Cancel</button>
              <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium">Create User</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'password' && (
        <Modal title={`Change Password — ${selected?.name}`} onClose={() => setModal(null)}>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">New Password * (min 8 chars)</label>
              <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg">Cancel</button>
              <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium">Update Password</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
