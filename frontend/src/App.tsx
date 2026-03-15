import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/Layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/events/EventsPage';
import EventFormPage from './pages/events/EventFormPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import TicketsPage from './pages/tickets/TicketsPage';
import OrdersPage from './pages/orders/OrdersPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import UsersPage from './pages/users/UsersPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/new" element={<EventFormPage />} />
        <Route path="events/:id/edit" element={<EventFormPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
