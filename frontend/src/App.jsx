import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getRole } from './utils/auth';

// Layout Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Prosumer Pages
import ProsumerList from './pages/prosumer/ProsumerList';
import CreateProsumer from './pages/prosumer/CreateProsumer';
import EditProsumer from './pages/prosumer/EditProsumer';
import PendingActivation from './pages/prosumer/PendingActivation';

// Microgrid Pages
import MicrogridList from './pages/microgrid/MicrogridList';
import CreateMicrogrid from './pages/microgrid/CreateMicrogrid';
import EditMicrogrid from './pages/microgrid/EditMicrogrid';

// Energy Pages
import EnergySlots from './pages/energy/EnergySlots';

// Booking Pages
import CurrentBookings from './pages/bookings/CurrentBookings';
import PendingBookings from './pages/bookings/PendingBookings';
import BookingHistory from './pages/bookings/BookingHistory';
import BookingDetails from './pages/bookings/BookingDetails';

// Reservation Pages
import Reservations from './pages/reservations/Reservations';
import ReservationDetails from './pages/reservations/ReservationDetails';

/**
 * Protected Route wrapper – redirects to login if not authenticated.
 * Optionally restricts access by role.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const role = getRole();
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

/**
 * Layout wrapper for authenticated pages (Navbar + Sidebar + Content).
 */
const AuthenticatedLayout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <div style={{ flex: 1 }}>
      <Navbar />
      <div className="main-content">
        {children}
      </div>
    </div>
  </div>
);

/**
 * Landing page for unauthenticated users.
 */
const LandingPage = () => {
  const navigate = () => window.location.href = '/login';

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="landing-content">
          <div className="landing-badge">☀️ Solar Energy Trading Platform</div>
          <h1 className="landing-title">Smart Solar Microgrid Trading System</h1>
          <p className="landing-description">
            A next-generation platform for managing and trading solar energy through decentralized microgrid nodes.
            Empowering prosumers and grid operators with seamless energy management.
          </p>
          <div className="landing-actions">
            <button className="btn btn-primary btn-lg" onClick={navigate}>
              🔐 Sign In to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const location = useLocation();
  const publicPaths = ['/', '/login'];
  const isPublicPage = publicPaths.includes(location.pathname);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout><Dashboard /></AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Prosumer Routes */}
      <Route path="/prosumers" element={<ProtectedRoute><AuthenticatedLayout><ProsumerList /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/prosumers/create" element={<ProtectedRoute><AuthenticatedLayout><CreateProsumer /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/prosumers/edit/:id" element={<ProtectedRoute><AuthenticatedLayout><EditProsumer /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/prosumers/pending" element={<ProtectedRoute allowedRoles={['Backoffice']}><AuthenticatedLayout><PendingActivation /></AuthenticatedLayout></ProtectedRoute>} />

      {/* Microgrid Routes */}
      <Route path="/microgrid" element={<ProtectedRoute><AuthenticatedLayout><MicrogridList /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/microgrid/create" element={<ProtectedRoute><AuthenticatedLayout><CreateMicrogrid /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/microgrid/edit/:id" element={<ProtectedRoute><AuthenticatedLayout><EditMicrogrid /></AuthenticatedLayout></ProtectedRoute>} />

      {/* Energy Slot Routes */}
      <Route path="/energy-slots" element={<ProtectedRoute><AuthenticatedLayout><EnergySlots /></AuthenticatedLayout></ProtectedRoute>} />

      {/* Booking Routes */}
      <Route path="/bookings/current" element={<ProtectedRoute><AuthenticatedLayout><CurrentBookings /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/bookings/pending" element={<ProtectedRoute><AuthenticatedLayout><PendingBookings /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/bookings/history" element={<ProtectedRoute><AuthenticatedLayout><BookingHistory /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/bookings/:id" element={<ProtectedRoute><AuthenticatedLayout><BookingDetails /></AuthenticatedLayout></ProtectedRoute>} />

      {/* Reservation Routes */}
      <Route path="/reservations" element={<ProtectedRoute><AuthenticatedLayout><Reservations /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/reservations/:id" element={<ProtectedRoute><AuthenticatedLayout><ReservationDetails /></AuthenticatedLayout></ProtectedRoute>} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
