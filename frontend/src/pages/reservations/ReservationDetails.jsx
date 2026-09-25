import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Zap,
  DollarSign,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  Phone,
  Mail,
  Activity,
  Layers,
  Check,
  CheckCheck
} from 'lucide-react';
import {
  reservationService,
  prosumerService,
  microgridService,
  energySlotService
} from '../../services/api';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const ReservationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [slot, setSlot] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [seller, setSeller] = useState(null);
  const [node, setNode] = useState(null);

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    fetchReservationDetails();
  }, [id]);

  const fetchReservationDetails = async () => {
    setLoading(true);
    try {
      const resRes = await reservationService.getById(id);
      const resData = resRes.data;
      setReservation(resData);

      // Concurrently fetch related entities
      const promises = [];

      if (resData.energySlotId) {
        promises.push(
          energySlotService.getById(resData.energySlotId)
            .then((r) => setSlot(r.data))
            .catch(() => setSlot(null))
        );
      }

      if (resData.buyerProsumerId) {
        promises.push(
          prosumerService.getById(resData.buyerProsumerId)
            .then((r) => setBuyer(r.data))
            .catch(() => setBuyer(null))
        );
      }

      if (resData.sellerProsumerId) {
        promises.push(
          prosumerService.getById(resData.sellerProsumerId)
            .then((r) => setSeller(r.data))
            .catch(() => setSeller(null))
        );
      }

      if (resData.microgridNodeId) {
        promises.push(
          microgridService.getById(resData.microgridNodeId)
            .then((r) => setNode(r.data))
            .catch(() => setNode(null))
        );
      }

      await Promise.allSettled(promises);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load complete reservation records.' });
    } finally {
      setLoading(false);
    }
  };

  // 12-Hour Cancellation & Update Notice Calculation
  const calculateNoticeStatus = () => {
    if (!slot || !slot.slotDate) return null;

    try {
      const datePart = slot.slotDate.split('T')[0];
      const timePart = slot.startTime ? `${slot.startTime}:00` : '00:00:00';
      const slotStartTime = new Date(`${datePart}T${timePart}`);

      if (isNaN(slotStartTime.getTime())) return null;

      const now = new Date();
      const diffMs = slotStartTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 0) {
        return {
          status: 'concluded',
          text: 'Slot Schedule Concluded',
          hours: Math.abs(diffHours).toFixed(1),
          canCancel: false,
        };
      } else if (diffHours >= 12) {
        return {
          status: 'eligible',
          text: `12-Hour Notice Window Active (${diffHours.toFixed(1)} hrs remaining)`,
          hours: diffHours.toFixed(1),
          canCancel: true,
        };
      } else {
        return {
          status: 'restricted',
          text: `Within 12-Hour Cutoff (${diffHours.toFixed(1)} hrs left)`,
          hours: diffHours.toFixed(1),
          canCancel: false,
        };
      }
    } catch {
      return null;
    }
  };

  const noticeInfo = calculateNoticeStatus();

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await reservationService.confirm(id);
      setAlert({ type: 'success', message: 'Reservation confirmed successfully!' });
      await fetchReservationDetails();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to confirm reservation.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await reservationService.complete(id);
      setAlert({ type: 'success', message: 'Reservation marked as completed!' });
      await fetchReservationDetails();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to complete reservation.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await reservationService.cancel(id);
      setCancelModalOpen(false);
      setAlert({ type: 'success', message: 'Reservation cancelled successfully. Allocated slot released.' });
      await fetchReservationDetails();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to cancel reservation.' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusClass = (status) => {
    const map = {
      Pending: 'status-pending',
      Confirmed: 'status-confirmed',
      Cancelled: 'status-cancelled',
      Completed: 'status-completed',
    };
    return map[status] || '';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Loading reservation intelligence...</span>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">
            <AlertCircle size={48} color="var(--danger)" />
          </div>
          <div className="empty-state-text">Reservation Record Not Found</div>
          <div className="empty-state-subtext">The requested reservation ID does not exist or has been removed.</div>
          <div style={{ marginTop: 20 }}>
            <Button variant="secondary" onClick={() => navigate('/reservations')}>
              <ArrowLeft size={16} className="icon-mr" /> Back to Reservations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Top Navigation & Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <Button variant="secondary" onClick={() => navigate('/reservations')}>
          <ArrowLeft size={16} className="icon-mr" /> Back to Reservations
        </Button>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {reservation.status === 'Pending' && (
            <Button
              variant="success"
              onClick={handleConfirm}
              disabled={actionLoading}
            >
              <Check size={16} className="icon-mr" /> Confirm Reservation
            </Button>
          )}

          {reservation.status === 'Confirmed' && (
            <Button
              variant="primary"
              onClick={handleComplete}
              disabled={actionLoading}
            >
              <CheckCheck size={16} className="icon-mr" /> Mark Completed
            </Button>
          )}

          {(reservation.status === 'Pending' || reservation.status === 'Confirmed') && (
            <Button
              variant="danger"
              onClick={() => setCancelModalOpen(true)}
              disabled={actionLoading}
            >
              <XCircle size={16} className="icon-mr" /> Cancel Reservation
            </Button>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? (
            <CheckCircle size={16} className="icon-mr" />
          ) : (
            <AlertCircle size={16} className="icon-mr" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Main Reservation Overview Header Card */}
      <div className="card" style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem' }}>
                Reservation #{reservation.id?.slice(-8) || reservation.id}
              </h1>
              <span className={`status-badge ${getStatusClass(reservation.status)}`}>
                {reservation.status}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Created on {new Date(reservation.reservedAt).toLocaleString()} • System Ref: {reservation.id}
            </p>
          </div>

          {/* 12-Hour Cancellation Notice Window Status */}
          {noticeInfo && (
            <div
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.85rem',
                fontWeight: 600,
                background:
                  noticeInfo.status === 'eligible'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : noticeInfo.status === 'restricted'
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(100, 116, 139, 0.12)',
                border: `1px solid ${
                  noticeInfo.status === 'eligible'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : noticeInfo.status === 'restricted'
                    ? 'rgba(245, 158, 11, 0.3)'
                    : 'rgba(100, 116, 139, 0.3)'
                }`,
                color:
                  noticeInfo.status === 'eligible'
                    ? 'var(--success)'
                    : noticeInfo.status === 'restricted'
                    ? 'var(--warning)'
                    : 'var(--text-muted)',
              }}
            >
              <Clock size={16} />
              <div>
                <div>{noticeInfo.text}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.9 }}>
                  {noticeInfo.canCancel
                    ? 'Eligible for standard prosumer cancellation'
                    : 'Subject to 12-hour administrative cancellation rule'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: 360 Information View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Card 1: Energy & Financials */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <Zap size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Energy & Financials</h3>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="form-label" style={{ margin: 0 }}>Energy Volume</span>
              <strong style={{ color: 'var(--accent-light)', fontSize: '1.1rem' }}>
                {reservation.energyAmount} kWh
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="form-label" style={{ margin: 0 }}>Total Transaction</span>
              <strong style={{ color: 'var(--primary-light)', fontSize: '1.1rem' }}>
                ${typeof reservation.totalPrice === 'number' ? reservation.totalPrice.toFixed(2) : reservation.totalPrice}
              </strong>
            </div>
            {slot && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="form-label" style={{ margin: 0 }}>Unit Tariff</span>
                  <span>${slot.pricePerUnit} / kWh</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="form-label" style={{ margin: 0 }}>Scheduled Date</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={13} color="var(--text-muted)" />
                    {new Date(slot.slotDate).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="form-label" style={{ margin: 0 }}>Time Window</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} color="var(--text-muted)" />
                    {slot.startTime} – {slot.endTime}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Microgrid Node Infrastructure */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <Layers size={20} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Microgrid Node</h3>
          </div>
          {node ? (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="form-label" style={{ margin: 0 }}>Node Name</span>
                <strong>{node.nodeName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="form-label" style={{ margin: 0 }}>Location</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} color="var(--text-muted)" />
                  {node.location}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="form-label" style={{ margin: 0 }}>Grid Capacity</span>
                <span>{node.capacity} kW</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="form-label" style={{ margin: 0 }}>Operational Status</span>
                <span className={`status-badge status-${node.status?.toLowerCase()}`}>
                  {node.status}
                </span>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Microgrid Node ID: {reservation.microgridNodeId || 'Not linked'}
            </p>
          )}
        </div>
      </div>

      {/* Grid: Prosumers Involved */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Buyer Prosumer */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <User size={20} color="var(--info)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Buyer Prosumer</h3>
          </div>
          {buyer ? (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="form-label" style={{ margin: 0 }}>Full Name</span>
                <strong>{buyer.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="form-label" style={{ margin: 0 }}>Email</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={13} color="var(--text-muted)" />
                  {buyer.email}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="form-label" style={{ margin: 0 }}>Phone</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={13} color="var(--text-muted)" />
                  {buyer.phone}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="form-label" style={{ margin: 0 }}>Address</span>
                <span>{buyer.address || '—'}</span>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Prosumer ID: {reservation.buyerProsumerId || 'Unknown'}
            </p>
          )}
        </div>

        {/* Seller Prosumer */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <User size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Seller Prosumer</h3>
          </div>
          {seller ? (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="form-label" style={{ margin: 0 }}>Full Name</span>
                <strong>{seller.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="form-label" style={{ margin: 0 }}>Email</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={13} color="var(--text-muted)" />
                  {seller.email}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="form-label" style={{ margin: 0 }}>Solar Capacity</span>
                <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
                  {seller.solarCapacity} kW
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="form-label" style={{ margin: 0 }}>Phone</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={13} color="var(--text-muted)" />
                  {seller.phone}
                </span>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Prosumer ID: {reservation.sellerProsumerId || 'Unknown'}
            </p>
          )}
        </div>
      </div>

      {/* Operational Audit & Notes Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          <FileText size={20} color="var(--text-secondary)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Operational Audit & Notes</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div>
            <span className="form-label">Reserved At</span>
            <p>{new Date(reservation.reservedAt).toLocaleString()}</p>
          </div>
          <div>
            <span className="form-label">Last Updated</span>
            <p>{new Date(reservation.updatedAt).toLocaleString()}</p>
          </div>
          <div>
            <span className="form-label">Energy Slot Reference</span>
            <p style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{reservation.energySlotId || '—'}</p>
          </div>
        </div>
        <div>
          <span className="form-label">Operational Notes</span>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <p style={{ margin: 0, color: reservation.notes ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: reservation.notes ? 'normal' : 'italic' }}>
              {reservation.notes || 'No special operational notes recorded for this transaction.'}
            </p>
          </div>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Confirm Reservation Cancellation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>
              Keep Reservation
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={actionLoading}>
              {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to cancel this reservation for <strong>{reservation.energyAmount} kWh</strong>?
        </p>

        {noticeInfo && !noticeInfo.canCancel && (
          <div style={{ marginTop: 12, padding: 12, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--warning)', margin: 0, fontWeight: 500 }}>
              Warning: This reservation is within the 12-hour cutoff window ({noticeInfo.hours} hours remaining). Late cancellations may impact prosumer reliability scores.
            </p>
          </div>
        )}

        <div style={{ marginTop: 12, padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--danger)', margin: 0 }}>
            Upon cancellation, the reserved slot will be released back to the market as Available.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ReservationDetails;
