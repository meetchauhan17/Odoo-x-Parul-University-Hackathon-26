import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/SkeletonLoader';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrdersList({ session }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = async () => {
    if (!session?.id) return;
    try {
      setLoading(true);
      const data = await api.get(`/orders?sessionId=${session.id}`);
      setOrders(data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [session?.id]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await api.put(`/orders/${cancelTarget}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
    } catch {
      toast.error('Failed to cancel order');
    } finally {
      setCancelLoading(false);
      setCancelTarget(null);
    }
  };

  const handleEditOrder = (order) => {
    // Build cart items from order lines
    const cartItems = order.lines.map(line => ({
      productId: line.productId,
      name: line.product.name,
      unitPrice: parseFloat(line.unitPrice),
      price: parseFloat(line.unitPrice),
      quantity: line.quantity,
      lineTotal: parseFloat(line.lineTotal),
      categoryColor: line.product.category?.color || '#6b7280',
      color: line.product.category?.color || '#6b7280',
    }));

    // Navigate to POS order view with this order loaded
    // Pass order data via location state
    navigate('/pos', {
      state: {
        loadOrder: {
          id: order.id,
          orderNumber: order.orderNumber,
          tableId: order.tableId,
          table: order.table,
          customerId: order.customerId,
          customer: order.customer,
          couponCode: order.couponCode,
          cartItems,
        }
      }
    });
  };

  const statusOrder = { SENT_TO_KITCHEN: 0, DRAFT: 1, PAID: 2, CANCELLED: 3 };
  const sorted = [...orders].sort((a, b) =>
    (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) ||
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="h-full flex flex-col bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-bold text-lg">Orders</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {session ? `Session started ${new Date(session.openedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'No active session'}
          </p>
        </div>
        <button onClick={fetchOrders} className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-lg transition">
          🔄 Refresh
        </button>
      </div>

      {/* Summary pills */}
      {!loading && orders.length > 0 && (
        <div className="px-6 py-3 flex gap-2 shrink-0 overflow-x-auto scrollbar-none">
          {[
            { label: 'Paid',    status: 'PAID',            color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            { label: 'Kitchen', status: 'SENT_TO_KITCHEN', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            { label: 'Draft',   status: 'DRAFT',           color: 'bg-gray-700 text-gray-300 border-gray-600' },
            { label: 'Cancelled', status: 'CANCELLED',     color: 'bg-red-500/20 text-red-400 border-red-500/30' },
          ].map(({ label, status, color }) => {
            const count = orders.filter(o => o.status === status).length;
            if (!count) return null;
            return (
              <span key={status} className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
                {label}: {count}
              </span>
            );
          })}
          <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border border-orange-500/30 bg-orange-500/10 text-orange-400 ml-auto">
            Revenue: {fmt(orders.filter(o => o.status === 'PAID').reduce((s, o) => s + parseFloat(o.total || 0), 0))}
          </span>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <div className="text-5xl opacity-20">📋</div>
            <div className="text-gray-500 font-medium">No orders this session yet.</div>
            <div className="text-gray-600 text-sm">Go to POS Order tab and start taking orders!</div>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {sorted.map(order => (
              <div key={order.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition">
                {/* Row */}
                <div
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  {/* Order number */}
                  <div className="text-white font-mono font-bold text-sm w-24 shrink-0">{order.orderNumber}</div>

                  {/* Table / Takeaway */}
                  <div className="text-gray-400 text-sm w-24 shrink-0">
                    {order.table ? `🪑 ${order.table.tableNumber}` : '🥡 Takeaway'}
                  </div>

                  {/* Items count */}
                  <div className="text-gray-500 text-xs flex-1">
                    {order.lines?.length || 0} item{order.lines?.length !== 1 ? 's' : ''}
                    {order.customer && <span className="ml-2 text-blue-400">· {order.customer.name}</span>}
                  </div>

                  {/* Total */}
                  <div className="text-orange-400 font-bold text-sm w-24 text-right shrink-0">
                    {fmt(order.total)}
                  </div>

                  {/* Status */}
                  <div className="w-32 text-right shrink-0">
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Time */}
                  <div className="text-gray-600 text-xs w-16 text-right shrink-0">
                    {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {/* Expand arrow */}
                  <div className={`text-gray-600 text-xs transition-transform ${expanded === order.id ? 'rotate-180' : ''}`}>▾</div>
                </div>

                {/* Expanded detail */}
                {expanded === order.id && (
                  <div className="border-t border-gray-800 px-4 py-3 bg-gray-950/50">
                    {/* Line items */}
                    <div className="space-y-1 mb-3">
                      {order.lines?.map(l => (
                        <div key={l.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{l.product?.name} × {l.quantity}</span>
                          <span className="text-gray-400">{fmt(l.lineTotal)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t border-gray-800 pt-2 space-y-1 text-xs">
                      <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                      {parseFloat(order.discountAmount) > 0 && (
                        <div className="flex justify-between text-green-400"><span>Discount</span><span>−{fmt(order.discountAmount)}</span></div>
                      )}
                      <div className="flex justify-between text-gray-500"><span>Tax (5%)</span><span>{fmt(order.taxAmount)}</span></div>
                      <div className="flex justify-between text-orange-400 font-bold text-sm pt-1"><span>Total</span><span>{fmt(order.total)}</span></div>
                    </div>

                    {/* Payment info for PAID */}
                    {order.status === 'PAID' && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                        <span>✅ Paid via {order.paymentMethod}</span>
                        {order.couponCode && <span className="ml-2 text-blue-400">🎫 {order.couponCode}</span>}
                      </div>
                    )}

                    {/* Action buttons for DRAFT */}
                    {order.status === 'DRAFT' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium transition"
                        >
                          ✏️ Edit Order
                        </button>
                        <button
                          onClick={() => setCancelTarget(order.id)}
                          className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 py-2 rounded-lg text-sm transition"
                        >
                          🗑 Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel confirm */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        loading={cancelLoading}
        title="Cancel Order?"
        message="This order will be marked as cancelled and cannot be undone."
        confirmLabel="Cancel Order"
        confirmClass="bg-red-500 hover:bg-red-600"
      />
    </div>
  );
}
