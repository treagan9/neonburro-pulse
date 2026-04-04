// src/App.jsx
// NeonBurro Pulse - routing
// ============================================
// /dashboard/  - Command center
// /clients/    - Client management
// /projects/   - Project tracking
// /invoicing/  - Create, send, track invoices
// /forms/      - Form submission inbox
// /calendar/   - Aggregated events
// /analytics/  - GA4 + Firebase realtime
// /settings/   - Profile and integrations
// ============================================
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppShell from './components/Layout/AppShell';

import Login      from './pages/Auth/Login';
import Dashboard  from './pages/Dashboard';
import Clients    from './pages/Clients';
import Projects   from './pages/Projects';
import Invoicing  from './pages/Invoicing';
import Forms      from './pages/Forms';
import Calendar   from './pages/Calendar';
import Analytics  from './pages/Analytics';
import Settings   from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login/" element={<Login />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
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
