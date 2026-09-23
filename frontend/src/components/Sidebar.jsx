import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Zap, Battery, ClipboardList, Clock, History, Bookmark, CheckSquare, Sun } from 'lucide-react';
import { getUser, getRole } from '../utils/auth';

/**
 * Sidebar navigation component with role-based menu items.
 */
const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const role = getRole();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

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
        { path: '/prosumers/pending', icon: <CheckSquare size={18} />, label: 'Pending Activations', roles: ['Backoffice'] },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo"><Sun size={24} color="var(--primary-color)" /></div>
        <div>
          <div className="sidebar-title">Smart Solar</div>
          <div className="sidebar-subtitle">Microgrid System</div>
        </div>
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
                  onClick={() => navigate(item.path)}
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
  );
};

export default Sidebar;
