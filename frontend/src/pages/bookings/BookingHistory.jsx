import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  RefreshCw,
  Eye,
  Zap,
  Calendar,
  Clock,
  DollarSign
} from 'lucide-react';
import { bookingService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';

const BookingHistory = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await bookingService.getHistory();
      setBookings(res.data || []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getStatusClass = (status) => {
    const map = { Completed: 'status-completed', Cancelled: 'status-cancelled' };
    return map[status] || '';
  };

  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter((b) => {
      const id = (b.id || '').toLowerCase();
      const status = (b.status || '').toLowerCase();
      const energy = String(b.energyAmount || '');
      const price = String(b.pricePerUnit || '');
      const date = b.slotDate ? new Date(b.slotDate).toLocaleDateString().toLowerCase() : '';
      return id.includes(q) || status.includes(q) || energy.includes(q) || price.includes(q) || date.includes(q);
    });
  }, [bookings, searchQuery]);

  const columns = [
    {
      key: 'id',
      label: 'Booking ID',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          #{row.id ? row.id.slice(-6) : '—'}
        </span>
      ),
    },
    {
      key: 'energyAmount',
      label: 'Energy (kWh)',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--accent-light)' }}>
          <Zap size={14} />
          {row.energyAmount} kWh
        </span>
      ),
    },
    {
      key: 'pricePerUnit',
      label: 'Price/kWh',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontWeight: 600, color: 'var(--primary-light)' }}>
          <DollarSign size={14} />
          {row.pricePerUnit}
        </span>
      ),
    },
    {
      key: 'slotDate',
      label: 'Date',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
          <Calendar size={13} color="var(--text-muted)" />
          {new Date(row.slotDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'time',
      label: 'Time Window',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
          <Clock size={13} color="var(--text-muted)" />
          {row.startTime} – {row.endTime}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`status-badge ${getStatusClass(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/bookings/${row.id}`)}
          title="View Details"
        >
          <Eye size={14} className="icon-mr" /> View
        </Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Booking History</h1>
          <p className="page-subtitle">Archive of past completed and cancelled energy booking transactions</p>
        </div>
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'icon-mr spin' : 'icon-mr'} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, maxWidth: 450, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search booking history by ID, status, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 38, width: '100%' }}
          />
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filteredBookings}
        loading={loading}
        emptyMessage="No booking history found"
        emptySubtext="No completed or cancelled bookings recorded in archive."
        emptyIcon={<History size={44} strokeWidth={1.5} color="var(--text-secondary)" />}
      />
    </div>
  );
};

export default BookingHistory;
