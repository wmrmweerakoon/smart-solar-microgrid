import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sun, LogIn, Shield, Zap, Globe, ArrowRight, Activity, Battery, Server } from 'lucide-react';
import { useState, useEffect } from 'react';
import { isAuthenticated, getRole } from './utils/auth';

// Layout Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SplashScreen from './components/SplashScreen';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Prosumer Pages
import ProsumerList from './pages/prosumer/ProsumerList';
import CreateProsumer from './pages/prosumer/CreateProsumer';
import EditProsumer from './pages/prosumer/EditProsumer';
import ProsumerDetails from './pages/prosumer/ProsumerDetails';
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
const AuthenticatedLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

/**
 * Landing page for unauthenticated users.
 */
const LandingPage = () => {
  const [showSplash, setShowSplash] = useState(true);
  const navigate = () => window.location.href = '/login';

  return (
    <div className="landing-page">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      {/* Floating Navbar */}
      <nav className="landing-navbar">
        <div className="landing-brand">
          <Sun size={24} color="var(--primary)" />
          <span>Smart Solar</span>
        </div>
        
        <div className="landing-nav-center">
          <a href="#features" className="landing-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('features').scrollIntoView({ behavior: 'smooth' }); }}>Features</a>
          <a href="#technology" className="landing-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('technology').scrollIntoView({ behavior: 'smooth' }); }}>Technology</a>
          <a href="#network" className="landing-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('network').scrollIntoView({ behavior: 'smooth' }); }}>Network</a>
        </div>

        <div className="landing-nav-links">
          <button className="btn btn-secondary btn-sm" onClick={navigate}>
            <LogIn size={16} className="icon-mr" /> Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-bg">
          <div className="landing-hero-overlay"></div>
        </div>
        
        <div className="hero-container">
          <div className="hero-content">
            <div className="landing-badge">
              <span className="live-dot"></span> Solar Network is Online
            </div>
            <h1 className="landing-title">Energy Trading,<br/>Decentralized.</h1>
            <p className="landing-description">
              The high-performance platform for managing microgrid nodes. Empowering prosumers and operators with real-time, transparent energy allocation.
            </p>
            <div className="landing-actions">
              <button className="btn btn-primary btn-lg" onClick={navigate}>
                Start Trading <ArrowRight size={18} style={{ marginLeft: 8 }} />
              </button>
              <button className="btn btn-glass btn-lg" onClick={() => document.getElementById('features').scrollIntoView()}>
                Platform Features
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bento Box Features Section */}
      <section id="features" className="landing-features">
        <div className="features-header">
          <h2>Engineered for the modern grid.</h2>
          <p>Everything you need to run a decentralized energy market, built into one seamless platform.</p>
        </div>
        
        <div className="bento-grid">
          <div className="bento-card bento-large">
            <div className="bento-content">
              <div className="feature-icon-wrapper"><Globe size={32} color="var(--accent)" /></div>
              <h3>Global Microgrid Network</h3>
              <p>Connect to local microgrid nodes to buy, sell, and transfer solar energy efficiently without central point failures. Scale your infrastructure dynamically.</p>
            </div>
            <div className="bento-bg-graphic globe-graphic"></div>
          </div>
          
          <div className="bento-card">
            <div className="bento-content">
              <div className="feature-icon-wrapper"><Zap size={32} color="var(--primary)" /></div>
              <h3>Instant Execution</h3>
              <p>Book energy slots instantly with our ultra-low latency trading engine.</p>
            </div>
          </div>
          
          <div className="bento-card">
            <div className="bento-content">
              <div className="feature-icon-wrapper"><Shield size={32} color="var(--success)" /></div>
              <h3>Bank-Grade Security</h3>
              <p>Role-based access and immutable ledgers ensure every watt is accounted for.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="landing-technology">
        <div className="tech-container">
          <h2>Powered by Next-Gen Architecture</h2>
          <p>Our microgrid trading platform uses cutting-edge distributed ledgers, ensuring fast, secure, and transparent transactions at scale.</p>
          <div className="tech-stats">
            <div className="tech-stat">
              <h4>99.99%</h4>
              <span>Uptime</span>
            </div>
            <div className="tech-stat">
              <h4>&lt;50ms</h4>
              <span>Latency</span>
            </div>
            <div className="tech-stat">
              <h4>256-bit</h4>
              <span>Encryption</span>
            </div>
          </div>
        </div>
      </section>

      {/* Network Section */}
      <section id="network" className="landing-network">
        <div className="network-container">
          <h2>Join the Global Microgrid</h2>
          <p>Over 5,000 active nodes trading energy every day. Ready to become a prosumer?</p>
          <button className="btn btn-primary btn-lg mt-4" onClick={navigate}>
            Start Trading Now
          </button>
        </div>
      </section>
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
      <Route path="/prosumers/:id" element={<ProtectedRoute><AuthenticatedLayout><ProsumerDetails /></AuthenticatedLayout></ProtectedRoute>} />

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
