import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  Search,
  Zap,
  Calendar,
  Clock,
  DollarSign,
  ClipboardList
} from 'lucide-react';
import { bookingService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const CurrentBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModal, setCancelModal] = useState({ open: false, id: null });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await bookingService.getCurrent();
      setBookings(res.data || []);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load current bookings.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleComplete = async (id) => {
    try {
      await bookingService.complete(id);
      fetchBookings();
      setAlert({ type: 'success', message: 'Booking marked as completed successfully!' });
    } catch {
      setAlert({ type: 'error', message: 'Failed to complete booking.' });
    }
  };

  const handleCancel = async () => {
    if (!cancelModal.id) return;
    try {
      await bookingService.cancel(cancelModal.id);
      setCancelModal({ open: false, id: null });
      fetchBookings();
      setAlert({ type: 'success', message: 'Booking cancelled successfully.' });
    } catch {
      setAlert({ type: 'error', message: 'Failed to cancel booking.' });
    }
  };

  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter((b) => {
      const id = (b.id || '').toLowerCase();
      const node = (b.microgridNodeId || '').toLowerCase();
      const energy = String(b.energyAmount || '');
      const price = String(b.pricePerUnit || '');
      const date = b.slotDate ? new Date(b.slotDate).toLocaleDateString().toLowerCase() : '';
      return id.includes(q) || node.includes(q) || energy.includes(q) || price.includes(q) || date.includes(q);
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
      render: () => <span className="status-badge status-booked">Booked</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="btn-group" style={{ flexWrap: 'nowrap' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/bookings/${row.id}`)}
            title="View Details"
          >
            <Eye size={14} className="icon-mr" /> View
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={() => handleComplete(row.id)}
            title="Mark Completed"
          >
            <CheckCircle size={14} className="icon-mr" /> Complete
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setCancelModal({ open: true, id: row.id })}
            title="Cancel Booking"
          >
            <XCircle size={14} className="icon-mr" /> Cancel
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Current Bookings</h1>
          <p className="page-subtitle">Active energy bookings confirmed and currently in operation</p>
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

      {/* Alert Notification */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? (
            <CheckCircle size={16} className="icon-mr" />
          ) : (
            <AlertTriangle size={16} className="icon-mr" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, maxWidth: 450, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search bookings by ID, energy, date..."
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
        emptyMessage="No active bookings found"
        emptySubtext="There are no active energy bookings running at this moment."
        emptyIcon={<ClipboardList size={44} strokeWidth={1.5} color="var(--text-secondary)" />}
      />

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, id: null })}
        title="Cancel Booking"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelModal({ open: false, id: null })}>
              Keep Booking
            </Button>
            <Button variant="danger" onClick={handleCancel}>
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to cancel this booking? This will revoke the active slot allocation.
        </p>
      </Modal>
    </div>
  );
};

export default CurrentBookings;
