import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, DollarSign, Calendar, Clock, Layers, User } from 'lucide-react';
import { bookingService, microgridService, prosumerService } from '../../services/api';
import Button from '../../components/Button';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [node, setNode] = useState(null);
  const [prosumer, setProsumer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingService.getById(id)
      .then(async (res) => {
        const b = res.data;
        setBooking(b);
        if (b.microgridNodeId) {
          microgridService.getById(b.microgridNodeId)
            .then((nr) => setNode(nr.data))
            .catch(() => {});
        }
        if (b.prosumerId) {
          prosumerService.getById(b.prosumerId)
            .then((pr) => setProsumer(pr.data))
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

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
          <div className="empty-state-text">Booking record not found</div>
          <div style={{ marginTop: 16 }}>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} className="icon-mr" /> Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusClass = (status) => {
    const map = { Booked: 'status-booked', Pending: 'status-pending', Completed: 'status-completed', Cancelled: 'status-cancelled' };
    return map[status] || '';
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 20 }}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="icon-mr" /> Back
        </Button>
      </div>

      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            Booking #{booking.id?.slice(-8) || booking.id}
          </h1>
          <span className={`status-badge ${getStatusClass(booking.status)}`}>
            {booking.status}
          </span>
        </div>
        <p className="page-subtitle">Energy slot booking details and operational parameters</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Energy & Financials Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <Zap size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Energy & Schedule</h3>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="form-label" style={{ margin: 0 }}>Energy Amount</span>
              <strong style={{ color: 'var(--accent-light)', fontSize: '1.1rem' }}>{booking.energyAmount} kWh</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="form-label" style={{ margin: 0 }}>Price Per Unit</span>
              <strong style={{ color: 'var(--primary-light)', fontSize: '1.1rem' }}>${booking.pricePerUnit} / kWh</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="form-label" style={{ margin: 0 }}>Slot Date</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} color="var(--text-muted)" />
                {new Date(booking.slotDate).toLocaleDateString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="form-label" style={{ margin: 0 }}>Time Interval</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} color="var(--text-muted)" />
                {booking.startTime} – {booking.endTime}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Node & Prosumer Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <Layers size={20} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Microgrid Infrastructure</h3>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="form-label" style={{ margin: 0 }}>Substation Node</span>
              <strong>{node ? node.nodeName : (booking.microgridNodeId ? `#${booking.microgridNodeId.slice(-6)}` : '—')}</strong>
            </div>
            {node && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="form-label" style={{ margin: 0 }}>Node Location</span>
                <span>{node.location}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="form-label" style={{ margin: 0 }}>Allocated Prosumer</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <User size={13} color="var(--text-muted)" />
                {prosumer ? prosumer.name : (booking.prosumerId ? `#${booking.prosumerId.slice(-6)}` : '—')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
