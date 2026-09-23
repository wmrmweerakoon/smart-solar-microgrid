import { useNavigate } from 'react-router-dom';
import { Sun, LogOut } from 'lucide-react';
import { getUser, getRole, logout } from '../utils/auth';

/**
 * Top navigation bar with user info, role badge, and logout.
 */
const Navbar = () => {
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
      <div className="navbar-brand">
        <span className="brand-icon"><Sun size={20} color="var(--primary-color)" /></span>
        Smart Solar Microgrid
      </div>

      <div className="navbar-user">
        <span className={`navbar-role ${roleClass}`}>{roleLabel}</span>
        <span className="navbar-username">{user?.fullName || user?.username || 'User'}</span>
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
          <LogOut size={14} className="icon-mr" /> Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
