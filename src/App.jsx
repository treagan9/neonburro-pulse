// src/App.jsx
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { PresenceProvider } from './hooks/usePresence';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppShell from './components/Layout/AppShell';

import Login         from './pages/Auth/Login';
import ResetPassword from './pages/Auth/ResetPassword';
import AcceptInvite  from './pages/Auth/AcceptInvite';
import Dashboard     from './pages/Dashboard';
import Clients       from './pages/Clients';
import Projects      from './pages/Projects';
import Invoicing     from './pages/Invoicing';
import Forms         from './pages/Forms';
import Calendar      from './pages/Calendar';
import Analytics     from './pages/Analytics';
import Settings      from './pages/Settings';

// Wraps protected routes with PresenceProvider so all pages can use usePresence()
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
        <Route path="/login/" element={<Login />} />
        <Route path="/reset-password/" element={<ResetPassword />} />
        <Route path="/accept-invite/" element={<AcceptInvite />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<PresenceWrappedShell />}>
            <Route index element={<Navigate to="/dashboard/" replace />} />
            <Route path="dashboard/" element={<Dashboard />} />
            <Route path="clients/" element={<Clients />} />
            <Route path="projects/" element={<Projects />} />
            <Route path="invoicing/" element={<Invoicing />} />
            <Route path="forms/" element={<Forms />} />
            <Route path="calendar/" element={<Calendar />} />
            <Route path="analytics/" element={<Analytics />} />
            <Route path="settings/" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard/" replace />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;