import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/backend', label: 'Dashboard', icon: '📊', end: true },
  { to: '/backend/products', label: 'Products', icon: '🍽️' },
  { to: '/backend/categories', label: 'Categories', icon: '🏷️' },
  { to: '/backend/payment-methods', label: 'Payment Methods', icon: '💳' },
  { to: '/backend/tables', label: 'Floor & Tables', icon: '🪑' },
  { to: '/backend/coupons', label: 'Coupons & Promos', icon: '🎟️' },
  { to: '/backend/users', label: 'Users', icon: '👥' },
  { to: '/backend/reports', label: 'Reports', icon: '📈' },
];

export default function BackendLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.post('/auth/logout');
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  return (
    <div className="flex h-screen bg-gray-950">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="text-2xl font-bold text-white">☕ Cafe POS</div>
          <div className="text-xs text-gray-400 mt-1">Backend Admin</div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-400 mb-3">
            <span className="text-white font-medium">{user?.name}</span> · {user?.role}
          </div>
          <button
            onClick={() => navigate('/pos')}
            className="w-full text-left text-sm text-orange-400 hover:text-orange-300 mb-2 transition"
          >
            → Open POS Terminal
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-red-400 hover:text-red-300 transition"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 bg-gray-950">
        <Outlet />
      </main>
    </div>
  );
}
