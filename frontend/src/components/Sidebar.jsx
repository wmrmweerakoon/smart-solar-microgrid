import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Zap,
  Battery,
  ClipboardList,
  Clock,
  History,
  Bookmark,
  CheckSquare,
  UserCheck,
  Sun,
  X
} from 'lucide-react';
import { getRole } from '../utils/auth';
import logo from '../assets/logo.png';

/**
 * Sidebar navigation component with role-based menu items and mobile responsiveness.
 */
const Sidebar = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const role = getRole();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const menuSections = [
    {
      title: 'Overview',
      items: [
        { path: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
      ],
    },
    {
      title: 'Management',
      items: [
        { path: '/prosumers', icon: <Users size={18} />, label: 'Prosumers', roles: ['Backoffice', 'GridOperator'] },
        { path: '/microgrid', icon: <Zap size={18} />, label: 'Microgrid Nodes', roles: ['Backoffice', 'GridOperator'] },
        { path: '/energy-slots', icon: <Battery size={18} />, label: 'Energy Slots', roles: ['Backoffice', 'GridOperator'] },
      ],
    },
    {
      title: 'Bookings',
      items: [
        { path: '/bookings/current', icon: <ClipboardList size={18} />, label: 'Current Bookings', roles: ['Backoffice', 'GridOperator'] },
        { path: '/bookings/pending', icon: <Clock size={18} />, label: 'Pending Bookings', roles: ['Backoffice', 'GridOperator'] },
        { path: '/bookings/history', icon: <History size={18} />, label: 'Booking History', roles: ['Backoffice', 'GridOperator'] },
      ],
    },
    {
      title: 'Reservations',
      items: [
        { path: '/reservations', icon: <Bookmark size={18} />, label: 'Reservations', roles: ['Backoffice', 'GridOperator'] },
      ],
    },
    {
      title: 'Administration',
      items: [
        { path: '/users', icon: <UserCheck size={18} />, label: 'User Management', roles: ['Backoffice'] },
        { path: '/prosumers/pending', icon: <CheckSquare size={18} />, label: 'Pending Activations', roles: ['Backoffice'] },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="sidebar-logo">
              <img src={logo} alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            </div>
            <div>
              <div className="sidebar-title">Smart Solar</div>
              <div className="sidebar-subtitle">Microgrid System</div>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuSections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.roles || item.roles.includes(role)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div className="sidebar-section" key={section.title}>
                <div className="sidebar-section-title">{section.title}</div>
                {visibleItems.map((item) => (
                  <button
                    key={item.path}
                    className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => handleNav(item.path)}
                  >
                    <span className="sidebar-link-icon">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
