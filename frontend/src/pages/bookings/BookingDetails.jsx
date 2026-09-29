import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Zap,
  Battery,
  Calendar,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';
import { bookingService } from '../../services/api';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';

/**
 * Booking Details operational view.
 * Provides a comprehensive, 360-degree breakdown of the booking,
 * including linked Buyer Prosumer, Seller Prosumer, Microgrid Node, and Slot parameters.
 */
const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await bookingService.getDetails(id);
      setBooking(res.data);
    } catch (err) {
      console.error('Failed to load booking details:', err);
      try {
        const fallbackRes = await bookingService.getById(id);
        setBooking(fallbackRes.data);
      } catch {
        setAlert({ type: 'error', message: 'Unable to load booking details.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await bookingService.confirm(id);
      toast.confirm('Booking confirmed and approved successfully.', 'Booking Confirmed');
      setAlert({ type: 'success', message: 'Booking confirmed and approved successfully.' });
      fetchDetails();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to confirm booking.';
      toast.error(errMsg, 'Confirmation Error');
      setAlert({ type: 'error', message: errMsg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await bookingService.complete(id);
      toast.success('Energy transfer finalized and booking marked as completed.', 'Transfer Completed');
      setAlert({ type: 'success', message: 'Booking marked as completed.' });
      fetchDetails();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to complete booking.';
      toast.error(errMsg, 'Completion Error');
      setAlert({ type: 'error', message: errMsg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await bookingService.cancel(id);
      setCancelModalOpen(false);
      toast.cancellation('Booking cancelled and allocated energy slot restored.', 'Booking Cancelled');
      setAlert({ type: 'success', message: 'Booking cancelled successfully.' });
      fetchDetails();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to cancel booking.';
      if (errMsg.toLowerCase().includes('notice') || errMsg.toLowerCase().includes('hour') || errMsg.toLowerCase().includes('24') || errMsg.toLowerCase().includes('12')) {
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
    const s = status?.toLowerCase();
    switch (s) {
      case 'booked':
        return <span className="status-badge status-booked">Booked (Active)</span>;
      case 'pending':
        return <span className="status-badge status-pending">Pending Approval</span>;
      case 'completed':
        return <span className="status-badge status-completed">Completed</span>;
      case 'cancelled':
        return <span className="status-badge status-cancelled">Cancelled</span>;
      default:
        return <span className="status-badge status-available">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Loading booking details...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-text">Booking Not Found</div>
          <p className="empty-state-subtext">The requested booking does not exist or has been removed.</p>
          <Button variant="secondary" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
            <ArrowLeft size={16} className="icon-mr" /> Return to Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} className="icon-mr" /> Back
          </Button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            Booking #{booking.id ? booking.id.slice(-8) : id.slice(-8)}
            {getStatusBadge(booking.status)}
          </h1>
          <p className="page-subtitle">Full operational summary and counterpart information</p>
        </div>

        {/* Operational Actions */}
        <div className="btn-group">
          {booking.status === 'Pending' && (
            <Button
              variant="success"
              onClick={handleConfirm}
              disabled={actionLoading}
            >
              <CheckCircle size={16} className="icon-mr" /> Confirm & Approve
            </Button>
          )}

          {booking.status === 'Booked' && (
            <Button
              variant="success"
              onClick={handleComplete}
              disabled={actionLoading}
            >
              <CheckCircle size={16} className="icon-mr" /> Mark as Completed
            </Button>
          )}

          {(booking.status === 'Booked' || booking.status === 'Pending') && (
            <Button
              variant="danger"
              onClick={() => setCancelModalOpen(true)}
              disabled={actionLoading}
            >
              <XCircle size={16} className="icon-mr" /> Cancel Booking
            </Button>
          )}
        </div>
      </div>

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

      {/* Grid of Information Cards */}
      <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Card 1: Energy & Financials */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Battery size={18} color="var(--primary)" />
            Energy & Financial Parameters
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <span className="form-label">Energy Amount</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {booking.energyAmount} kWh
              </div>
            </div>
            <div>
              <span className="form-label">Unit Price</span>
              <p style={{ fontWeight: 500 }}>${booking.pricePerUnit} per kWh</p>
            </div>
            <div>
              <span className="form-label">Total Transaction Value</span>
              <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent)' }}>
                ${booking.totalPrice?.toFixed(2) ?? ((booking.energyAmount || 0) * (booking.pricePerUnit || 0)).toFixed(2)}
              </p>
            </div>
            <div>
              <span className="form-label">Scheduled Date & Time</span>
              <p style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="var(--text-secondary)" />
                {new Date(booking.slotDate).toLocaleDateString()} ({booking.startTime} – {booking.endTime})
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Microgrid Node */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Zap size={18} color="var(--accent)" />
            Linked Microgrid Node
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <span className="form-label">Node Name</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{booking.microgridNodeName || 'Not Assigned'}</p>
            </div>
            <div>
              <span className="form-label">Location / Grid Sector</span>
              <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color="var(--text-secondary)" />
                {booking.microgridLocation || 'Unknown'}
              </p>
            </div>
            <div>
              <span className="form-label">Node Identifier</span>
              <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {booking.microgridNodeId}
              </p>
            </div>
            <div>
              <span className="form-label">Energy Slot ID</span>
              <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {booking.energySlotId || booking.id}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Buyer Prosumer Information */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <User size={18} color="var(--success)" />
            Buyer Prosumer (Claimant)
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <span className="form-label">Buyer Name</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{booking.buyerName || 'Unassigned / Open'}</p>
            </div>
            <div>
              <span className="form-label">National Identity Card (NIC)</span>
              <p style={{ fontWeight: 500, fontFamily: 'monospace' }}>
                {booking.buyerProsumerId && booking.buyerProsumerId !== 'N/A' ? booking.buyerProsumerId : 'N/A'}
              </p>
            </div>
            {booking.buyerEmail && booking.buyerEmail !== 'N/A' && (
              <div>
                <span className="form-label">Email Address</span>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} color="var(--text-secondary)" />
                  {booking.buyerEmail}
                </p>
              </div>
            )}
            {booking.buyerPhone && booking.buyerPhone !== 'N/A' && (
              <div>
                <span className="form-label">Contact Phone</span>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} color="var(--text-secondary)" />
                  {booking.buyerPhone}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Seller Prosumer Information */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <User size={18} color="var(--primary)" />
            Seller Prosumer (Supplier)
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <span className="form-label">Seller Name</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{booking.sellerName}</p>
            </div>
            <div>
              <span className="form-label">National Identity Card (NIC)</span>
              <p style={{ fontWeight: 500, fontFamily: 'monospace' }}>{booking.sellerProsumerId}</p>
            </div>
            {booking.sellerEmail && booking.sellerEmail !== 'N/A' && (
              <div>
                <span className="form-label">Email Address</span>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} color="var(--text-secondary)" />
                  {booking.sellerEmail}
                </p>
              </div>
            )}
            {booking.sellerPhone && booking.sellerPhone !== 'N/A' && (
              <div>
                <span className="form-label">Contact Phone</span>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} color="var(--text-secondary)" />
                  {booking.sellerPhone}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operational Timestamps and Notes */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <FileText size={18} color="var(--text-secondary)" />
          Operational Audit & Timestamps
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <span className="form-label">Created At</span>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}
            </p>
          </div>
          <div>
            <span className="form-label">Last Updated At</span>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : 'N/A'}
            </p>
          </div>
          <div>
            <span className="form-label">Linked Reservation ID</span>
            <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {booking.reservationId || 'None'}
            </p>
          </div>
          {booking.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <span className="form-label">Notes & Instructions</span>
              <p style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 6 }}>
                {booking.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Confirm Booking Cancellation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>
              Keep Booking
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={actionLoading}>
              {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to cancel this booking? This will terminate the scheduled energy transfer.
        </p>
      </Modal>
    </div>
  );
};

export default BookingDetails;
