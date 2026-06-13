import Modal from './Modal';

export default function SessionSummaryModal({ isOpen, onClose, summary, session }) {
  if (!summary) return null;

  const paymentBreakdown = [
    { method: 'Cash', icon: '💵', color: '#10b981' },
    { method: 'Card', icon: '💳', color: '#3b82f6' },
    { method: 'UPI', icon: '📱', color: '#8b5cf6' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Session Closed — Shift Summary" size="lg">
      <div className="space-y-6">

        {/* Header */}
        <div className="text-center p-6 bg-gray-800 rounded-xl">
          <div className="text-5xl mb-3">🏁</div>
          <h2 className="text-xl font-bold text-white">Great work today!</h2>
          <p className="text-gray-400 text-sm mt-1">
            Session opened: {session?.openedAt
              ? new Date(session.openedAt).toLocaleString('en-IN')
              : 'N/A'}
          </p>
          <p className="text-gray-400 text-sm">
            Session closed: {new Date().toLocaleString('en-IN')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-400">
              {summary.totalOrders}
            </div>
            <div className="text-gray-400 text-sm mt-1">Total Orders</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">
              ₹{summary.revenue?.toFixed(0) || 0}
            </div>
            <div className="text-gray-400 text-sm mt-1">Total Revenue</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">
              ₹{summary.avgOrderValue?.toFixed(0) || 0}
            </div>
            <div className="text-gray-400 text-sm mt-1">Avg Order Value</div>
          </div>
        </div>

        {/* Top Product */}
        {summary.topProducts?.[0] && (
          <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
            <div className="text-3xl">🏆</div>
            <div>
              <div className="text-white font-semibold">
                Best Seller: {summary.topProducts[0].name}
              </div>
              <div className="text-gray-400 text-sm">
                {summary.topProducts[0].qty} units sold —
                ₹{summary.topProducts[0].revenue?.toFixed(0)}
              </div>
            </div>
          </div>
        )}

        {/* Top Categories */}
        {summary.topCategories?.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">Sales by Category</h3>
            <div className="space-y-2">
              {summary.topCategories.slice(0, 4).map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: cat.color || '#6b7280' }}
                  />
                  <div className="flex-1 text-sm text-gray-300">{cat.name}</div>
                  <div className="text-sm font-medium text-white">
                    ₹{cat.revenue?.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition"
          >
            🖨️ Print Summary
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition"
          >
            Done — Logout
          </button>
        </div>
      </div>
    </Modal>
  );
}
