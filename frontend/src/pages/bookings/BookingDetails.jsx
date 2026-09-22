import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';
import Button from '../../components/Button';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingService.getById(id)
      .then((res) => setBooking(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-container"><div className="loading-container"><div className="spinner"></div></div></div>;
  if (!booking) return <div className="page-container"><div className="empty-state"><div className="empty-state-text">Booking not found</div></div></div>;

  return (
    <div className="page-container">
      <div className="page-header"><h1 className="page-title">Booking Details</h1></div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div><span className="form-label">Energy Amount</span><p>{booking.energyAmount} kWh</p></div>
          <div><span className="form-label">Price Per Unit</span><p>${booking.pricePerUnit}</p></div>
          <div><span className="form-label">Slot Date</span><p>{new Date(booking.slotDate).toLocaleDateString()}</p></div>
          <div><span className="form-label">Time</span><p>{booking.startTime} – {booking.endTime}</p></div>
          <div><span className="form-label">Status</span><p><span className={`status-badge status-${booking.status?.toLowerCase()}`}>{booking.status}</span></p></div>
        </div>
        <div className="btn-group" style={{ marginTop: 24 }}>
          <Button variant="secondary" onClick={() => navigate(-1)}>← Back</Button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
