import { useState, useEffect } from 'react';
import { bookingService } from '../../services/api';
import Table from '../../components/Table';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingService.getHistory()
      .then((res) => setBookings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStatusClass = (status) => {
    const map = { Completed: 'status-completed', Cancelled: 'status-cancelled' };
    return map[status] || '';
  };

  const columns = [
    { key: 'energyAmount', label: 'Energy (kWh)', render: (row) => `${row.energyAmount} kWh` },
    { key: 'pricePerUnit', label: 'Price/kWh', render: (row) => `$${row.pricePerUnit}` },
    { key: 'slotDate', label: 'Date', render: (row) => new Date(row.slotDate).toLocaleDateString() },
    { key: 'time', label: 'Time', render: (row) => `${row.startTime} – ${row.endTime}` },
    { key: 'status', label: 'Status', render: (row) => <span className={`status-badge ${getStatusClass(row.status)}`}>{row.status}</span> },
  ];

  return (
    <div className="page-container">
      <div className="page-header"><h1 className="page-title">Booking History</h1><p className="page-subtitle">Completed and cancelled bookings</p></div>
      <Table columns={columns} data={bookings} loading={loading} emptyMessage="No booking history" emptyIcon="📜" />
    </div>
  );
};

export default BookingHistory;
