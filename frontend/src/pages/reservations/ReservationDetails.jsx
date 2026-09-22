import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reservationService, prosumerService } from '../../services/api';
import Button from '../../components/Button';

const ReservationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [prosumers, setProsumers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([reservationService.getById(id), prosumerService.getAll()])
      .then(([resRes, prosRes]) => {
        setReservation(resRes.data);
        setProsumers(prosRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const findName = (pid) => prosumers.find((p) => p.id === pid)?.name || '—';

  if (loading) return <div className="page-container"><div className="loading-container"><div className="spinner"></div></div></div>;
  if (!reservation) return <div className="page-container"><div className="empty-state"><div className="empty-state-text">Reservation not found</div></div></div>;

  const details = [
    { label: 'Buyer', value: findName(reservation.buyerProsumerId) },
    { label: 'Seller', value: findName(reservation.sellerProsumerId) },
    { label: 'Energy Amount', value: `${reservation.energyAmount} kWh` },
    { label: 'Total Price', value: `$${reservation.totalPrice}` },
    { label: 'Status', value: <span className={`status-badge status-${reservation.status?.toLowerCase()}`}>{reservation.status}</span> },
    { label: 'Reserved At', value: new Date(reservation.reservedAt).toLocaleString() },
    { label: 'Last Updated', value: new Date(reservation.updatedAt).toLocaleString() },
    { label: 'Notes', value: reservation.notes || '—' },
  ];

  return (
    <div className="page-container">
      <div className="page-header"><h1 className="page-title">Reservation Details</h1></div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          {details.map((d, i) => (
            <div key={i}><span className="form-label">{d.label}</span><p>{d.value}</p></div>
          ))}
        </div>
        <div className="btn-group" style={{ marginTop: 24 }}>
          <Button variant="secondary" onClick={() => navigate('/reservations')}>← Back to Reservations</Button>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetails;
