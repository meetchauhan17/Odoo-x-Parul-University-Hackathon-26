import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import toast from 'react-hot-toast';

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function MetricCard({ label, value, sub, icon, iconBg }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function PaymentBar({ breakdown }) {
  const total = (breakdown?.CASH || 0) + (breakdown?.CARD || 0) + (breakdown?.UPI || 0);
  const pct = (v) => total > 0 ? (v / total) * 100 : 0;

  const segments = [
    { key: 'CASH', label: 'Cash',  color: 'bg-green-500', icon: '💵' },
    { key: 'CARD', label: 'Card',  color: 'bg-blue-500',  icon: '💳' },
    { key: 'UPI',  label: 'UPI',   color: 'bg-purple-500',icon: '📱' },
  ].filter(s => (breakdown?.[s.key] || 0) > 0);

  return (
    <div className="space-y-3">
      {/* Bar */}
      <div className="h-4 rounded-full overflow-hidden bg-gray-700 flex">
        {segments.map(s => (
          <div
            key={s.key}
            className={`${s.color} transition-all duration-700`}
            style={{ width: `${pct(breakdown?.[s.key] || 0)}%` }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { key: 'CASH', label: 'Cash',  color: 'bg-green-500', icon: '💵' },
          { key: 'CARD', label: 'Card',  color: 'bg-blue-500',  icon: '💳' },
          { key: 'UPI',  label: 'UPI',   color: 'bg-purple-500',icon: '📱' },
        ].map(s => (
          <div key={s.key} className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-lg mb-0.5">{s.icon}</div>
            <div className="text-white font-semibold text-sm">{fmt(breakdown?.[s.key] || 0)}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className="flex items-center justify-center gap-1 mt-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
              <span className="text-xs text-gray-600">{pct(breakdown?.[s.key] || 0).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClosingSummaryModal({ summary, onClose }) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  if (!summary) return null;

  const handleReturnToLogin = () => {
    logout();
    navigate('/login');
  };

  const handleStartNew = async () => {
    try {
      await api.post('/session/open');
      toast.success('New session started!');
      onClose();
    } catch { toast.error('Failed to start new session'); }
  };

  const handleDownloadPDF = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl my-4"
        style={{ animation: 'modalIn 0.25s ease-out' }}
      >
        {/* Print styles */}
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.94) translateY(10px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @media print {
            body > *:not(.print-target) { display: none !important; }
            .no-print { display: none !important; }
          }
        `}</style>

        {/* Header */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/10 border-b border-green-500/20 rounded-t-2xl px-8 py-6 text-center">
          <div className="w-16 h-16 bg-green-500/20 border-2 border-green-500/40 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
            ✅
          </div>
          <h1 className="text-2xl font-bold text-white">Session Closed</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Session ran for <span className="text-white font-semibold">{summary.duration}</span>
            <span className="mx-2 text-gray-600">·</span>
            {new Date(summary.openedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            {' → '}
            {new Date(summary.closedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Draft warning */}
          {summary.draftOrdersWarning > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="text-yellow-400 font-semibold text-sm">Draft Orders Abandoned</div>
                <div className="text-yellow-400/70 text-xs mt-0.5">
                  {summary.draftOrdersWarning} draft order{summary.draftOrdersWarning !== 1 ? 's were' : ' was'} not completed when the session closed.
                </div>
              </div>
            </div>
          )}

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Total Orders (Paid)" value={summary.totalOrders} icon="📋" iconBg="bg-blue-500/20" />
            <MetricCard label="Total Revenue" value={fmt(summary.totalRevenue)} icon="💰" iconBg="bg-green-500/20" />
            <MetricCard label="Avg Order Value" value={fmt(summary.avgOrderValue)} icon="📊" iconBg="bg-orange-500/20" />
            <MetricCard
              label="Cancelled Orders"
              value={summary.orderStatusBreakdown?.cancelled || 0}
              icon="❌"
              iconBg="bg-red-500/20"
              sub={`${summary.orderStatusBreakdown?.paid || 0} paid · ${summary.orderStatusBreakdown?.draft || 0} draft`}
            />
          </div>

          {/* Payment breakdown */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">💳 Payment Breakdown</h3>
            <PaymentBar breakdown={summary.paymentBreakdown} />
          </div>

          {/* Top product */}
          {summary.topProduct && (
            <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-500/20 rounded-xl px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🏆</div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Top Selling Product</div>
                  <div className="text-white font-bold text-lg mt-0.5">{summary.topProduct.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-orange-400 font-bold text-xl">{summary.topProduct.quantity}×</div>
                <div className="text-gray-500 text-xs">{fmt(summary.topProduct.revenue)}</div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-3 pt-2 no-print">
            <button
              onClick={handleDownloadPDF}
              className="flex flex-col items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white py-3 px-4 rounded-xl text-sm font-medium transition"
            >
              <span className="text-lg">🖨️</span>
              Download PDF
            </button>
            <button
              onClick={handleReturnToLogin}
              className="flex flex-col items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-3 px-4 rounded-xl text-sm font-medium transition"
            >
              <span className="text-lg">🚪</span>
              Return to Login
            </button>
            <button
              onClick={handleStartNew}
              className="flex flex-col items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-xl text-sm font-bold transition"
            >
              <span className="text-lg">▶️</span>
              New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
