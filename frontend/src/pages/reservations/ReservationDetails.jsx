import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  CheckCheck, 
  XCircle, 
  Pencil, 
  Clock, 
  Zap, 
  Calendar, 
  AlertTriangle, 
  DollarSign, 
  User, 
  MapPin, 
  FileText 
} from 'lucide-react';
import { reservationService } from '../../services/api';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const ReservationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Edit Modal
  const [editModal, setEditModal] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Cancel Modal
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await reservationService.getDetails(id);
      setDetails(res.data);
      setEditAmount(res.data.energyAmount);
      setEditNotes(res.data.notes || '');
    } catch {
      setAlert({ type: 'error', message: 'Failed to retrieve reservation details.' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      await reservationService.confirm(id);
      await fetchDetails();
      setAlert({ type: 'success', message: 'Reservation confirmed successfully!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to confirm reservation.' });
    }
  };

  const handleComplete = async () => {
    try {
      await reservationService.complete(id);
      await fetchDetails();
      setAlert({ type: 'success', message: 'Reservation marked as Completed!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to complete reservation.' });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await reservationService.update(id, {
        energyAmount: parseFloat(editAmount) || 0,
        notes: editNotes,
      });
      setEditModal(false);
      await fetchDetails();
      setAlert({ type: 'success', message: 'Reservation updated successfully!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update reservation.' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await reservationService.cancel(id);
      setCancelModal(false);
      await fetchDetails();
      setAlert({ type: 'success', message: 'Reservation cancelled successfully.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Cancellation rejected.' });
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      Pending: 'status-pending',
      Confirmed: 'status-active',
      Completed: 'status-active',
      Cancelled: 'status-inactive',
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
          <span className="loading-text">Loading reservation details...</span>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-text">Reservation Not Found</div>
          <div className="empty-state-subtext">The requested energy reservation does not exist.</div>
          <Button variant="secondary" onClick={() => navigate('/reservations')} style={{ marginTop: 16 }}>
            <ArrowLeft size={16} className="icon-mr" /> Back to Reservations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-actions" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 className="page-title" style={{ margin: 0 }}>Reservation Details</h1>
            {getStatusBadge(details.status)}
          </div>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>ID:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-color)' }}>{details.id}</span>
          </p>
        </div>

        <div className="btn-group">
          <Button variant="secondary" onClick={() => navigate('/reservations')}>
            <ArrowLeft size={16} className="icon-mr" /> Back
          </Button>

          {details.status === 'Pending' && (
            <Button variant="success" onClick={handleConfirm}>
              <CheckCircle size={16} className="icon-mr" /> Approve & Confirm
            </Button>
          )}

          {details.status === 'Confirmed' && (
            <Button variant="primary" onClick={handleComplete}>
              <CheckCheck size={16} className="icon-mr" /> Mark Completed
            </Button>
          )}

          {details.canModifyOrCancel && (
            <>
              <Button variant="secondary" onClick={() => setEditModal(true)}>
                <Pencil size={16} className="icon-mr" /> Update
              </Button>
              <Button variant="danger" onClick={() => setCancelModal(true)}>
                <XCircle size={16} className="icon-mr" /> Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* 12-Hour Notice Status Banner */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: details.canModifyOrCancel ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: details.canModifyOrCancel ? 'var(--success-color, #10b981)' : 'var(--danger-color, #ef4444)'
          }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              12-Hour Notice Window: {details.canModifyOrCancel ? 'Active & Modifiable' : 'Locked'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {details.hoursUntilSlot > 0 ? (
                <>Slot begins in <strong>{details.hoursUntilSlot} hours</strong>. (Requires at least 12h notice to update or cancel).</>
              ) : (
                <>Scheduled slot window has commenced or concluded.</>
              )}
            </div>
          </div>
        </div>

        <div>
          {details.canModifyOrCancel ? (
            <span className="status-badge status-active">Eligible for Changes</span>
          ) : (
            <span className="status-badge status-inactive">Changes Locked (&lt; 12h)</span>
          )}
        </div>
      </div>

      {/* Profile & Energy Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        
        {/* Prosumer Participants */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} color="var(--primary-color)" /> Trading Prosumers
          </h3>
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#60a5fa', fontWeight: 700 }}>Buyer (Purchaser)</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 4 }}>{details.buyerName || 'Unknown'}</div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>NIC: {details.buyerProsumerId}</div>
              {details.buyerEmail && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>{details.buyerEmail} | {details.buyerPhone}</div>}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700 }}>Seller (Generator)</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 4 }}>{details.sellerName || 'Unknown'}</div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>NIC: {details.sellerProsumerId}</div>
              {details.sellerEmail && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>{details.sellerEmail} | {details.sellerPhone}</div>}
            </div>
          </div>
        </div>

        {/* Microgrid Node & Slot Details */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color="var(--primary-color)" /> Microgrid Node & Energy Slot
          </h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Microgrid Node</span>
              <p style={{ margin: 0, fontWeight: 600 }}>{details.microgridNodeName} ({details.microgridLocation})</p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Slot Scheduled Date</span>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="var(--text-secondary)" /> {new Date(details.slotDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Transfer Window</span>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="var(--text-secondary)" /> {details.startTime} – {details.endTime}
              </p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Tariff Rate</span>
              <p style={{ margin: 0, fontWeight: 600 }}>${details.pricePerUnit} per kWh</p>
            </div>
          </div>
        </div>

        {/* Energy & Financial Summary */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="var(--primary-color)" /> Financial & Energy Summary
          </h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Reserved Energy</span>
              <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                {details.energyAmount} kWh
              </p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Total Transaction Cost</span>
              <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--success-color, #10b981)' }}>
                ${details.totalPrice}
              </p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Reserved At</span>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>{new Date(details.reservedAt).toLocaleString()}</p>
            </div>
            {details.notes && (
              <div>
                <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Reservation Notes</span>
                <p style={{ margin: 0, fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{details.notes}"</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Update Energy Reservation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button variant="primary" loading={editLoading} onClick={handleUpdate}>Save Changes</Button>
          </>
        }
      >
        <form onSubmit={handleUpdate}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
            <Clock size={14} style={{ display: 'inline', marginRight: 4 }} />
            Updates require at least 12 hours' advance notice before the slot begins.
          </div>
          <div className="form-group">
            <label className="form-label">Energy Amount (kWh) *</label>
            <input
              className="form-input"
              type="number"
              step="0.1"
              min="0.1"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              rows="3"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        title="Cancel Reservation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelModal(false)}>Keep</Button>
            <Button variant="danger" loading={cancelLoading} onClick={handleCancel}>Confirm Cancellation</Button>
          </>
        }
      >
        <p>Are you sure you want to cancel this reservation? The energy slot will be released back to the market as Available.</p>
      </Modal>
    </div>
  );
};

export default ReservationDetails;
