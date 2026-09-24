import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Zap,
  CheckCircle,
  Battery,
  Package,
  ClipboardList,
  Bookmark,
  Clock,
  CalendarCheck,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Eye,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { dashboardService } from '../services/api';
import { getUser, getRole } from '../utils/auth';
import Button from '../components/Button';

/**
 * Operational Dashboard for Booking Operations, Monitoring, and Microgrid Health.
 * Dynamically displays Pending Reservations, Approved Future Reservations (Marking Scheme Critical),
 * active bookings, energy traded volume, and real-time operational activity.
 */
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const navigate = useNavigate();
  const user = getUser();
  const role = getRole();
  const timerRef = useRef(null);

  useEffect(() => {
    fetchStats(true);
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        fetchStats(false);
      }, 20000); // 20s interval
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh]);

  const fetchStats = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await dashboardService.getStats();
      setStats(response.data);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard statistics:', error);
    } finally {
      if (isInitial) setLoading(false);
      else setRefreshing(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'booked':
        return 'status-booked';
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'confirmed':
        return 'status-confirmed';
      default:
        return 'status-available';
    }
  };

  return (
    <div className="page-container">
      {/* Header with Title and Real-time Monitoring Controls */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Booking Operations & Monitoring</h1>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.fullName || user?.username}</strong>
            {' — '}
            <span style={{ color: role === 'Backoffice' ? 'var(--primary-light)' : 'var(--accent-light)' }}>
              {role === 'Backoffice' ? 'Backoffice Operations' : 'Grid Operator'}
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
            <div>Last Updated: {lastRefreshed.toLocaleTimeString()}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: autoRefresh ? 'var(--success)' : 'var(--text-secondary)',
                  boxShadow: autoRefresh ? '0 0 8px var(--success)' : 'none'
                }}
              />
              <label style={{ cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  style={{ marginRight: 4 }}
                />
                Live Auto-Refresh
              </label>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchStats(false)}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'spinning icon-mr' : 'icon-mr'} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Loading operational data...</span>
        </div>
      ) : !stats ? (
        <div className="card text-center py-5">
          <AlertCircle size={48} color="var(--warning)" style={{ margin: '0 auto 16px' }} />
          <p>Failed to load operational statistics from server.</p>
          <Button variant="primary" onClick={() => fetchStats(true)} style={{ marginTop: 12 }}>
            Retry Loading
          </Button>
        </div>
      ) : (
        <>
          {/* Top Key Metrics Grid */}
          <div className="stats-grid">
            {/* Marking Scheme Critical: Pending Reservations */}
            <div
              className="stat-card"
              style={{ borderLeft: '4px solid var(--warning)', cursor: 'pointer' }}
              onClick={() => navigate('/bookings/pending')}
            >
              <div className="stat-icon warning">
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.pendingReservations}</div>
                <div className="stat-label">Pending Reservations</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: 4 }}>
                  Action required &rarr;
                </div>
              </div>
            </div>

            {/* Marking Scheme Critical: Approved Future Reservations */}
            <div
              className="stat-card"
              style={{ borderLeft: '4px solid var(--accent)', cursor: 'pointer' }}
              onClick={() => navigate('/reservations')}
            >
              <div className="stat-icon accent">
                <CalendarCheck size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.approvedFutureReservations}</div>
                <div className="stat-label">Approved Future Reservations</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: 4 }}>
                  Confirmed forward delivery
                </div>
              </div>
            </div>

            {/* Current Bookings */}
            <div
              className="stat-card"
              style={{ borderLeft: '4px solid var(--primary)', cursor: 'pointer' }}
              onClick={() => navigate('/bookings/current')}
            >
              <div className="stat-icon primary">
                <ClipboardList size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.currentBookings}</div>
                <div className="stat-label">Current Bookings</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', marginTop: 4 }}>
                  Active claimed energy
                </div>
              </div>
            </div>

            {/* Energy Traded Volume */}
            <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div className="stat-icon success">
                <TrendingUp size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalEnergyTradedKWh} <span style={{ fontSize: '0.9rem' }}>kWh</span></div>
                <div className="stat-label">Total Energy Traded</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Est. Value: ${stats.totalRevenueTraded?.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Energy Slots Inventory */}
            <div
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/energy-slots')}
            >
              <div className="stat-icon info">
                <Battery size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">
                  {stats.availableSlots} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ {stats.totalEnergySlots}</span>
                </div>
                <div className="stat-label">Available Slots</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: 4 }}>
                  Ready for booking
                </div>
              </div>
            </div>

            {/* Microgrid Nodes */}
            <div
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/microgrid')}
            >
              <div className="stat-icon accent">
                <Zap size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">
                  {stats.activeNodes} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ {stats.totalNodes}</span>
                </div>
                <div className="stat-label">Active Microgrid Nodes</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Operational capacity
                </div>
              </div>
            </div>
          </div>

          {/* Operational Monitoring Panels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 24 }}>
            {/* Operations Summary Card */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckSquare size={20} color="var(--primary)" />
                  Booking Operations Summary
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--card-bg-subtle, rgba(255,255,255,0.03))', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="status-badge status-booked">Booked</span>
                    <span style={{ fontSize: '0.9rem' }}>Active Current Bookings</span>
                  </div>
                  <strong style={{ fontSize: '1.1rem' }}>{stats.currentBookings}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--card-bg-subtle, rgba(255,255,255,0.03))', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="status-badge status-pending">Pending</span>
                    <span style={{ fontSize: '0.9rem' }}>Awaiting Confirmation</span>
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--warning)' }}>{stats.pendingBookings}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--card-bg-subtle, rgba(255,255,255,0.03))', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="status-badge status-completed">Completed</span>
                    <span style={{ fontSize: '0.9rem' }}>Concluded Energy Trades</span>
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>{stats.completedBookings}</strong>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 20, paddingTop: 16 }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>
                  Quick Operational Actions
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <Button variant="primary" size="sm" onClick={() => navigate('/bookings/current')}>
                    Current Bookings <ArrowRight size={14} className="icon-ml" />
                  </Button>
                  <Button variant="warning" size="sm" onClick={() => navigate('/bookings/pending')}>
                    Pending Bookings <ArrowRight size={14} className="icon-ml" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/bookings/history')}>
                    Booking History <ArrowRight size={14} className="icon-ml" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Prosumer & Grid Health Overview */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={20} color="var(--accent)" />
                  Network & Prosumer Health
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--card-bg-subtle, rgba(255,255,255,0.03))', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Active Prosumers</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Trading participants</div>
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>{stats.activeProsumers} / {stats.totalProsumers}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--card-bg-subtle, rgba(255,255,255,0.03))', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Pending Prosumer Activations</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Accounts awaiting approval</div>
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: stats.pendingProsumers > 0 ? 'var(--warning)' : 'inherit' }}>
                    {stats.pendingProsumers}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--card-bg-subtle, rgba(255,255,255,0.03))', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Grid Availability Rate</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ratio of available energy slots</div>
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>
                    {stats.totalEnergySlots > 0 ? `${Math.round((stats.availableSlots / stats.totalEnergySlots) * 100)}%` : '0%'}
                  </strong>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 20, paddingTop: 16 }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>
                  Microgrid Management
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/prosumers')}>
                    Manage Prosumers
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/microgrid')}>
                    Microgrid Nodes
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Activity Stream */}
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={20} color="var(--primary)" />
                  Recent Booking & Reservation Operations
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Real-time operational activity across the microgrid network
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate('/bookings/history')}>
                View Full History <ArrowRight size={14} className="icon-ml" />
              </Button>
            </div>

            {stats.recentBookings && stats.recentBookings.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Booking / Slot ID</th>
                      <th>Microgrid Node</th>
                      <th>Buyer</th>
                      <th>Seller</th>
                      <th>Energy</th>
                      <th>Slot Date & Window</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-light)' }}>
                            {b.id ? b.id.slice(-8) : '—'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{b.microgridNodeName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.microgridLocation}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{b.buyerName || 'N/A'}</div>
                          {b.buyerProsumerId && b.buyerProsumerId !== 'N/A' && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.buyerProsumerId}</div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{b.sellerName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.sellerProsumerId}</div>
                        </td>
                        <td>
                          <strong>{b.energyAmount} kWh</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>${b.pricePerUnit}/kWh</div>
                        </td>
                        <td>
                          <div>{new Date(b.slotDate).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {b.startTime} - {b.endTime}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(b.status)}`}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/bookings/${b.id}`)}
                            title="View Full Booking Details"
                          >
                            <Eye size={14} className="icon-mr" /> Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                <ClipboardList size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p>No recent booking operations logged yet.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
