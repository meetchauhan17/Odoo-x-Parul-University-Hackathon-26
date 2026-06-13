import { useEffect, useState } from 'react';
import { Armchair, ShoppingBag, X } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

function getTableDimensions(shape) {
  switch (shape) {
    case 'circle': return { w: 2, h: 2 };
    case 'rectangle_h': return { w: 3, h: 2 };
    case 'rectangle_v': return { w: 2, h: 3 };
    case 'square':
    default: return { w: 2, h: 2 };
  }
}

export default function FloorPopup({ onSelect, onNoTable, onClose, session, isInline = false }) {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloorId, setSelectedFloorId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const floorsRes = await api.get('/floors');
        setFloors(floorsRes);
        if (floorsRes.length > 0) {
          setSelectedFloorId(floorsRes[0].id);
        }
      } catch (e) {
        toast.error('Failed to load floor data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTableOrder = (table) => {
    return table.orders?.[0] || null;
  };

  const getTableStatus = (table) => {
    if (!table.isActive) return 'inactive';
    const order = getTableOrder(table);
    return order ? 'occupied' : 'available';
  };

  /* Metrics across all floors */
  const totalTables = floors.reduce((n, f) => n + (f.tables?.filter(t => t.isActive).length || 0), 0);
  const occupied = floors.reduce((n, f) => n + (f.tables?.filter(t => t.isActive && getTableOrder(t))?.length || 0), 0);

  const activeFloor = floors.find(f => f.id === selectedFloorId);
  const activeFloorTables = activeFloor?.tables?.filter(t => t.isActive) || [];

  const renderVisualFloorPlan = () => {
    if (loading) {
      return <div className="flex items-center justify-center h-64 text-slate-500 font-jakarta">Loading table layout…</div>;
    }

    if (floors.length === 0) {
      return (
        <div className="text-center py-12 text-slate-500 font-jakarta bg-white border-2 border-slate-200 rounded-2xl">
          <div className="flex justify-center mb-3">
            <Armchair size={48} className="text-slate-300" />
          </div>
          <p className="font-bold text-slate-700">No floors configured yet.</p>
          <p className="text-xs mt-1">Go to Backend → Floor & Tables to design layouts.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Floor Tab Selector */}
        <div className="flex gap-2 border-b-2 border-slate-100 pb-2 overflow-x-auto">
          {floors.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFloorId(f.id)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold border-2 transition shrink-0 font-outfit ${
                selectedFloorId === f.id
                  ? 'bg-[#8B5CF6] text-white border-slate-800 shadow-pop-xs hover:translate-y-[-1px]'
                  : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200'
              }`}
            >
              {f.name} ({f.tables?.filter(t => t.isActive).length})
            </button>
          ))}
        </div>

        {/* Visual Map Grid (24x16 ratio container) */}
        <div className="relative w-full border-2 border-slate-800 rounded-2xl bg-[#FFFDF5] bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:16px_16px] shadow-pop-xs overflow-hidden select-none"
             style={{ aspectRatio: '24 / 16' }}>
          {activeFloorTables.map(table => {
            const status = getTableStatus(table);
            const order = getTableOrder(table);
            const { w, h } = getTableDimensions(table.shape);

            let bgClass = 'bg-white border-slate-200 hover:border-slate-800';
            if (status === 'available') {
              bgClass = 'bg-[#E6FDF4] border-slate-800 hover:bg-[#D1FAE5] hover:shadow-pop';
            } else if (status === 'occupied') {
              bgClass = 'bg-[#FDF4FF] border-violet-600 hover:bg-[#F3E8FF] hover:border-violet-800 hover:shadow-pop';
            }

            const shapeClass = table.shape === 'circle' ? 'rounded-full' : 'rounded-xl';

            return (
              <button
                key={table.id}
                onClick={() => status !== 'inactive' && onSelect(table, order)}
                disabled={status === 'inactive'}
                style={{
                  left: `${(table.x / 24) * 100}%`,
                  top: `${(table.y / 16) * 100}%`,
                  width: `${(w / 24) * 100}%`,
                  height: `${(h / 16) * 100}%`,
                  position: 'absolute',
                }}
                className={`
                  flex flex-col items-center justify-center border-2 transition select-none group font-jakarta p-1 shadow-pop-xs
                  ${bgClass} ${shapeClass}
                `}
              >
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-800 text-[9px] sm:text-xs md:text-sm lg:text-base font-outfit uppercase">
                    {table.tableNumber}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    status === 'available' ? 'bg-emerald-500' :
                    status === 'occupied' ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'
                  }`} />
                </div>
                <div className="text-[7px] sm:text-[9px] md:text-[10px] text-slate-500 font-semibold leading-none mt-0.5">
                  {table.seats} seats
                </div>
                
                {status === 'occupied' && order && (
                  <div className={`mt-1 text-[7px] sm:text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none scale-90 sm:scale-100 ${
                    order.status === 'READY'
                      ? 'text-violet-800 bg-violet-200/80 border-violet-400'
                      : order.status === 'SENT_TO_KITCHEN'
                      ? 'text-blue-700 bg-blue-100/60 border-blue-200'
                      : 'text-violet-750 bg-violet-100/60 border-violet-200'
                  }`}>
                    ₹{parseFloat(order.total).toFixed(0)} •{' '}
                    {order.status === 'READY' ? 'Ready' : order.status === 'SENT_TO_KITCHEN' ? 'Kitchen' : 'Draft'}
                  </div>
                )}
              </button>
            );
          })}

          {activeFloorTables.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-white/40 pointer-events-none">
              <span className="font-bold text-slate-400 text-xs md:text-sm font-jakarta">No tables on this floor plan</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isInline) {
    return (
      <div className="h-full flex flex-col bg-white border-2 border-slate-800 rounded-2xl overflow-hidden animate-fadeIn" style={{ boxShadow: 'var(--pop-shadow-sm)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-100 shrink-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-outfit">Select Table / Floor View</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-jakarta">
              {occupied} occupied · {totalTables - occupied} available · {totalTables} total
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-[#FFFDF5]">
          {renderVisualFloorPlan()}
        </div>

        {/* Footer — No Table / Takeaway */}
        <div className="px-6 py-4 border-t-2 border-slate-100 shrink-0 bg-white rounded-b-2xl">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-jakarta">For walk-in or takeaway orders without a table</p>
            </div>
            <button
              onClick={onNoTable}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 border-2 border-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-pop-sm"
            >
              <ShoppingBag size={14} className="text-white" />
              <span className="font-outfit">No Table (Takeaway)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div 
        className="bg-white border-2 border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        style={{ boxShadow: 'var(--pop-shadow-lg)', animation: 'modalIn 0.18s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-outfit">Select Table</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-jakarta">
              {occupied} occupied · {totalTables - occupied} available · {totalTables} total
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-[#FFFDF5]">
          {renderVisualFloorPlan()}
        </div>

        {/* Footer — No Table / Takeaway */}
        <div className="px-6 py-4 border-t-2 border-slate-100 shrink-0 bg-white rounded-b-2xl">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-jakarta">For walk-in or takeaway orders without a table</p>
            </div>
            <button
              onClick={onNoTable}
              className="flex items-center gap-2 bg-[#8B5CF6] hover:bg-[#7c4ee4] border-2 border-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition"
              style={{ boxShadow: 'var(--pop-shadow-sm)' }}
            >
              <ShoppingBag size={14} className="text-white" />
              <span className="font-outfit">No Table (Takeaway)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
