import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/contexts/authStore';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import EventsPage from '@/pages/EventsPage';
import EventDetailPage from '@/pages/EventDetailPage';
import EventCreatePage from '@/pages/EventCreatePage';
import EventEditPage from '@/pages/EventEditPage';
import TicketsPage from '@/pages/TicketsPage';
import OrdersPage from '@/pages/OrdersPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import AttendeesPage from '@/pages/AttendeesPage';
import VenuesPage from '@/pages/VenuesPage';
import OrganizersPage from '@/pages/OrganizersPage';
import OrganizerDetailPage from '@/pages/OrganizerDetailPage';
import UsersPage from '@/pages/UsersPage';
import CheckInPage from '@/pages/CheckInPage';
import MessagesPage from '@/pages/MessagesPage';
import SettingsPage from '@/pages/SettingsPage';
import ProfilePage from '@/pages/ProfilePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/new" element={<EventCreatePage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="events/:id/edit" element={<EventEditPage />} />
          <Route path="events/:id/tickets" element={<TicketsPage />} />
          <Route path="events/:id/attendees" element={<AttendeesPage />} />
          <Route path="events/:id/orders" element={<OrdersPage />} />
          <Route path="events/:id/check-in" element={<CheckInPage />} />
          <Route path="events/:id/messages" element={<MessagesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route path="organizers" element={<OrganizersPage />} />
          <Route path="organizers/:id" element={<OrganizerDetailPage />} />
          <Route path="venues" element={<VenuesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
