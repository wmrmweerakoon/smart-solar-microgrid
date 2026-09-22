import { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { getUser, getRole } from '../utils/auth';

/**
 * Dashboard page showing summary statistics.
 */
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();
  const role = getRole();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats
    ? [
        { icon: '👥', label: 'Total Prosumers', value: stats.totalProsumers, colorClass: 'primary' },
        { icon: '⏳', label: 'Pending Prosumers', value: stats.pendingProsumers, colorClass: 'warning' },
        { icon: '⚡', label: 'Microgrid Nodes', value: stats.totalNodes, colorClass: 'accent' },
        { icon: '✅', label: 'Active Nodes', value: stats.activeNodes, colorClass: 'success' },
        { icon: '🔋', label: 'Energy Slots', value: stats.totalEnergySlots, colorClass: 'info' },
        { icon: '📦', label: 'Available Slots', value: stats.availableSlots, colorClass: 'success' },
        { icon: '📋', label: 'Current Bookings', value: stats.currentBookings, colorClass: 'primary' },
        { icon: '🔖', label: 'Total Reservations', value: stats.totalReservations, colorClass: 'accent' },
        { icon: '⏰', label: 'Pending Reservations', value: stats.pendingReservations, colorClass: 'warning' },
      ]
    : [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Welcome back, <strong>{user?.fullName || user?.username}</strong>
          {' — '}
          <span style={{ color: role === 'Backoffice' ? 'var(--primary-light)' : 'var(--accent-light)' }}>
            {role === 'Backoffice' ? 'Backoffice Administrator' : 'Grid Operator'}
          </span>
        </p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Loading dashboard...</span>
        </div>
      ) : (
        <div className="stats-grid">
          {statCards.map((card, index) => (
            <div className="stat-card" key={index}>
              <div className={`stat-icon ${card.colorClass}`}>{card.icon}</div>
              <div className="stat-info">
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
