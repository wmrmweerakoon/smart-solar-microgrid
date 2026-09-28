import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { getUser, getRole, logout } from '../utils/auth';
import logo from '../assets/logo.png';

/**
 * Top navigation bar with user info, role badge, mobile sidebar toggle, and logout.
 */
const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const user = getUser();
  const role = getRole();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleClass = role === 'Backoffice' ? 'role-backoffice' : 'role-gridoperator';
  const roleLabel = role === 'Backoffice' ? 'Backoffice' : 'Grid Operator';

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Mobile Hamburger Menu Toggle */}
        <button
          className="navbar-menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="navbar-brand">
          <span className="brand-icon">
            <img src={logo} alt="Smart Solar Microgrid" style={{ width: 28, height: 28, objectFit: 'contain', verticalAlign: 'middle' }} />
          </span>
          <span className="brand-text">Smart Solar Microgrid</span>
        </div>
      </div>

      <div className="navbar-user">
        <span className={`navbar-role ${roleClass}`}>{roleLabel}</span>
        <span className="navbar-username">{user?.fullName || user?.username || 'User'}</span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleLogout}
          title="Sign out of system"
        >
          <LogOut size={14} className="icon-mr" />
          <span className="btn-logout-text">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
