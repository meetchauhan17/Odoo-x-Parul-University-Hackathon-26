import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import toast from 'react-hot-toast';
import OrderView from './OrderView';
import OrdersList from './OrdersList';
import CustomerManagement from './CustomerManagement';
import FloorPopup from './FloorPopup';
import SessionSummaryModal from '../../components/ui/SessionSummaryModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

/* ── Session timer helper ──────────────────────────────── */
function useSessionTimer(openedAt) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!openedAt) { setElapsed(''); return; }
    const tick = () => {
      const ms = Date.now() - new Date(openedAt);
      const totalMins = Math.floor(ms / 60000);
      const hrs  = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      setElapsed(hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [openedAt]);
  return elapsed;
}

export default function PosTerminal() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  /* ── State ───────────────────────────────────────────── */
  const [currentView, setCurrentView] = useState('order');
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showFloorPopup, setShowFloorPopup] = useState(true);
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [closeLoading, setCloseLoading] = useState(false);
  const [closingSummary, setClosingSummary] = useState(null);
  const [closedSession, setClosedSession] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showHamburger, setShowHamburger] = useState(false);

  const sessionTimer = useSessionTimer(session?.openedAt);

  /* ── Session bootstrap ───────────────────────────────── */
  useEffect(() => {
    const init = async () => {
      setSessionLoading(true);
      try {
        let s = await api.get('/session/current');
        if (!s) s = await api.post('/session/open');
        setSession(s);
      } catch (err) {
        toast.error('Could not open session');
      } finally {
        setSessionLoading(false);
      }
    };
    init();
  }, []);

  /* ── Load draft order if passed ──────────────────────── */
  useEffect(() => {
    if (location.state?.loadOrder) {
      const { loadOrder } = location.state;
      setCurrentOrder(loadOrder);
      setSelectedTable(loadOrder.table);
      setCurrentView('order');
      // Clear state so refresh does not reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  /* ── Guard: no session → redirect ────────────────────── */
  useEffect(() => {
    if (!sessionLoading && !session && !showSummaryModal) {
      toast('Please open a session first', { icon: '🔒' });
      navigate('/backend');
    }
  }, [sessionLoading, session, navigate, showSummaryModal]);

  /* ── Handlers ────────────────────────────────────────── */
  const handleTableSelect = (table, existingOrder = null) => {
    setSelectedTable(table);
    setCurrentOrder(existingOrder);
    setShowFloorPopup(false);
    setCurrentView('order');
  };

  const handleNoTable = () => {
    setSelectedTable(null);
    setCurrentOrder(null);
    setShowFloorPopup(false);
    setCurrentView('order');
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  /* ── Close session ───────────────────────────────────── */
  const openCloseConfirm = async () => {
    try {
      const { count } = await api.get('/session/draft-count');
      setDraftCount(count);
    } catch { setDraftCount(0); }
    setShowCloseConfirm(true);
    setMenuOpen(false);
  };

  const handleCloseSession = async () => {
    setCloseLoading(true);
    try {
      await api.post('/session/close');
      const summary = await api.get('/reports/dashboard?period=today');
      setClosedSession(session);
      setClosingSummary(summary);
      setSession(null);
      setShowCloseConfirm(false);
      setShowSummaryModal(true);
      toast.success('Session closed');
    } catch (err) {
      toast.error(err.error || 'Failed to close session');
    } finally {
      setCloseLoading(false);
    }
  };

  const handleNewSession = async () => {
    try {
      const s = await api.post('/session/open');
      setSession(s);
      setClosingSummary(null);
      setShowFloorPopup(true);
      toast.success('New session started!');
    } catch { toast.error('Failed to start new session'); }
  };

  /* ── Tab helpers ─────────────────────────────────────── */
  const tabs = [
    { id: 'order',       label: 'POS Order',  icon: '🧾' },
    { id: 'orders-list', label: 'Orders',     icon: '📋' },
    { id: 'customers',   label: 'Customers',  icon: '👤' },
    { id: 'table-view',  label: 'Table View', icon: '🪑' },
  ];

  const handleTabChange = (tabId) => {
    if (tabId === 'table-view') { setShowFloorPopup(true); return; }
    setCurrentView(tabId);
    setMenuOpen(false);
  };

  /* ── Loading screen ──────────────────────────────────── */
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-400 text-sm">Opening POS session…</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      {/* ── Top Navigation Bar ─────────────────────────── */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-2.5 flex items-center gap-3 shrink-0 z-30">
        {/* Logo */}
        <div className="text-xl font-bold text-white shrink-0 mr-1">☕ Cafe POS</div>

        {/* Tabs */}
        <nav className="flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentView === tab.id && tab.id !== 'table-view'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-sm mx-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search products…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Table chip */}
          <button
            onClick={() => setShowFloorPopup(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              selectedTable
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-orange-500/50 hover:text-orange-400'
            }`}
          >
            🪑 {selectedTable ? `Table ${selectedTable.tableNumber}` : 'No Table'}
          </button>

          {/* Session timer */}
          {session && sessionTimer && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0" />
              <span className="text-xs text-green-400 font-mono">Session: {sessionTimer}</span>
            </div>
          )}

          {/* Hamburger Menu */}
          <div className="relative">
            <button
              onClick={() => setShowHamburger(!showHamburger)}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-300
                         hover:text-white transition"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <rect x="2" y="4" width="16" height="2" rx="1"/>
                <rect x="2" y="9" width="16" height="2" rx="1"/>
                <rect x="2" y="14" width="16" height="2" rx="1"/>
              </svg>
            </button>

            {showHamburger && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowHamburger(false)}
                />
                <div className="absolute right-0 top-12 z-50 bg-gray-800
                                border border-gray-700 rounded-xl shadow-2xl
                                w-56 py-2 overflow-hidden">

                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Navigation
                    </p>
                  </div>

                  {user?.role === 'ADMIN' && (
                    <>
                      <button
                        onClick={() => { navigate('/backend'); setShowHamburger(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300
                                   hover:bg-gray-700 hover:text-white flex items-center gap-3"
                      >
                        <span>📊</span> Dashboard
                      </button>
                      <button
                        onClick={() => { navigate('/backend/products'); setShowHamburger(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300
                                   hover:bg-gray-700 hover:text-white flex items-center gap-3"
                      >
                        <span>🍽️</span> Products
                      </button>
                      <button
                        onClick={() => { navigate('/backend/categories'); setShowHamburger(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300
                                   hover:bg-gray-700 hover:text-white flex items-center gap-3"
                      >
                        <span>🏷️</span> Categories
                      </button>
                      <button
                        onClick={() => { navigate('/backend/tables'); setShowHamburger(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300
                                   hover:bg-gray-700 hover:text-white flex items-center gap-3"
                      >
                        <span>🪑</span> Floor & Tables
                      </button>
                      <button
                        onClick={() => { navigate('/backend/coupons'); setShowHamburger(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300
                                   hover:bg-gray-700 hover:text-white flex items-center gap-3"
                      >
                        <span>🎟️</span> Coupons & Promos
                      </button>
                      <button
                        onClick={() => { navigate('/backend/reports'); setShowHamburger(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300
                                   hover:bg-gray-700 hover:text-white flex items-center gap-3"
                      >
                        <span>📈</span> Reports
                      </button>
                    </>
                  )}

                  <div className="border-t border-gray-700 mt-1">
                    <button
                      onClick={() => { navigate('/kitchen'); setShowHamburger(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300
                                 hover:bg-gray-700 hover:text-white flex items-center gap-3"
                    >
                      <span>👨🍳</span> Kitchen Display
                    </button>
                  </div>

                  <div className="border-t border-gray-700 mt-1">
                    <button
                      onClick={handleCloseSession}
                      className="w-full text-left px-4 py-3 text-sm text-amber-400
                                 hover:bg-gray-700 flex items-center gap-3"
                    >
                      <span>🔒</span> Close Session
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-400
                                 hover:bg-gray-700 flex items-center gap-3"
                    >
                      <span>🚪</span> Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Avatar + Dropdown menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-9 h-9 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center hover:bg-orange-600 transition"
            >
              {user?.name?.[0]?.toUpperCase()}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-11 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-700">
                    <div className="text-white text-sm font-semibold">{user?.name}</div>
                    <div className="text-gray-400 text-xs">{user?.role}</div>
                    {session && (
                      <div className="text-green-400 text-xs mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        Session open · {sessionTimer}
                      </div>
                    )}
                  </div>

                  {/* Nav links */}
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={() => { navigate('/backend'); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition flex items-center gap-2"
                    >
                      ⚙️ Backend Admin
                    </button>
                  )}
                  <button
                    onClick={() => { navigate('/kitchen'); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition flex items-center gap-2"
                  >
                    👨‍🍳 Kitchen Display
                  </button>

                  <div className="border-t border-gray-700 mt-1" />

                  {/* Close session */}
                  <button
                    onClick={openCloseConfirm}
                    className="w-full text-left px-4 py-2.5 text-sm text-yellow-400 hover:bg-gray-700 transition flex items-center gap-2"
                  >
                    🔒 Close Session
                  </button>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition flex items-center gap-2"
                  >
                    ← Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Content Area ───────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'order' && (
          <OrderView
            table={selectedTable}
            session={session}
            existingOrder={currentOrder}
            initialOrder={currentOrder}
            searchQuery={searchQuery}
            onTableClick={() => setShowFloorPopup(true)}
            onOrderComplete={() => { setSelectedTable(null); setCurrentOrder(null); }}
            onOrderUpdate={(order) => setCurrentOrder(order)}
          />
        )}
        {currentView === 'orders-list' && <OrdersList session={session} />}
        {currentView === 'customers' && <CustomerManagement />}
      </main>

      {/* ── Floor Popup ────────────────────────────────── */}
      {showFloorPopup && (
        <FloorPopup
          onSelect={handleTableSelect}
          onNoTable={handleNoTable}
          onClose={() => setShowFloorPopup(false)}
          session={session}
        />
      )}

      {/* ── Close Session Confirm ──────────────────────── */}
      <ConfirmDialog
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleCloseSession}
        loading={closeLoading}
        title="Close Session?"
        icon="🔒"
        confirmLabel="Close Session"
        confirmClass="bg-yellow-500 hover:bg-yellow-600"
        message={
          draftCount > 0
            ? `This will end the current POS session. ⚠️ ${draftCount} draft order${draftCount !== 1 ? 's' : ''} will be abandoned.`
            : 'This will end the current POS session and generate a closing summary.'
        }
      />

      <SessionSummaryModal
        isOpen={showSummaryModal}
        onClose={handleLogout}
        summary={closingSummary}
        session={closedSession}
      />
    </div>
  );
}
