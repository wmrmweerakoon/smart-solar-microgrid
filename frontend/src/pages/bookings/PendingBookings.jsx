import { useState, useEffect } from 'react';
import { bookingService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';

const PendingBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const res = await bookingService.getPending();
      setBookings(res.data);
    } catch { setAlert({ type: 'error', message: 'Failed to load pending bookings.' }); }
    finally { setLoading(false); }
  };

  const handleConfirm = async (id) => {
    try {
      await bookingService.confirm(id);
      fetchBookings();
      setAlert({ type: 'success', message: 'Booking confirmed!' });
    } catch { setAlert({ type: 'error', message: 'Failed to confirm booking.' }); }
  };

  const handleCancel = async (id) => {
    try {
      await bookingService.cancel(id);
      fetchBookings();
      setAlert({ type: 'success', message: 'Booking cancelled.' });
    } catch { setAlert({ type: 'error', message: 'Failed to cancel booking.' }); }
  };

  const columns = [
    { key: 'energyAmount', label: 'Energy (kWh)', render: (row) => `${row.energyAmount} kWh` },
    { key: 'pricePerUnit', label: 'Price/kWh', render: (row) => `$${row.pricePerUnit}` },
    { key: 'slotDate', label: 'Date', render: (row) => new Date(row.slotDate).toLocaleDateString() },
    { key: 'time', label: 'Time', render: (row) => `${row.startTime} – ${row.endTime}` },
    { key: 'status', label: 'Status', render: () => <span className="status-badge status-pending">Pending</span> },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="btn-group">
          <Button variant="success" size="sm" onClick={() => handleConfirm(row.id)}>✅ Confirm</Button>
          <Button variant="danger" size="sm" onClick={() => handleCancel(row.id)}>❌ Cancel</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header"><h1 className="page-title">Pending Bookings</h1><p className="page-subtitle">Bookings awaiting confirmation</p></div>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.type === 'success' ? '✅' : '⚠️'} {alert.message}</div>}
      <Table columns={columns} data={bookings} loading={loading} emptyMessage="No pending bookings" emptyIcon="⏳" />
    </div>
  );
};

export default PendingBookings;
