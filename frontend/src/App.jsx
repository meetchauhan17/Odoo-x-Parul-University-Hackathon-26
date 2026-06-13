import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BackendLayout from './components/layout/BackendLayout';
import Dashboard from './pages/backend/Dashboard';
import Products from './pages/backend/Products';
import Categories from './pages/backend/Categories';
import PaymentMethods from './pages/backend/PaymentMethods';
import Tables from './pages/backend/Tables';
import Coupons from './pages/backend/Coupons';
import Users from './pages/backend/Users';
import Reports from './pages/backend/Reports';
import PosTerminal from './pages/pos/PosTerminal';
import KitchenDisplay from './pages/kitchen/KitchenDisplay';
import PublicMenu from './pages/PublicMenu';

function AdminGuard({ children }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/pos" replace />;
  return children;
}

function AuthGuard({ children }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/kitchen" element={<KitchenDisplay />} />
        <Route path="/menu" element={<PublicMenu />} />
        <Route path="/pos" element={<AuthGuard><PosTerminal /></AuthGuard>} />
        <Route path="/backend" element={<AdminGuard><BackendLayout /></AdminGuard>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="payment-methods" element={<PaymentMethods />} />
          <Route path="tables" element={<Tables />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="users" element={<Users />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
