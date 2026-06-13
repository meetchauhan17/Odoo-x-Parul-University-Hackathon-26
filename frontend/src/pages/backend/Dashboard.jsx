import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import {
  UtensilsCrossed, Tag, LayoutGrid, Ticket,
  Monitor, TrendingUp, Clock, CheckCircle2, XCircle, ChefHat,
} from 'lucide-react';

/* ── Metric card with hard pop shadow ── */
function StatCard({ label, value, icon: Icon, accent, shadow }) {
  return (
    <div
      className="bg-white border-2 border-[#1E293B] rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1"
      style={{ boxShadow: shadow || '4px 4px 0px 0px #1E293B' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-[#1E293B] shrink-0"
        style={{ background: accent }}
      >
        <Icon size={22} strokeWidth={2.5} color="#fff" />
      </div>
      <div>
        <div
          className="text-2xl font-bold"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: 'var(--brand-fg)' }}
        >
          {value ?? '—'}
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--brand-muted-fg)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

const STATUS_MAP = {
  DRAFT:            { label: 'Draft',       color: '#94A3B8', icon: Clock },
  SENT_TO_KITCHEN:  { label: 'In Kitchen',  color: '#FBBF24', icon: ChefHat },
  PAID:             { label: 'Paid',        color: '#34D399', icon: CheckCircle2 },
  CANCELLED:        { label: 'Cancelled',   color: '#F87171', icon: XCircle },
};

export default function Dashboard() {
  const { user }    = useAuthStore();
  const navigate    = useNavigate();
  const [session, setSession]           = useState(null);
  const [stats, setStats]               = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading]           = useState(true);

  const hour     = new Date().getHours();
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
          products:   productsRes?.length ?? 0,
          categories: catsRes?.length ?? 0,
          tables:     tablesRes?.length ?? 0,
          coupons:    couponsRes?.filter(c => c.isActive)?.length ?? 0,
        });
        setRecentOrders((ordersRes || []).slice(0, 5));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ color: 'var(--brand-muted-fg)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 rounded-full mx-auto mb-3 animate-spin"
             style={{ borderColor: 'var(--brand-accent)', borderTopColor: 'transparent' }} />
        <p className="text-sm font-medium">Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 font-jakarta">

      {/* ── Welcome Banner ── */}
      <div
        className="relative overflow-hidden border-2 border-[#1E293B] rounded-2xl p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', boxShadow: '6px 6px 0px 0px #1E293B' }}
      >
        {/* Confetti shapes */}
        <div className="absolute top-3 right-36 w-8 h-8 rounded-full opacity-30" style={{ background: '#FBBF24' }} />
        <div className="absolute bottom-2 right-48 w-6 h-6 rounded opacity-25" style={{ background: '#F472B6' }} />
        <div className="absolute top-4 right-56 w-4 h-4 rotate-45 opacity-20" style={{ background: '#34D399' }} />

        <div>
          <h1
            className="text-2xl font-extrabold text-white"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {greeting}, {user?.name}!
          </h1>
          <p className="text-violet-200 mt-1 text-sm font-medium">
            POS Session is{' '}
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border-2"
              style={session
                ? { background: '#34D399', borderColor: '#1E293B', color: '#1E293B' }
                : { background: '#F87171', borderColor: '#1E293B', color: '#1E293B' }}
            >
              {session ? 'OPEN' : 'CLOSED'}
            </span>
          </p>
        </div>

        <button
          onClick={() => navigate('/pos')}
          className="flex items-center gap-2 border-2 border-white rounded-full px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-white hover:text-violet-700 shrink-0"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          <Monitor size={16} strokeWidth={2.5} />
          Open POS
        </button>
      </div>

      {/* ── Session Info ── */}
      {session && (
        <div
          className="bg-white border-2 border-[#1E293B] rounded-2xl p-5"
          style={{ boxShadow: '4px 4px 0px 0px #FBBF24' }}
        >
          <h2
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: 'var(--brand-muted-fg)' }}
          >
            Current Session
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Opened By',    value: session.openedBy?.name },
              { label: 'Last Sale',    value: `₹${parseFloat(session.lastSaleAmount || 0).toFixed(2)}` },
              { label: 'Total Orders', value: session.totalOrders },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--brand-muted-fg)' }}>{label}</div>
                <div className="text-lg font-bold" style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: 'var(--brand-fg)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Products"      value={stats.products}   icon={UtensilsCrossed} accent="#8B5CF6" shadow="4px 4px 0px 0px #8B5CF6" />
        <StatCard label="Categories"    value={stats.categories} icon={Tag}             accent="#F472B6" shadow="4px 4px 0px 0px #F472B6" />
        <StatCard label="Tables"        value={stats.tables}     icon={LayoutGrid}      accent="#34D399" shadow="4px 4px 0px 0px #34D399" />
        <StatCard label="Active Coupons"value={stats.coupons}    icon={Ticket}          accent="#FBBF24" shadow="4px 4px 0px 0px #FBBF24" />
      </div>

      {/* ── Recent Orders ── */}
      <div
        className="bg-white border-2 border-[#1E293B] rounded-2xl overflow-hidden"
        style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}
      >
        <div className="px-6 py-4 border-b-2 border-[#E2E8F0] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center border-2 border-[#1E293B]"
               style={{ background: 'var(--brand-accent)' }}>
            <TrendingUp size={14} strokeWidth={2.5} color="#fff" />
          </div>
          <h2
            className="font-bold text-base"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: 'var(--brand-fg)' }}
          >
            Recent Orders
          </h2>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--brand-muted-fg)' }}>
            <div className="w-14 h-14 rounded-2xl border-2 border-[#E2E8F0] flex items-center justify-center mx-auto mb-3">
              <UtensilsCrossed size={24} strokeWidth={2} color="#CBD5E1" />
            </div>
            <p className="text-sm font-medium">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-[#E2E8F0]" style={{ background: 'var(--brand-muted)' }}>
                  {['Order #', 'Table', 'Status', 'Total', 'Time'].map(h => (
                    <th key={h}
                      className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: 'var(--brand-muted-fg)', fontFamily: "'Outfit', system-ui, sans-serif" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, i) => {
                  const st = STATUS_MAP[o.status] || { label: o.status, color: '#94A3B8', icon: Clock };
                  const StatusIcon = st.icon;
                  return (
                    <tr key={o.id}
                      className="border-b border-[#F1F5F9] transition-colors hover:bg-[#FFFDF5]">
                      <td className="px-6 py-3 text-sm font-bold font-mono" style={{ color: 'var(--brand-fg)' }}>{o.orderNumber}</td>
                      <td className="px-6 py-3 text-sm" style={{ color: 'var(--brand-muted-fg)' }}>{o.table?.tableNumber || 'Takeaway'}</td>
                      <td className="px-6 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border-2 border-[#1E293B]"
                          style={{ background: st.color + '30', color: st.color }}
                        >
                          <StatusIcon size={10} strokeWidth={2.5} color={st.color} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-bold" style={{ color: 'var(--brand-fg)' }}>₹{parseFloat(o.total).toFixed(2)}</td>
                      <td className="px-6 py-3 text-xs" style={{ color: 'var(--brand-muted-fg)' }}>
                        {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
