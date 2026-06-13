import { useEffect, useState } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function FloorPopup({ onSelect, onNoTable, onClose, session }) {
  const [floors, setFloors] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [floorsRes, draftOrders] = await Promise.all([
          api.get('/floors'),
          api.get('/orders').then(all => all.filter(o =>
            o.status === 'DRAFT' || o.status === 'SENT_TO_KITCHEN'
          )).catch(() => []),
        ]);
        setFloors(floorsRes);
        setActiveOrders(draftOrders);
      } catch (e) {
        toast.error('Failed to load floor data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTableOrder = (table) => {
    return activeOrders.find(o => o.tableId === table.id);
  };

  const getTableStatus = (table) => {
    if (!table.isActive) return 'inactive';
    const order = getTableOrder(table);
    return order ? 'occupied' : 'available';
  };

  /* Flat list metrics of all tables across floors */
  const totalTables = floors.reduce((n, f) => n + (f.tables?.filter(t => t.isActive).length || 0), 0);
  const occupied = floors.reduce((n, f) => n + (f.tables?.filter(t => t.isActive && getTableOrder(t))?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Select Table</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {occupied} occupied · {totalTables - occupied} available · {totalTables} total
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition text-xl leading-none">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {loading && (
            <div className="flex items-center justify-center h-40 text-gray-500">Loading tables…</div>
          )}

          {!loading && floors.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🪑</div>
              <p>No floors configured yet.</p>
              <p className="text-xs mt-1">Go to Backend → Floor & Tables to add them.</p>
            </div>
          )}

          {floors.map(floor => (
            <div key={floor.id} className="mb-6">
              {/* Floor header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-orange-400 font-semibold text-sm">{floor.name}</span>
                <span className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">{floor.tables?.filter(t => t.isActive).length} tables</span>
              </div>

              {/* Tables grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {floor.tables?.filter(t => t.isActive).map(table => {
                  const status = getTableStatus(table);
                  const order = getTableOrder(table);

                  return (
                    <button
                      key={table.id}
                      onClick={() => status !== 'inactive' && onSelect(table, order)}
                      disabled={status === 'inactive'}
                      className={`
                        relative p-4 rounded-xl border-2 transition text-left group
                        ${status === 'available'
                          ? 'bg-gray-800 border-gray-700 hover:border-green-500 hover:bg-gray-750'
                          : status === 'occupied'
                          ? 'bg-amber-900/40 border-amber-600 hover:border-amber-400 hover:bg-amber-900/60'
                          : 'bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed'}
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-lg">
                          {table.tableNumber}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          status === 'available' ? 'bg-green-400' :
                          status === 'occupied' ? 'bg-red-400 animate-pulse' : 'bg-gray-600'
                        }`} />
                      </div>
                      <div className="text-xs text-gray-400">{table.seats} seats</div>
                      {status === 'occupied' && order && (
                        <div className="mt-2 text-xs font-semibold text-amber-300">
                          ₹{parseFloat(order.total).toFixed(0)} •{' '}
                          {order.status === 'SENT_TO_KITCHEN' ? '🍳 Kitchen' : '📝 Draft'}
                        </div>
                      )}

                      {/* Hover overlay for occupied */}
                      {status === 'occupied' && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-orange-500/0 group-hover:bg-orange-500/10 transition">
                          <span className="text-xs text-orange-300 opacity-0 group-hover:opacity-100 font-medium transition">
                            Open Order →
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Empty state for floor */}
                {(!floor.tables || floor.tables.filter(t => t.isActive).length === 0) && (
                  <div className="col-span-4 py-4 text-center text-gray-600 text-sm border border-dashed border-gray-800 rounded-xl">
                    No tables on this floor
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer — No Table / Takeaway */}
        <div className="px-6 py-4 border-t border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500">For walk-in or takeaway orders without a table</p>
            </div>
            <button
              onClick={onNoTable}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-orange-500/50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
            >
              🥡 No Table (Takeaway)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
