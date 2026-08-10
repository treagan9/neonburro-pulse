// src/App.jsx
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { PresenceProvider } from './hooks/usePresence';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppShell from './components/Layout/AppShell';

// Auth pages (public)
import Login         from './pages/Auth/Login';
import ResetPassword from './pages/Auth/ResetPassword';
import AcceptInvite  from './pages/Auth/AcceptInvite';

// PIN approval (public - validated by one-time token from email)
import PinApproval   from './pages/PinApproval';

// Protected pages
import Dashboard     from './pages/Dashboard';
import Clients       from './pages/Clients';
import ClientDetail  from './pages/Clients/ClientDetail';
import Invoicing     from './pages/Invoicing';
import Forms         from './pages/Forms';
import Messages      from './pages/Messages';
import Calendar      from './pages/Calendar';
import Analytics     from './pages/Analytics';
import Settings      from './pages/Settings';

const PresenceWrappedShell = () => (
  <PresenceProvider>
    <AppShell>
      <Outlet />
    </AppShell>
  </PresenceProvider>
);

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login/" element={<Login />} />
        <Route path="/reset-password/" element={<ResetPassword />} />
        <Route path="/accept-invite/" element={<AcceptInvite />} />
        <Route path="/pin-approval/" element={<PinApproval />} />
        <Route path="/pin-approval" element={<PinApproval />} />

        {/* Protected admin routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PresenceWrappedShell />}>
            {/* Today is the canonical landing page. /dashboard/ still resolves
                so bookmarks, old emails and anything already sent keep working. */}
            <Route index element={<Navigate to="/today/" replace />} />
            <Route path="today/" element={<Dashboard />} />
            <Route path="dashboard/" element={<Navigate to="/today/" replace />} />
            <Route path="clients/" element={<Clients />} />
            <Route path="clients/:clientId/" element={<ClientDetail />} />
            <Route path="invoicing/" element={<Invoicing />} />
            <Route path="forms/" element={<Forms />} />
            <Route path="messages/" element={<Messages />} />
            <Route path="calendar/" element={<Calendar />} />
            <Route path="analytics/" element={<Analytics />} />
            <Route path="settings/" element={<Settings />} />
            {/* Projects redirect to clients - the source of truth now */}
            <Route path="projects/" element={<Navigate to="/clients/" replace />} />
            <Route path="projects/*" element={<Navigate to="/clients/" replace />} />
            <Route path="*" element={<Navigate to="/today/" replace />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;