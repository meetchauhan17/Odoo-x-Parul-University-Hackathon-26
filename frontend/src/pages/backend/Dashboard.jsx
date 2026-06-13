import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
    <div className={`text-3xl w-12 h-12 flex items-center justify-center rounded-lg ${color}`}>{icon}</div>
    <div>
      <div className="text-2xl font-bold text-white">{value ?? '—'}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const load = async () => {
      try {
        const [sessionRes, productsRes, catsRes, tablesRes, couponsRes, ordersRes] = await Promise.all([
          api.get('/session/current').catch(() => null),
          api.get('/products').catch(() => []),
          api.get('/categories').catch(() => []),
          api.get('/tables').catch(() => []),
          api.get('/coupons').catch(() => []),
          api.get('/orders').catch(() => []),
        ]);
        setSession(sessionRes);
        setStats({
          products: productsRes?.length ?? 0,
          categories: catsRes?.length ?? 0,
          tables: tablesRes?.length ?? 0,
          coupons: couponsRes?.filter(c => c.isActive)?.length ?? 0,
        });
        setRecentOrders((ordersRes || []).slice(0, 5));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const statusColor = {
    DRAFT: 'text-gray-400',
    SENT_TO_KITCHEN: 'text-yellow-400',
    PAID: 'text-green-400',
    CANCELLED: 'text-red-400',
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}, {user?.name}! 👋</h1>
          <p className="text-gray-300 mt-1">
            POS Session is{' '}
            <span className={session ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
              {session ? 'OPEN' : 'CLOSED'}
            </span>
          </p>
        </div>
        <button
          onClick={() => navigate('/pos')}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          Open POS Terminal →
        </button>
      </div>

      {/* Session Info */}
      {session && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Current Session</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500">Opened By</div>
              <div className="text-white font-medium mt-1">{session.openedBy?.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Last Sale</div>
              <div className="text-white font-medium mt-1">₹{parseFloat(session.lastSaleAmount || 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Total Orders</div>
              <div className="text-white font-medium mt-1">{session.totalOrders}</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Products" value={stats.products} icon="🍽️" color="bg-blue-500/20" />
        <StatCard label="Categories" value={stats.categories} icon="🏷️" color="bg-purple-500/20" />
        <StatCard label="Tables" value={stats.tables} icon="🪑" color="bg-green-500/20" />
        <StatCard label="Active Coupons" value={stats.coupons} icon="🎟️" color="bg-orange-500/20" />
      </div>

      {/* Recent Orders */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Recent Orders</h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
                <th className="px-6 py-3 text-left">Order #</th>
                <th className="px-6 py-3 text-left">Table</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recentOrders.map(o => (
                <tr key={o.id} className="hover:bg-gray-800/50 transition">
                  <td className="px-6 py-3 text-white font-mono text-sm">{o.orderNumber}</td>
                  <td className="px-6 py-3 text-gray-300 text-sm">{o.table?.tableNumber || 'Takeaway'}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`font-medium ${statusColor[o.status]}`}>{o.status.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-6 py-3 text-white font-medium">₹{parseFloat(o.total).toFixed(2)}</td>
                  <td className="px-6 py-3 text-gray-400 text-sm">{new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
