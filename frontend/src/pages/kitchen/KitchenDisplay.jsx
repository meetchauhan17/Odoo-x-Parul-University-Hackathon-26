import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../../api/client';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
const STAGES = ['TO_COOK', 'PREPARING', 'COMPLETED'];

const STAGE_META = {
  TO_COOK: {
    label: 'To Cook',
    color: '#EF4444',
    bg: 'bg-red-500',
    border: 'border-red-500/40',
    ring: 'ring-red-500',
    next: 'Preparing',
    icon: '🔥',
  },
  PREPARING: {
    label: 'Preparing',
    color: '#F59E0B',
    bg: 'bg-amber-500',
    border: 'border-amber-500/40',
    ring: 'ring-amber-500',
    next: 'Completed',
    icon: '⏳',
  },
  COMPLETED: {
    label: 'Completed',
    color: '#10B981',
    bg: 'bg-green-500',
    border: 'border-green-500/40',
    ring: 'ring-green-500',
    next: null,
    icon: '✅',
  },
};
const OrderTimer = ({ createdAt }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const created = new Date(createdAt).getTime();
    const update = () => {
      const diff = Math.floor((Date.now() - created) / 1000);
      setElapsed(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const color =
    minutes < 10 ? 'text-green-400' :
    minutes < 15 ? 'text-amber-400' :
    'text-red-400 animate-pulse';

  const urgentBorder =
    minutes >= 15 ? 'border-red-500 shadow-red-500/20 shadow-lg' :
    minutes >= 10 ? 'border-amber-500' : 'border-gray-700';

  return { display, color, urgentBorder, minutes };
};

function TicketCard({ ticket, onStageAdvance, onItemDone }) {
  const timer = OrderTimer({ createdAt: ticket.createdAt });
  const order = ticket.order || {};
  const lines = order.lines || [];

  return (
    <div
      className={`bg-gray-900 rounded-xl border-2 ${timer.urgentBorder}
                  overflow-hidden transition-all duration-300`}
    >
      {/* Ticket Header - click to advance stage */}
      <div
        onClick={() => onStageAdvance(ticket.id)}
        className="p-4 cursor-pointer hover:bg-gray-800 transition"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white font-bold text-lg">
              #{order.orderNumber || '—'}
            </span>
            {order.table && (
              <span className="ml-2 text-gray-400 text-sm">
                {order.table.tableNumber}
              </span>
            )}
          </div>
          <div className="text-right">
            <div className={`font-mono font-bold text-2xl ${timer.color}`}>
              {timer.display}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {timer.minutes < 10 ? '✓ On time' :
               timer.minutes < 15 ? '⚠ Getting late' : '🚨 Urgent!'}
            </div>
          </div>
        </div>

        {/* Stage advance button */}
        <div className="mt-3 flex justify-end">
          {ticket.stage !== 'COMPLETED' && (
            <span className="text-xs bg-gray-700 text-gray-300
                             px-3 py-1 rounded-full hover:bg-gray-600">
              {ticket.stage === 'TO_COOK'
                ? '→ Mark Preparing'
                : '→ Mark Completed'}
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="border-t border-gray-800">
        {lines
          .filter(l => !l.product || l.product.showOnKds)
          .map(line => (
            <div
              key={line.id}
              onClick={() => line.kdsStatus !== 'DONE' && onItemDone(ticket.id, line.id)}
              className={`flex items-center gap-3 px-4 py-3 transition border-b border-gray-800/50
                          ${line.kdsStatus === 'DONE' ? 'opacity-50 cursor-default' : 'hover:bg-gray-800 cursor-pointer'}`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0
                              flex items-center justify-center transition
                              ${line.kdsStatus === 'DONE'
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-600'}`}>
                {line.kdsStatus === 'DONE' && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className={`flex-1 text-sm font-medium transition
                               ${line.kdsStatus === 'DONE'
                                 ? 'line-through text-gray-500'
                                 : 'text-white'}`}>
                {line.product?.name || '—'}
              </span>
              <span className="text-orange-400 font-bold text-sm">
                ×{line.quantity}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   KITCHEN DISPLAY — MAIN
───────────────────────────────────────────────────────── */
export default function KitchenDisplay() {
  const [tickets, setTickets] = useState([]);
  const [clock, setClock] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const tickTimer = useRef(null);

  /* ── Clock ticker ── */
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    /* Re-render ageColor every minute */
    tickTimer.current = setInterval(() => setTickets(t => [...t]), 60000);
    return () => { clearInterval(id); clearInterval(tickTimer.current); };
  }, []);

  /* ── Notification sound ── */
  const playNotify = useCallback(() => {
    try {
      if (!audioRef.current) audioRef.current = new Audio('/notify.mp3');
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {}
  }, []);

  /* ── Fetch initial tickets ── */
  useEffect(() => {
    api.get('/kds/tickets')
      .then(data => setTickets(data || []))
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));
  }, []);

  /* ── Fetch categories on mount ── */
  useEffect(() => {
    api.get('/categories')
      .then(data => setCategories(data || []))
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  /* ── Socket.IO ── */
  useEffect(() => {
    const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
      .replace(/\/api$/, '');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.emit('join-kds');

    socket.on('new-order', (ticket) => {
      setTickets(prev => {
        if (prev.find(t => t.id === ticket.id || t.orderId === ticket.orderId)) return prev;
        return [ticket, ...prev];
      });
      playNotify();
      toast('New order received! 🔥', { icon: '🍽️', duration: 3000, style: { background: '#1F2937', color: '#fff', border: '1px solid #374151' } });
    });

    socket.on('ticket-updated', (updated) => {
      setTickets(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
    });

    socket.on('item-done', ({ ticketId, lineId }) => {
      setTickets(prev => prev.map(t => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          order: {
            ...t.order,
            lines: (t.order?.lines || []).map(l =>
              l.id === lineId ? { ...l, kdsStatus: 'DONE' } : l
            ),
          },
        };
      }));
    });

    socket.on('order-paid', ({ orderId }) => {
      setTickets(prev => prev.map(t =>
        t.orderId === orderId ? { ...t, _paid: true } : t
      ));
      setTimeout(() => {
        setTickets(prev => prev.filter(t => t.orderId !== orderId));
      }, 3000);
    });

    return () => { socket.disconnect(); };
  }, [playNotify]);

  /* ── Stage advance ── */
  const handleStageAdvance = async (ticketId) => {
    try {
      const updated = await api.put(`/kds/tickets/${ticketId}/stage`);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updated } : t));
    } catch { toast.error('Failed to update stage'); }
  };

  /* ── Item done ── */
  const handleItemDone = async (ticketId, lineId) => {
    try {
      await api.put(`/kds/tickets/${ticketId}/items/${lineId}/done`);
      setTickets(prev => prev.map(t => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          order: {
            ...t.order,
            lines: (t.order?.lines || []).map(l =>
              l.id === lineId ? { ...l, kdsStatus: 'DONE' } : l
            ),
          },
        };
      }));
    } catch { toast.error('Failed to mark item done'); }
  };

  const toCookTickets = tickets.filter(t => t.stage === 'TO_COOK' && !t._paid);
  const preparingTickets = tickets.filter(t => t.stage === 'PREPARING' && !t._paid);
  const completedTickets = tickets.filter(t => t.stage === 'COMPLETED' && !t._paid);

  /* ── Filtered tickets logic ── */
  const filteredTickets = (ticketsList) => {
    return ticketsList.filter(ticket => {
      const lines = ticket.order?.lines || [];
      
      const matchesSearch = searchTerm === '' ||
        lines.some(l =>
          l.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesCategory = filterCategory === '' ||
        lines.some(l =>
          l.product?.category?.name === filterCategory
        );
      
      return matchesSearch && matchesCategory;
    });
  };

  const totalActive = tickets.filter(t => t.stage !== 'COMPLETED' && !t._paid).length;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* ── Top Bar ──────────────────────────────────── */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white">☕ Kitchen Display</span>
          {totalActive > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
              {totalActive} active
            </span>
          )}
        </div>

        {/* Live ticket count badge */}
        <div className="flex items-center gap-4">
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {toCookTickets.length} to cook
          </span>
          <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {preparingTickets.length} preparing
          </span>
        </div>

        {/* Clock */}
        <div className="ml-auto text-right">
          <div className="text-white font-mono text-lg font-bold">
            {clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-gray-500 text-xs">
            {clock.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        </div>
      </header>

      {/* Filter Bar UI below the top nav bar */}
      <div className="flex gap-3 p-4 bg-gray-900 border-b border-gray-800">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by product name..."
          className="flex-1 bg-gray-800 border border-gray-700 text-white
                     rounded-lg px-4 py-2 text-sm focus:outline-none
                     focus:border-orange-500"
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white
                     rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
        {(searchTerm || filterCategory) && (
          <button
            onClick={() => { setSearchTerm(''); setFilterCategory(''); }}
            className="bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Stage Columns ─────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-3 animate-spin">⚙️</div>
            <div>Loading kitchen orders…</div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden p-4 grid grid-cols-3 gap-4">
          {STAGES.map(stage => {
            const meta = STAGE_META[stage];
            let stageTickets = [];
            if (stage === 'TO_COOK') stageTickets = filteredTickets(toCookTickets);
            if (stage === 'PREPARING') stageTickets = filteredTickets(preparingTickets);
            if (stage === 'COMPLETED') stageTickets = filteredTickets(completedTickets);
            return (
              <div key={stage} className="flex flex-col min-h-0">
                {/* Column header */}
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl mb-3 ${meta.bg}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <span className="text-white font-bold text-sm uppercase tracking-wide">{meta.label}</span>
                  </div>
                  <span className="bg-white/20 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center">
                    {stageTickets.length}
                  </span>
                </div>

                {/* Tickets list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                  {stageTickets.length === 0 && (
                    <div className={`border-2 border-dashed rounded-xl p-8 text-center ${meta.border}`}>
                      <div className="text-3xl mb-2 opacity-40">{meta.icon}</div>
                      <div className="text-gray-600 text-sm">No {meta.label.toLowerCase()} orders</div>
                    </div>
                  )}
                  {stageTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="transition-all duration-500 ease-in-out"
                      style={{ animation: 'slideIn 0.3s ease-out' }}
                    >
                      <TicketCard
                        ticket={ticket}
                        onStageAdvance={handleStageAdvance}
                        onItemDone={handleItemDone}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Empty state (all clear) ──────────────────── */}
      {!loading && totalActive === 0 && filteredTickets(completedTickets).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <div className="text-green-400 text-2xl font-bold">Kitchen is clear!</div>
            <div className="text-gray-500 mt-2">No active orders. Waiting for new orders…</div>
          </div>
        </div>
      )}

      {/* ── Keyframe styles ──────────────────────────── */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(239,68,68,0.7); box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
          50%       { border-color: rgba(239,68,68,1);   box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
        .animate-pulse-border {
          animation: pulse-border 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
