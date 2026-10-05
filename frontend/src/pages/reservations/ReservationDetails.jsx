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
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  Phone,
  Mail,
  Layers,
  Check,
  CheckCheck,
  Pencil
} from 'lucide-react';
import {
  reservationService,
  prosumerService,
  microgridService,
  energySlotService
} from '../../services/api';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';

const ReservationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Modal State
  const [editModal, setEditModal] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    fetchReservationDetails();
  }, [id]);

  const fetchReservationDetails = async () => {
    setLoading(true);
    try {
      // Try rich details endpoint first
      let data = null;
      try {
        const res = await reservationService.getDetails(id);
        data = res.data;
      } catch {
        // Fallback to basic getById if getDetails is not supported
        const basicRes = await reservationService.getById(id);
        data = basicRes.data;
      }

      // If missing nested prosumer/slot info, augment concurrently
      if (data && (!data.buyerName || !data.microgridNodeName)) {
        const promises = [];
        if (data.energySlotId && !data.slotDate) {
          promises.push(
            energySlotService.getById(data.energySlotId)
              .then((r) => {
                data.slotDate = r.data.slotDate;
                data.startTime = r.data.startTime;
                data.endTime = r.data.endTime;
                data.pricePerUnit = r.data.pricePerUnit;
              })
              .catch(() => {})
          );
        }
        if (data.buyerProsumerId && !data.buyerName) {
          promises.push(
            prosumerService.getById(data.buyerProsumerId)
              .then((r) => {
                data.buyerName = r.data.name;
                data.buyerEmail = r.data.email;
                data.buyerPhone = r.data.phone;
              })
              .catch(() => {})
          );
        }
        if (data.sellerProsumerId && !data.sellerName) {
          promises.push(
            prosumerService.getById(data.sellerProsumerId)
              .then((r) => {
                data.sellerName = r.data.name;
                data.sellerEmail = r.data.email;
                data.sellerPhone = r.data.phone;
                data.sellerSolarCapacity = r.data.solarCapacity;
              })
              .catch(() => {})
          );
        }
        if (data.microgridNodeId && !data.microgridNodeName) {
          promises.push(
            microgridService.getById(data.microgridNodeId)
              .then((r) => {
                data.microgridNodeName = r.data.nodeName;
                data.microgridLocation = r.data.location;
              })
              .catch(() => {})
          );
        }
        await Promise.allSettled(promises);
      }

      setDetails(data);
      if (data) {
        setEditAmount(data.energyAmount || '');
        setEditNotes(data.notes || '');
      }
    } catch {
      setAlert({ type: 'error', message: 'Failed to retrieve reservation details.' });
    } finally {
      setLoading(false);
    }
  };

  // 12-Hour Cancellation & Update Notice Calculation
  const calculateNoticeStatus = () => {
    if (!details) return null;

    if (details.canModifyOrCancel !== undefined) {
      const hours = details.hoursUntilSlot !== undefined ? details.hoursUntilSlot : 0;
      return {
        canModify: details.canModifyOrCancel,
        hours: hours > 0 ? hours : 0,
        text: details.canModifyOrCancel
          ? `12-Hour Notice Window Active (${hours}h remaining)`
          : `Within 12-Hour Cutoff (${hours}h left)`,
        eligible: details.canModifyOrCancel
      };
    }

    if (!details.slotDate) return null;

    try {
      const datePart = details.slotDate.split('T')[0];
      const timePart = details.startTime ? `${details.startTime}:00` : '00:00:00';
      const slotStartTime = new Date(`${datePart}T${timePart}`);

      if (isNaN(slotStartTime.getTime())) return null;

      const now = new Date();
      const diffMs = slotStartTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      const canMod = diffHours >= 12;
      return {
        canModify: canMod,
        hours: Math.max(0, diffHours).toFixed(1),
        text: canMod
          ? `12-Hour Notice Window Active (${diffHours.toFixed(1)}h remaining)`
          : `Within 12-Hour Cutoff (${Math.max(0, diffHours).toFixed(1)}h left)`,
        eligible: canMod
      };
    } catch {
      return null;
    }
  };

  const noticeInfo = calculateNoticeStatus();

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await reservationService.confirm(id);
      toast.confirm('Reservation confirmed and approved successfully!', 'Confirmed');
      setAlert({ type: 'success', message: 'Reservation confirmed successfully!' });
      await fetchReservationDetails();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to confirm reservation.';
      toast.error(errMsg, 'Confirmation Error');
      setAlert({ type: 'error', message: errMsg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await reservationService.complete(id);
      toast.success('Reservation marked as Completed. Energy transfer finalized.', 'Transfer Completed');
      setAlert({ type: 'success', message: 'Reservation marked as Completed!' });
      await fetchReservationDetails();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to complete reservation.';
      toast.error(errMsg, 'Completion Error');
      setAlert({ type: 'error', message: errMsg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    setEditLoading(true);
    try {
      await reservationService.update(id, {
        energyAmount: parseFloat(editAmount) || 0,
        notes: editNotes,
      });
      setEditModal(false);
      toast.confirm('Reservation parameters updated successfully!', 'Updated');
      setAlert({ type: 'success', message: 'Reservation updated successfully!' });
      await fetchReservationDetails();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update reservation.';
      if (errMsg.toLowerCase().includes('notice') || errMsg.toLowerCase().includes('hour') || errMsg.toLowerCase().includes('12')) {
        toast.cancellationNotice(errMsg);
      } else {
        toast.error(errMsg, 'Update Failed');
      }
      setAlert({ type: 'error', message: errMsg });
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await reservationService.cancel(id);
      setCancelModalOpen(false);
      toast.cancellation('Reservation cancelled successfully. Allocated slot released back to market.', 'Reservation Cancelled');
      setAlert({ type: 'success', message: 'Reservation cancelled successfully. Allocated slot released.' });
      await fetchReservationDetails();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to cancel reservation.';
      if (errMsg.toLowerCase().includes('notice') || errMsg.toLowerCase().includes('hour') || errMsg.toLowerCase().includes('12')) {
        toast.cancellationNotice(errMsg);
      } else {
        toast.error(errMsg, 'Cancellation Rejected');
      }
      setAlert({ type: 'error', message: errMsg });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      Pending: 'status-pending',
      Confirmed: 'status-active',
      Completed: 'status-completed',
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
          <span className="loading-text">Loading reservation intelligence...</span>
        </div>
      </div>
    );
  }

  if (!details) {
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
      <div className="page-header-actions" style={{ alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 className="page-title" style={{ margin: 0 }}>Reservation Details</h1>
            {getStatusBadge(details.status)}
          </div>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <span>ID:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-color, var(--primary))' }}>{details.id}</span>
          </p>
        </div>

        <div className="btn-group">
          <Button variant="secondary" onClick={() => navigate('/reservations')}>
            <ArrowLeft size={16} className="icon-mr" /> Back
          </Button>

          {details.status === 'Pending' && (
            <Button variant="success" onClick={handleConfirm} disabled={actionLoading}>
              <CheckCircle size={16} className="icon-mr" /> Approve & Confirm
            </Button>
          )}

          {details.status === 'Confirmed' && (
            <Button variant="primary" onClick={handleComplete} disabled={actionLoading}>
              <CheckCheck size={16} className="icon-mr" /> Mark Completed
            </Button>
          )}

          {(details.status === 'Pending' || details.status === 'Confirmed') && (
            <>
              {noticeInfo?.canModify && (
                <Button variant="secondary" onClick={() => setEditModal(true)}>
                  <Pencil size={16} className="icon-mr" /> Update
                </Button>
              )}
              <Button variant="danger" onClick={() => setCancelModalOpen(true)} disabled={actionLoading}>
                <XCircle size={16} className="icon-mr" /> Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {alert.type === 'success' ? (
            <CheckCircle size={18} color="var(--success)" />
          ) : (
            <AlertTriangle size={18} color="var(--danger)" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      {/* 12-Hour Notice Status Banner */}
      {noticeInfo && (
        <div className="card" style={{ marginBottom: 24, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: noticeInfo.eligible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: noticeInfo.eligible ? 'var(--success)' : 'var(--danger)'
            }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                12-Hour Notice Window: {noticeInfo.eligible ? 'Active & Modifiable' : 'Locked'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {noticeInfo.hours > 0 ? (
                  <>Slot begins in <strong>{noticeInfo.hours} hours</strong>. (Requires at least 12h advance notice to modify or cancel).</>
                ) : (
                  <>Scheduled slot window has commenced or concluded.</>
                )}
              </div>
            </div>
          </div>

          <div>
            {noticeInfo.eligible ? (
              <span className="status-badge status-active">Eligible for Changes</span>
            ) : (
              <span className="status-badge status-inactive">Changes Locked (&lt; 12h)</span>
            )}
          </div>
        </div>
      )}

      {/* 360 Information View Cards */}
      <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Card 1: Prosumer Participants */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} color="var(--primary)" /> Trading Prosumers
          </h3>
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#60a5fa', fontWeight: 700 }}>Buyer (Purchaser)</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 4 }}>{details.buyerName || 'Unknown Buyer'}</div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>NIC: {details.buyerProsumerId || '-'}</div>
              {details.buyerEmail && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span>{details.buyerEmail}</span>
                  {details.buyerPhone && <span>• {details.buyerPhone}</span>}
                </div>
              )}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700 }}>Seller (Generator)</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 4 }}>{details.sellerName || 'Unknown Seller'}</div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>NIC: {details.sellerProsumerId || '-'}</div>
              {details.sellerEmail && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span>{details.sellerEmail}</span>
                  {details.sellerPhone && <span>• {details.sellerPhone}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Microgrid Node & Energy Slot */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color="var(--accent)" /> Microgrid Node & Energy Slot
          </h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Microgrid Node</span>
              <p style={{ margin: 0, fontWeight: 600 }}>{details.microgridNodeName || 'Assigned Node'} {details.microgridLocation ? `(${details.microgridLocation})` : ''}</p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Slot Scheduled Date</span>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="var(--text-muted)" /> {details.slotDate ? new Date(details.slotDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Transfer Window</span>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="var(--text-muted)" /> {details.startTime || '-'} - {details.endTime || '-'}
              </p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Tariff Rate</span>
              <p style={{ margin: 0, fontWeight: 600 }}>${details.pricePerUnit || 0} per kWh</p>
            </div>
          </div>
        </div>

        {/* Card 3: Energy & Financial Summary */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="var(--primary)" /> Financial & Energy Summary
          </h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Reserved Energy</span>
              <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                {details.energyAmount} kWh
              </p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Total Transaction Cost</span>
              <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>
                ${typeof details.totalPrice === 'number' ? details.totalPrice.toFixed(2) : details.totalPrice}
              </p>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Reserved At</span>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>{details.reservedAt ? new Date(details.reservedAt).toLocaleString() : 'N/A'}</p>
            </div>
            {details.notes && (
              <div>
                <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Reservation Notes</span>
                <p style={{ margin: 0, fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>"{details.notes}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operational Audit & Notes Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          <FileText size={20} color="var(--text-muted)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Operational Audit & Metadata</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div>
            <span className="form-label">Reservation Record ID</span>
            <p style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{details.id}</p>
          </div>
          <div>
            <span className="form-label">Energy Slot Reference</span>
            <p style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{details.energySlotId || '-'}</p>
          </div>
          <div>
            <span className="form-label">Microgrid Node ID</span>
            <p style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{details.microgridNodeId || '-'}</p>
          </div>
        </div>
        <div>
          <span className="form-label">Operational Notes</span>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <p style={{ margin: 0, color: details.notes ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: details.notes ? 'normal' : 'italic' }}>
              {details.notes || 'No special operational notes recorded for this transaction.'}
            </p>
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
              className="form-control"
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
              className="form-control"
              rows="3"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
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
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Are you sure you want to cancel this reservation for <strong>{details.energyAmount} kWh</strong>?
        </p>

        {noticeInfo && !noticeInfo.eligible && (
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
