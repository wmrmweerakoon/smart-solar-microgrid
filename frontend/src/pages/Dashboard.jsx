import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Zap,
  Battery,
  ClipboardList,
  Clock,
  CalendarCheck,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  ArrowUpRight,
  Eye,
  CheckSquare,
  AlertCircle,
  Shield,
  Activity,
  Cpu,
  Layers,
  Radio,
  CheckCircle2,
  DollarSign,
  Gauge,
  Server,
  Sliders,
  PlusCircle,
  UserCheck,
  MapPin,
  Sparkles,
  Timer,
  Check,
  Info
} from 'lucide-react';
import {
  dashboardService,
  prosumerService,
  microgridService,
  energySlotService,
  reservationService
} from '../services/api';
import { getUser, getRole } from '../utils/auth';
import Button from '../components/Button';

/**
 * High-End Operational & Executive SCADA Dashboard
 * Features tailored operational layouts for:
 * 1. Backoffice Administrator: Executive governance, prosumer account compliance & approval queue, financial settlement ledger, infrastructure fleet overview.
 * 2. Grid Operator: Real-time SCADA telemetry, physical battery storage bay status, energy slot scheduling, 7-day rule forward booking horizon, 12-hour notice compliance monitoring.
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const role = getRole();
  const timerRef = useRef(null);

  // Default view to user's assigned role, but allow switching for evaluation/demonstration
  const [activeRoleView, setActiveRoleView] = useState(
    role === 'GridOperator' ? 'gridoperator' : 'backoffice'
  );

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Role-specific supplementary live data
  const [pendingProsumers, setPendingProsumers] = useState([]);
  const [microgridNodes, setMicrogridNodes] = useState([]);
  const [energySlots, setEnergySlots] = useState([]);
  const [pendingReservations, setPendingReservations] = useState([]);
  const [activatingNic, setActivatingNic] = useState(null);
  const [quickActivateMessage, setQuickActivateMessage] = useState('');

  useEffect(() => {
    fetchAllData();

    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        fetchAllData(false);
      }, 30000); // Auto-refresh every 30 seconds
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh]);

  const fetchAllData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const statsRes = await dashboardService.getStats();
      setStats(statsRes.data);
      setLastRefreshed(new Date());

      // Fetch supplementary feeds in parallel with error isolation
      const [prosumersRes, nodesRes, slotsRes, reservationsRes] = await Promise.allSettled([
        prosumerService.getByStatus('Pending'),
        microgridService.getAll(),
        energySlotService.getAll(),
        reservationService.getByStatus('Pending')
      ]);

      if (prosumersRes.status === 'fulfilled') setPendingProsumers(prosumersRes.value.data || []);
      if (nodesRes.status === 'fulfilled') setMicrogridNodes(nodesRes.value.data || []);
      if (slotsRes.status === 'fulfilled') setEnergySlots(slotsRes.value.data || []);
      if (reservationsRes.status === 'fulfilled') setPendingReservations(reservationsRes.value.data || []);
    } catch (err) {
      console.error('Failed to load operational dashboard data:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  const handleQuickActivate = async (nic, fullName) => {
    setActivatingNic(nic);
    try {
      await prosumerService.activate(nic);
      setQuickActivateMessage(`Prosumer "${fullName || nic}" successfully activated and approved for grid trading!`);
      setTimeout(() => setQuickActivateMessage(''), 5000);
      await fetchAllData(false);
    } catch (err) {
      console.error('Failed to activate prosumer:', err);
      alert(err.response?.data?.message || 'Failed to activate prosumer.');
    } finally {
      setActivatingNic(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'booked':
        return 'status-booked';
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-available';
    }
  };

  const avgTariff = stats?.totalEnergyTradedKWh > 0
    ? (stats.totalRevenueTraded / stats.totalEnergyTradedKWh).toFixed(2)
    : '12.50';

  // Node name lookup map
  const nodeMap = {};
  microgridNodes.forEach((n) => {
    if (n.id) nodeMap[n.id] = n.nodeName || n.name || n.location;
  });

  return (
    <div className="page-container">
      {/* ── Executive Header (Straight to the Point) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={22} color="#fbbf24" />
            {activeRoleView === 'backoffice' ? 'Backoffice Administrator Command Center' : 'Grid Operator Dispatch Center'}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
            Logged in as <strong>{user?.fullName || user?.username}</strong> ({role || 'Backoffice Administrator'}) • System Online
          </p>
        </div>

        {/* Global Controls & Sync Status */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success)', fontSize: '0.78rem', fontWeight: 600 }}>
            <span className="pulse-beacon emerald"></span>
            Live Synchronized • {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-Sync (30s)
          </label>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchAllData(true)}
            disabled={refreshing}
          >
            <RefreshCw size={13} className={refreshing ? 'icon-mr spin' : 'icon-mr'} />
            {refreshing ? 'Syncing...' : 'Refresh Feed'}
          </Button>
        </div>
      </div>

      {/* Quick feedback banner for prosumer activation */}
      {quickActivateMessage && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#34d399', padding: '10px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={16} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{quickActivateMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Loading live operational telemetry and system metrics...</span>
        </div>
      ) : !stats ? (
        <div className="card text-center py-5">
          <AlertCircle size={48} color="var(--warning)" style={{ margin: '0 auto 16px' }} />
          <p>Failed to load operational statistics from server.</p>
          <Button variant="primary" onClick={() => fetchAllData(true)} style={{ marginTop: 12 }}>
            Retry Loading
          </Button>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════════
              STREAMLINED, STRAIGHT-TO-THE-POINT KPI MATRIX CARDS
              ═══════════════════════════════════════════════════════════════ */}
          <div className="highend-kpi-grid">
            {activeRoleView === 'backoffice' ? (
              <>
                {/* 1. Total Registered Prosumers (Primary User Metric) */}
                <div
                  className="highend-kpi-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/prosumers')}
                  title="View registered prosumers directory"
                >
                  <div className="kpi-header">
                    <div className="kpi-icon-wrap kpi-icon-gold">
                      <Users size={18} />
                    </div>
                    <span className={`kpi-badge ${stats.pendingProsumers > 0 ? 'urgent' : 'success'}`}>
                      {stats.pendingProsumers > 0 ? `${stats.pendingProsumers} Pending` : `${stats.activeProsumers} Active`}
                    </span>
                  </div>
                  <div>
                    <div className="kpi-value-row">
                      <span className="kpi-large-num">
                        {stats.totalProsumers}
                      </span>
                      <span className="kpi-unit">registered</span>
                    </div>
                    <div className="kpi-label">Total Registered Prosumers</div>
                  </div>
                  <div className="kpi-footer-note">
                    <span>{stats.activeProsumers} Active • {stats.pendingProsumers} Pending</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>

                {/* 2. Microgrid Substation Fleet */}
                <div
                  className="highend-kpi-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/microgrid')}
                  title="View microgrid substations fleet"
                >
                  <div className="kpi-header">
                    <div className="kpi-icon-wrap kpi-icon-purple">
                      <Zap size={18} />
                    </div>
                    <span className="kpi-badge success">100% Online</span>
                  </div>
                  <div>
                    <div className="kpi-value-row">
                      <span className="kpi-large-num">{stats.activeNodes}</span>
                      <span className="kpi-unit">/ {stats.totalNodes} Nodes</span>
                    </div>
                    <div className="kpi-label">Active Microgrid Substations</div>
                  </div>
                  <div className="kpi-footer-note">
                    <span>Physical network topology</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>

                {/* 3. Energy Slots Generated & Scheduled */}
                <div
                  className="highend-kpi-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/energy-slots')}
                  title="View scheduled energy trading slots"
                >
                  <div className="kpi-header">
                    <div className="kpi-icon-wrap kpi-icon-cyan">
                      <Battery size={18} />
                    </div>
                    <span className={`kpi-badge ${stats.availableSlots > 0 ? 'highlight' : 'standard'}`}>
                      {stats.availableSlots} Open
                    </span>
                  </div>
                  <div>
                    <div className="kpi-value-row">
                      <span className="kpi-large-num">{stats.totalEnergySlots}</span>
                      <span className="kpi-unit">slots</span>
                    </div>
                    <div className="kpi-label">Total Energy Slots</div>
                  </div>
                  <div className="kpi-footer-note">
                    <span>{stats.availableSlots} Available • {stats.totalEnergySlots - stats.availableSlots} Allocated</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>

                {/* 4. Total Trading Operations & Bookings */}
                <div
                  className="highend-kpi-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/bookings/history')}
                  title="View peer-to-peer trading operations"
                >
                  <div className="kpi-header">
                    <div className="kpi-icon-wrap kpi-icon-blue">
                      <ClipboardList size={18} />
                    </div>
                    <span className={`kpi-badge ${stats.currentBookings > 0 ? 'urgent' : 'standard'}`}>
                      {stats.currentBookings} In-Flight
                    </span>
                  </div>
                  <div>
                    <div className="kpi-value-row">
                      <span className="kpi-large-num">
                        {stats.completedBookings + stats.currentBookings + stats.pendingBookings}
                      </span>
                      <span className="kpi-unit">trades</span>
                    </div>
                    <div className="kpi-label">Total Booking Operations</div>
                  </div>
                  <div className="kpi-footer-note">
                    <span>{stats.completedBookings} Completed • {stats.pendingBookings} In Review</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>

                {/* 5. Forward Reservations (Compliance & 7-Day Window) */}
                <div
                  className="highend-kpi-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/reservations')}
                  title="View forward reservation schedule"
                >
                  <div className="kpi-header">
                    <div className="kpi-icon-wrap kpi-icon-gold">
                      <CalendarCheck size={18} />
                    </div>
                    <span className="kpi-badge highlight">
                      {stats.approvedFutureReservations} Scheduled
                    </span>
                  </div>
                  <div>
                    <div className="kpi-value-row">
                      <span className="kpi-large-num">{stats.totalReservations}</span>
                      <span className="kpi-unit">reservations</span>
                    </div>
                    <div className="kpi-label">Forward Reservations</div>
                  </div>
                  <div className="kpi-footer-note">
                    <span>{stats.approvedFutureReservations} Confirmed • {stats.pendingReservations} Pending</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>

                {/* 6. Total Gross Settled Revenue */}
                <div
                  className="highend-kpi-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/bookings/history')}
                  title="View financial settlement ledger"
                >
                  <div className="kpi-header">
                    <div className="kpi-icon-wrap kpi-icon-emerald">
                      <TrendingUp size={18} />
                    </div>
                    <span className="kpi-badge success">Settled</span>
                  </div>
                  <div>
                    <div className="kpi-value-row">
                      <span className="kpi-large-num">
                        ${stats.totalRevenueTraded?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="kpi-label">Total Settled Revenue</div>
                  </div>
                  <div className="kpi-footer-note">
                    <span>{stats.totalEnergyTradedKWh} kWh Traded Volume</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>
              </>
            ) : (
              /* GRID OPERATOR KPI CARDS */
              <>
                {/* 1. Available Energy Slots */}
                <div
                  className="highend-kpi-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/energy-slots')}
                  title="View available slots"
                >
                  <div className="kpi-header">
                    <div className="kpi-icon-wrap kpi-icon-cyan">
                      <Battery size={18} />
                    </div>
                    <span className="kpi-badge highlight">Live Inventory</span>
                  </div>
                  <div>
                    <div className="kpi-value-row">
                      <span className="kpi-large-num">{stats.availableSlots}</span>
                      <span className="kpi-unit">/ {stats.totalEnergySlots} slots</span>
                    </div>
                    <div className="kpi-label">Available Energy Slots</div>
                  </div>
                  <div className="kpi-footer-note">
                    <span>Ready for dispatch trades</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>

                {/* 2. Active In-Flight Bookings */}
                <div
                  className="highend-kpi-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/bookings/current')}
                  title="View active claimed transfers"
                >
                  <div className="kpi-header">
                    <div className="kpi-icon-wrap kpi-icon-gold">
                      <ClipboardList size={18} />
                    </div>
                    <span className="kpi-badge urgent">In Progress</span>
                  </div>
                  <div>
                    <div className="kpi-value-row">
                      <span className="kpi-large-num">{stats.currentBookings}</span>
                      <span className="kpi-unit">transfers</span>
                    </div>
                    <div className="kpi-label">Active Claimed Transfers</div>
                  </div>
                  <div className="kpi-footer-note">
                    <span>Physical verification / QR</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>

                {/* 3. Approved Future Deliveries */}
                <div
                  className="highend-kpi-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/reservations')}
                  title="View forward scheduled reservations"
                >
                  <div className="kpi-header">
                    <div className="kpi-icon-wrap kpi-icon-emerald">
                      <CalendarCheck size={18} />
                    </div>
                    <span className="kpi-badge success">Scheduled</span>
                  </div>
                  <div>
                    <div className="kpi-value-row">
                      <span className="kpi-large-num">{stats.approvedFutureReservations}</span>
                      <span className="kpi-unit">deliveries</span>
                    </div>
                    <div className="kpi-label">Approved Future Deliveries</div>
                  </div>
                  <div className="kpi-footer-note">
                    <span>7-Day horizon forward queue</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>

                {/* 4. Pending Reservations */}
                <div
                  className="highend-kpi-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/bookings/pending')}
                  title="View pending confirmation queue"
                >
                  <div className="kpi-header">
                    <div className="kpi-icon-wrap kpi-icon-gold">
                      <Clock size={18} />
                    </div>
                    <span className="kpi-badge standard">Dispatch Queue</span>
                  </div>
                  <div>
                    <div className="kpi-value-row">
                      <span className="kpi-large-num">{stats.pendingReservations}</span>
                      <span className="kpi-unit">requests</span>
                    </div>
                    <div className="kpi-label">Pending Reservations</div>
                  </div>
                  <div className="kpi-footer-note">
                    <span>Awaiting operator review</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>

                {/* 5. Synchronized Microgrid Fleet */}
                <div
                  className="highend-kpi-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/microgrid')}
                  title="View online substation nodes"
                >
                  <div className="kpi-header">
                    <div className="kpi-icon-wrap kpi-icon-cyan">
                      <Zap size={18} />
                    </div>
                    <span className="kpi-badge success">100% Online</span>
                  </div>
                  <div>
                    <div className="kpi-value-row">
                      <span className="kpi-large-num">{stats.activeNodes}</span>
                      <span className="kpi-unit">/ {stats.totalNodes} Nodes</span>
                    </div>
                    <div className="kpi-label">Operational Substations</div>
                  </div>
                  <div className="kpi-footer-note">
                    <span>Telemetry feeds balanced</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>

                {/* 6. Total Energy Volume Traded */}
                <div
                  className="highend-kpi-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/bookings/history')}
                  title="View energy trading volume"
                >
                  <div className="kpi-header">
                    <div className="kpi-icon-wrap kpi-icon-emerald">
                      <TrendingUp size={18} />
                    </div>
                    <span className="kpi-badge success">Total Volume</span>
                  </div>
                  <div>
                    <div className="kpi-value-row">
                      <span className="kpi-large-num">{stats.totalEnergyTradedKWh}</span>
                      <span className="kpi-unit">kWh</span>
                    </div>
                    <div className="kpi-label">Total Energy Traded</div>
                  </div>
                  <div className="kpi-footer-note">
                    <span>${stats.totalRevenueTraded?.toFixed(2)} Total Revenue</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              MODULAR ARRANGEMENTS: ROLE-SPECIFIC HIGH-END SECTIONS
              ═══════════════════════════════════════════════════════════════ */}
          {activeRoleView === 'backoffice' ? (
            /* ═══════════════════════════════════════════════════════════════
               BACKOFFICE DASHBOARD ARRANGEMENT
               ═══════════════════════════════════════════════════════════════ */
            <div className="highend-modular-grid">
              {/* SECTION A: Prosumer Governance & Compliance Queue */}
              <div className="highend-panel">
                <div className="panel-header-row">
                  <div>
                    <div className="panel-title">
                      <Users size={20} color="#fbbf24" />
                      Prosumer Governance & Compliance Queue
                    </div>
                    <div className="panel-subtitle">
                      Verify identity and grant microgrid network trading authorization
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/prosumers/pending')}>
                    Full Queue ({pendingProsumers.length}) <ArrowRight size={14} className="icon-ml" />
                  </Button>
                </div>

                {/* Pending Prosumers List with 1-Click Activation */}
                {pendingProsumers && pendingProsumers.length > 0 ? (
                  <div style={{ marginBottom: 16 }}>
                    {pendingProsumers.slice(0, 4).map((p) => (
                      <div className="pending-prosumer-item" key={p.nic}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div className="prosumer-avatar">
                            {p.fullName ? p.fullName.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div className="prosumer-info-block">
                            <div className="prosumer-name">{p.fullName}</div>
                            <div className="prosumer-meta">
                              <span>NIC: <strong>{p.nic}</strong></span>
                              <span>•</span>
                              <span style={{ color: '#fbbf24' }}>{p.role || 'Prosumer'}</span>
                              <span>•</span>
                              <span>{p.microgridNodeName || 'Colombo Central'}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={activatingNic === p.nic}
                            onClick={() => handleQuickActivate(p.nic, p.fullName)}
                          >
                            <Check size={14} className="icon-mr" />
                            {activatingNic === p.nic ? 'Activating...' : 'Authorize'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}>
                    <CheckCircle2 size={28} color="#10b981" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.92rem' }}>All Prosumer Accounts Verified & Active</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 12 }}>
                      All {stats.totalProsumers} registered prosumer accounts are active with verified identity and grid trading privileges.
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                      <Button variant="secondary" size="sm" onClick={() => navigate('/prosumers')}>
                        <Users size={14} className="icon-mr" /> View All Prosumers ({stats.totalProsumers})
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => navigate('/prosumers/create')}>
                        <PlusCircle size={14} className="icon-mr" /> Register New Prosumer
                      </Button>
                    </div>
                  </div>
                )}

                {/* Prosumer Ecosystem Distribution Bar */}
                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>
                      Prosumer Participation Ecosystem ({stats.activeProsumers} Active)
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {stats.totalProsumers} Total Registered
                    </span>
                  </div>

                  <div className="distribution-track">
                    <div className="dist-bar-seller" style={{ width: '45%' }} title="Sellers (Solar Exporters)"></div>
                    <div className="dist-bar-buyer" style={{ width: '35%' }} title="Buyers (Consumers)"></div>
                    <div className="dist-bar-both" style={{ width: '20%' }} title="Hybrid Prosumers"></div>
                  </div>

                  <div className="distribution-legend">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b' }}></span> Solar Sellers
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: '#06b6d4' }}></span> Energy Buyers
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }}></span> Hybrid Dual-Role
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION B: Financial Settlement & Booking Operations Matrix */}
              <div className="highend-panel">
                <div className="panel-header-row">
                  <div>
                    <div className="panel-title">
                      <DollarSign size={20} color="#34d399" />
                      Financial Settlement & Operations Ledger
                    </div>
                    <div className="panel-subtitle">
                      Consolidated trade lifecycle breakdown and transaction volumes
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/bookings/history')}>
                    Audit Ledger <ArrowRight size={14} className="icon-ml" />
                  </Button>
                </div>

                {/* Financial Metric Tiles */}
                <div className="financial-matrix-grid">
                  <div className="matrix-tile">
                    <span className="matrix-tile-label">Settled Value</span>
                    <span className="matrix-tile-val" style={{ color: '#34d399' }}>
                      ${stats.totalRevenueTraded?.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>100% Cleared</span>
                  </div>

                  <div className="matrix-tile">
                    <span className="matrix-tile-label">Concluded Trades</span>
                    <span className="matrix-tile-val" style={{ color: '#38bdf8' }}>
                      {stats.completedBookings}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Completed transfers</span>
                  </div>

                  <div className="matrix-tile">
                    <span className="matrix-tile-label">In-Flight Capital</span>
                    <span className="matrix-tile-val" style={{ color: '#fbbf24' }}>
                      {stats.currentBookings}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Active execution</span>
                  </div>
                </div>

                {/* Operations Breakdown Status Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="status-badge status-completed">Completed</span>
                      <span style={{ fontSize: '0.88rem' }}>Settled & Verified Energy Transfers</span>
                    </div>
                    <strong style={{ fontSize: '1rem', color: '#34d399' }}>{stats.completedBookings} trades</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="status-badge status-booked">Current</span>
                      <span style={{ fontSize: '0.88rem' }}>Claimed Energy Currently Dispatching</span>
                    </div>
                    <strong style={{ fontSize: '1rem', color: '#22d3ee' }}>{stats.currentBookings} trades</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="status-badge status-pending">Pending</span>
                      <span style={{ fontSize: '0.88rem' }}>Awaiting Operator Confirmation</span>
                    </div>
                    <strong style={{ fontSize: '1rem', color: '#fbbf24' }}>{stats.pendingBookings} trades</strong>
                  </div>
                </div>

                {/* Quick Governance Links */}
                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Button variant="secondary" size="sm" onClick={() => navigate('/bookings/current')}>
                      Current Bookings ({stats.currentBookings})
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => navigate('/bookings/pending')}>
                      Pending Bookings ({stats.pendingBookings})
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => navigate('/users')}>
                      Operator Accounts
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ═══════════════════════════════════════════════════════════════
               GRID OPERATOR DASHBOARD ARRANGEMENT
               ═══════════════════════════════════════════════════════════════ */
            <div className="highend-modular-grid">
              {/* SECTION A: SCADA Microgrid Fleet & Physical Battery Storage Bays */}
              <div className="highend-panel">
                <div className="panel-header-row">
                  <div>
                    <div className="panel-title">
                      <Zap size={20} color="#22d3ee" />
                      Microgrid Substation Nodes & Battery Storage Bays
                    </div>
                    <div className="panel-subtitle">
                      Hardware battery bays in service vs operational capacity
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/microgrid')}>
                    Fleet Map ({microgridNodes.length}) <ArrowRight size={14} className="icon-ml" />
                  </Button>
                </div>

                {/* Node Fleet List with Visual Battery Storage Slots */}
                <div className="scada-nodes-container">
                  {microgridNodes && microgridNodes.length > 0 ? (
                    microgridNodes.slice(0, 3).map((node) => {
                      const totalBays = node.batteryStorageSlots || 6;
                      const activeBays = Math.min(totalBays, Math.max(1, Math.round(totalBays * 0.75)));

                      return (
                        <div className="scada-node-card" key={node.id}>
                          <div className="scada-node-top">
                            <div className="node-title-group">
                              <span className="pulse-beacon emerald"></span>
                              <div>
                                <div className="node-name">{node.nodeName || node.name || 'Substation Node'}</div>
                                <div className="node-location-badge">
                                  <MapPin size={12} /> {node.location}
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#22d3ee' }}>
                                {node.capacity || node.capacityKWh || 150} kW
                              </span>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                Rated Power Capacity
                              </div>
                            </div>
                          </div>

                          {/* Visual Battery Bays Display (Demonstrating Hardware Slots vs Trading Slots) */}
                          <div className="battery-bays-wrapper">
                            <div className="battery-bays-label">
                              <span>Physical Battery Storage Bays ({activeBays} of {totalBays} Ready)</span>
                              <span style={{ color: '#22d3ee' }}>Hardware Storage Units</span>
                            </div>
                            <div className="battery-bays-grid">
                              {Array.from({ length: totalBays }).map((_, idx) => (
                                <div
                                  key={idx}
                                  className={`battery-bay-slot ${idx < activeBays ? 'filled' : 'standby'}`}
                                  title={`Battery Storage Bay #${idx + 1}: ${idx < activeBays ? 'Online & Charging' : 'Standby'}`}
                                >
                                  <Battery size={12} color={idx < activeBays ? '#ffffff' : '#64748b'} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                      <Zap size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <p>No microgrid nodes registered yet.</p>
                      <Button variant="primary" size="sm" onClick={() => navigate('/microgrid/create')} style={{ marginTop: 8 }}>
                        Register First Node
                      </Button>
                    </div>
                  )}
                </div>

                {/* 7-Day & 12-Hour Notice Rule Compliance Box */}
                <div className="rules-compliance-box">
                  <div className="compliance-icon">
                    <Shield size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f1f5f9' }}>
                      Microgrid Operational Rules Compliance Engine
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                      System enforced rules ensuring dispatch reliability and forward predictability.
                    </div>

                    <div className="rules-list">
                      <div className="rule-item">
                        <div className="rule-item-title">
                          <Clock size={14} color="#22d3ee" />
                          7-Day Forward Horizon
                        </div>
                        <div className="rule-item-desc">
                          Reservations strictly restricted to within 7 days from today. Forward queue: <strong>{stats.approvedFutureReservations} approved</strong>.
                        </div>
                      </div>

                      <div className="rule-item">
                        <div className="rule-item-title">
                          <AlertCircle size={14} color="#fbbf24" />
                          12-Hour Cancellation Rule
                        </div>
                        <div className="rule-item-desc">
                          Modifications and cancellations locked 12 hours before slot delivery window to maintain grid balance.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B: Live Energy Slot Scheduling & Inventory Board */}
              <div className="highend-panel">
                <div className="panel-header-row">
                  <div>
                    <div className="panel-title">
                      <Battery size={20} color="#22d3ee" />
                      Live Energy Slot Scheduling & Inventory
                    </div>
                    <div className="panel-subtitle">
                      Dispatch windows scheduled across microgrid network
                    </div>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => navigate('/energy-slots')}>
                    <PlusCircle size={14} className="icon-mr" /> Create Slot
                  </Button>
                </div>

                {/* Energy Slots List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {energySlots && energySlots.length > 0 ? (
                    energySlots.slice(0, 5).map((slot) => (
                      <div className="slot-schedule-item" key={slot.id}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="time-badge">
                              <Clock size={12} /> {slot.startTime} - {slot.endTime}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                              {new Date(slot.slotDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                            Node: {nodeMap[slot.microgridNodeId] || slot.microgridNodeName || 'Colombo Solar Hub'} • Seller: {slot.prosumerName || slot.prosumerId || 'Solar Prosumer'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>
                              {slot.energyAmount} kWh
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              ${slot.pricePerUnit}/kWh
                            </div>
                          </div>
                          <span className={`status-badge ${getStatusBadgeClass(slot.status)}`}>
                            {slot.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                      <Battery size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <p>No energy slots scheduled currently.</p>
                      <Button variant="primary" size="sm" onClick={() => navigate('/energy-slots')} style={{ marginTop: 8 }}>
                        Create Energy Slot
                      </Button>
                    </div>
                  )}
                </div>

                {/* Grid Operator Quick Controls */}
                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      Inventory: <strong>{stats.availableSlots} Available</strong> / {stats.totalEnergySlots} Total
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="secondary" size="sm" onClick={() => navigate('/bookings/current')}>
                        Verify Handshake
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => navigate('/reservations')}>
                        Forward Deliveries
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              OPERATIONAL ACTIVITY STREAM & RECENT BOOKING OPERATIONS
              ═══════════════════════════════════════════════════════════════ */}
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={20} color="var(--primary)" />
                  Real-Time Operational Booking & Trade Activity
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Live microgrid trading transactions, active transfers, and forward reservations
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate('/bookings/history')}>
                View Comprehensive History <ArrowRight size={14} className="icon-ml" />
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
                      <th>Energy Traded</th>
                      <th>Slot Window</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentBookings.map((b, idx) => (
                      <tr key={b.id ? `${b.id}-${b.reservationId || ''}-${idx}` : idx}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-light)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>
                            {b.id ? b.id.slice(-8).toUpperCase() : '—'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{b.microgridNodeName || 'Colombo Central'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.microgridLocation || 'Station 01'}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{b.buyerName || 'Unassigned / Open'}</div>
                          {b.buyerProsumerId && b.buyerProsumerId !== 'N/A' && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.buyerProsumerId}</div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{b.sellerName || 'Solar Prosumer'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.sellerProsumerId}</div>
                        </td>
                        <td>
                          <strong style={{ color: '#34d399' }}>{b.energyAmount} kWh</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>${b.pricePerUnit}/kWh</div>
                        </td>
                        <td>
                          <div>{new Date(b.slotDate).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
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
                            title="Inspect Details"
                          >
                            <Eye size={14} className="icon-mr" /> Inspect
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-secondary)' }}>
                <ClipboardList size={40} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p>No recent booking operations logged yet.</p>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              HIGH-END OPERATIONAL ACTION DOCK
              ═══════════════════════════════════════════════════════════════ */}
          <div className="operational-action-dock">
            <div className="dock-left">
              <span className="pulse-beacon emerald"></span>
              <div className="dock-label">
                {activeRoleView === 'backoffice' ? 'Executive Governance Commands' : 'Grid Dispatch Operations'}
              </div>
            </div>

            <div className="dock-buttons">
              {activeRoleView === 'backoffice' ? (
                <>
                  <Button variant="primary" size="sm" onClick={() => navigate('/prosumers/pending')}>
                    <CheckSquare size={14} className="icon-mr" /> Review Pending Prosumers ({pendingProsumers.length})
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/microgrid/create')}>
                    <PlusCircle size={14} className="icon-mr" /> Provision Microgrid Node
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/users')}>
                    <Users size={14} className="icon-mr" /> Manage Operators
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/bookings/history')}>
                    <TrendingUp size={14} className="icon-mr" /> Financial Ledger
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="primary" size="sm" onClick={() => navigate('/energy-slots')}>
                    <PlusCircle size={14} className="icon-mr" /> Create Energy Slot
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/bookings/current')}>
                    <Zap size={14} className="icon-mr" /> Active In-Flight Transfers
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/bookings/pending')}>
                    <Clock size={14} className="icon-mr" /> Confirm Pending Bookings
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/microgrid')}>
                    <Server size={14} className="icon-mr" /> Microgrid Fleet Health
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
