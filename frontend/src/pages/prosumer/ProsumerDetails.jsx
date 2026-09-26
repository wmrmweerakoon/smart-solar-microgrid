import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Pencil, 
  CheckCircle, 
  PowerOff, 
  ShieldCheck, 
  Zap, 
  Clock, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { prosumerService } from '../../services/api';
import { getRole } from '../../utils/auth';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const ProsumerDetails = () => {
  const { id } = useParams(); // NIC or ID
  const navigate = useNavigate();
  const userRole = getRole();
  const isBackoffice = userRole === 'Backoffice';

  const [prosumer, setProsumer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  
  // Deactivate modal
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateError, setDeactivateError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await prosumerService.getDetails(id);
      setProsumer(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to retrieve prosumer details.' });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      await prosumerService.activate(prosumer.nic || prosumer.id);
      setAlert({ type: 'success', message: 'Prosumer account activated successfully!' });
      await fetchDetails();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to activate prosumer.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setActionLoading(true);
    try {
      await prosumerService.deactivate(prosumer.nic || prosumer.id, deactivateReason);
      setAlert({ type: 'success', message: 'Prosumer account deactivated.' });
      setDeactivateModal(false);
      setDeactivateReason('');
      setDeactivateError('');
      await fetchDetails();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to deactivate prosumer.';
      setDeactivateError(msg);
      setAlert({ type: 'error', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      Active: 'status-active',
      Pending: 'status-pending',
      Inactive: 'status-inactive'
    };
    return (
      <span className={`status-badge ${map[status] || ''}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Loading prosumer profile...</span>
        </div>
      </div>
    );
  }

  if (!prosumer) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-text">Prosumer Not Found</div>
          <div className="empty-state-subtext">The prosumer with NIC "{id}" does not exist.</div>
          <Button variant="secondary" onClick={() => navigate('/prosumers')} style={{ marginTop: 16 }}>
            <ArrowLeft size={16} className="icon-mr" /> Back to Prosumers
          </Button>
        </div>
      </div>
    );
  }

  const nic = prosumer.nic || prosumer.id;

  return (
    <div className="page-container">
      {/* Header and Quick Actions */}
      <div className="page-header-actions" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 className="page-title" style={{ margin: 0 }}>{prosumer.name}</h1>
            {getStatusBadge(prosumer.status)}
          </div>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>NIC:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-color)' }}>{nic}</span>
          </p>
        </div>

        <div className="btn-group">
          <Button variant="secondary" onClick={() => navigate('/prosumers')}>
            <ArrowLeft size={16} className="icon-mr" /> Back
          </Button>

          <Button variant="secondary" onClick={() => navigate(`/prosumers/edit/${nic}`)}>
            <Pencil size={16} className="icon-mr" /> Edit Profile
          </Button>

          {prosumer.status === 'Active' ? (
            <Button
              variant="danger"
              onClick={() => setDeactivateModal(true)}
            >
              <PowerOff size={16} className="icon-mr" /> Deactivate Account
            </Button>
          ) : isBackoffice ? (
            <Button
              variant="success"
              loading={actionLoading}
              onClick={handleActivate}
            >
              <CheckCircle size={16} className="icon-mr" /> Activate Account
            </Button>
          ) : null}
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Grid of Profile Cards */}
      <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        
        {/* Personal & Contact Details */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <ShieldCheck size={18} color="var(--primary-color)" /> Personal & Contact Info
          </h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>National Identity Card (NIC)</span>
              <p style={{ fontFamily: 'monospace', fontWeight: 700, margin: 0 }}>{nic}</p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Full Name</span>
              <p style={{ margin: 0, fontWeight: 500 }}>{prosumer.name}</p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Email Address</span>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} color="var(--text-secondary)" /> {prosumer.email}
              </p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Phone Number</span>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={14} color="var(--text-secondary)" /> {prosumer.phone || '—'}
              </p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Property Address</span>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color="var(--text-secondary)" /> {prosumer.address || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Microgrid & Energy Profile */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <Zap size={18} color="var(--primary-color)" /> Solar & Grid Allocation
          </h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Installed Solar Capacity</span>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                {prosumer.solarCapacity} kW
              </p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Assigned Microgrid Node</span>
              <p style={{ margin: 0, fontWeight: 500 }}>
                {prosumer.microgridNodeName ? `${prosumer.microgridNodeName} (${prosumer.microgridLocation})` : 'Unassigned'}
              </p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Active Reservations</span>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {prosumer.activeReservationsCount} active / {prosumer.totalReservationsCount} total
              </p>
            </div>
          </div>
        </div>

        {/* Registration & Audit Timeline */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <Clock size={18} color="var(--primary-color)" /> Registration & Audit Trail
          </h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Profile Created</span>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {new Date(prosumer.createdAt).toLocaleString()}
              </p>
            </div>
            {prosumer.activatedBy && (
              <div>
                <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Activated By</span>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--success-color, #10b981)' }}>
                  {prosumer.activatedBy} {prosumer.activatedAt && `on ${new Date(prosumer.activatedAt).toLocaleString()}`}
                </p>
              </div>
            )}
            {prosumer.deactivatedAt && (
              <div>
                <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Deactivation Record</span>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--danger-color, #ef4444)' }}>
                  Deactivated on {new Date(prosumer.deactivatedAt).toLocaleString()}
                </p>
                {prosumer.deactivationReason && (
                  <p style={{ margin: '4px 0 0', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Reason: "{prosumer.deactivationReason}"
                  </p>
                )}
              </div>
            )}
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Last Updated</span>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {new Date(prosumer.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Associated Energy Reservations */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} color="var(--primary-color)" /> Related Energy Reservations
        </h3>
        
        {prosumer.recentReservations && prosumer.recentReservations.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reservation ID</th>
                  <th>Role</th>
                  <th>Amount (kWh)</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Reserved At</th>
                </tr>
              </thead>
              <tbody>
                {prosumer.recentReservations.map((res) => {
                  const isBuyer = res.buyerProsumerId === nic;
                  return (
                    <tr key={res.id}>
                      <td style={{ fontFamily: 'monospace' }}>{res.id}</td>
                      <td>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: 4, 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          background: isBuyer ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: isBuyer ? '#60a5fa' : '#34d399'
                        }}>
                          {isBuyer ? 'Buyer' : 'Seller'}
                        </span>
                      </td>
                      <td>{res.energyAmount} kWh</td>
                      <td>${res.totalPrice}</td>
                      <td>
                        <span className={`status-badge status-${res.status?.toLowerCase()}`}>
                          {res.status}
                        </span>
                      </td>
                      <td>{new Date(res.reservedAt).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            No energy reservations recorded for this prosumer yet.
          </p>
        )}
      </div>

      {/* Deactivate Modal */}
      <Modal
        isOpen={deactivateModal}
        onClose={() => { setDeactivateModal(false); setDeactivateError(''); }}
        title="Confirm Account Deactivation"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setDeactivateModal(false); setDeactivateError(''); }}>
              Cancel
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={handleDeactivate}>
              Confirm Deactivation
            </Button>
          </>
        }
      >
        <p style={{ marginBottom: 12 }}>
          Are you sure you want to deactivate the account for <strong>{prosumer.name}</strong> (NIC: {nic})?
        </p>

        {deactivateError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10, color: '#fca5a5' }}>
            <AlertTriangle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ display: 'block', color: '#f87171', marginBottom: 2 }}>Deactivation Blocked</strong>
              <span style={{ fontSize: '0.88rem' }}>{deactivateError}</span>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Deactivation Reason</label>
          <textarea
            className="form-input"
            rows="3"
            placeholder="State the reason for deactivation..."
            value={deactivateReason}
            onChange={(e) => { setDeactivateReason(e.target.value); setDeactivateError(''); }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ProsumerDetails;
