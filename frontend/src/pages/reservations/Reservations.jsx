import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Check,
  CheckCheck,
  XCircle,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Bookmark,
  Calendar,
  Zap,
  DollarSign
} from 'lucide-react';
import { reservationService, prosumerService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const Reservations = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [prosumers, setProsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [cancelModal, setCancelModal] = useState({ open: false, id: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resRes, prosRes] = await Promise.all([
        reservationService.getAll(),
        prosumerService.getAll()
      ]);
      setReservations(resRes.data || []);
      setProsumers(prosRes.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load reservations data from server.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const findName = (id) => {
    const p = prosumers.find((item) => item.id === id);
    return p ? p.name : (id ? `${id.slice(-6)}...` : '—');
  };

  const handleConfirm = async (id) => {
    try {
      await reservationService.confirm(id);
      await fetchData();
      setAlert({ type: 'success', message: 'Reservation confirmed successfully!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to confirm reservation.' });
    }
  };

  const handleComplete = async (id) => {
    try {
      await reservationService.complete(id);
      await fetchData();
      setAlert({ type: 'success', message: 'Reservation marked as completed!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to complete reservation.' });
    }
  };

  const handleCancel = async () => {
    if (!cancelModal.id) return;
    try {
      await reservationService.cancel(cancelModal.id);
      setCancelModal({ open: false, id: null });
      await fetchData();
      setAlert({ type: 'success', message: 'Reservation cancelled and slot released back to market.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to cancel reservation.' });
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await reservationService.delete(deleteModal.id);
      setReservations((prev) => prev.filter((r) => r.id !== deleteModal.id));
      setDeleteModal({ open: false, id: null });
      setAlert({ type: 'success', message: 'Reservation record deleted.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete reservation.' });
    }
  };

  const getStatusClass = (status) => {
    const map = {
      Pending: 'status-pending',
      Confirmed: 'status-confirmed',
      Cancelled: 'status-cancelled',
      Completed: 'status-completed'
    };
    return map[status] || '';
  };

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      // Status filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const buyer = findName(r.buyerProsumerId).toLowerCase();
        const seller = findName(r.sellerProsumerId).toLowerCase();
        const resId = (r.id || '').toLowerCase();
        const notes = (r.notes || '').toLowerCase();
        return buyer.includes(q) || seller.includes(q) || resId.includes(q) || notes.includes(q);
      }
      return true;
    });
  }, [reservations, searchQuery, statusFilter, prosumers]);

  const columns = [
    {
      key: 'id',
      label: 'Reservation ID',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {row.id ? `#${row.id.slice(-6)}` : '—'}
        </span>
      ),
    },
    {
      key: 'buyerProsumerId',
      label: 'Buyer',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {findName(row.buyerProsumerId)}
        </span>
      ),
    },
    {
      key: 'sellerProsumerId',
      label: 'Seller',
      render: (row) => (
        <span style={{ color: 'var(--text-secondary)' }}>
          {findName(row.sellerProsumerId)}
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
      key: 'totalPrice',
      label: 'Total Price',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontWeight: 600, color: 'var(--primary-light)' }}>
          <DollarSign size={14} />
          {typeof row.totalPrice === 'number' ? row.totalPrice.toFixed(2) : row.totalPrice}
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
      key: 'reservedAt',
      label: 'Reserved At',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
          <Calendar size={13} color="var(--text-muted)" />
          {new Date(row.reservedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="btn-group" style={{ flexWrap: 'nowrap' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/reservations/${row.id}`)}
            title="View Details"
          >
            <Eye size={14} className="icon-mr" /> View
          </Button>

          {row.status === 'Pending' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleConfirm(row.id)}
              title="Confirm Reservation"
            >
              <Check size={14} className="icon-mr" /> Confirm
            </Button>
          )}

          {row.status === 'Confirmed' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleComplete(row.id)}
              title="Mark Completed"
            >
              <CheckCheck size={14} className="icon-mr" /> Complete
            </Button>
          )}

          {(row.status === 'Pending' || row.status === 'Confirmed') && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setCancelModal({ open: true, id: row.id })}
              title="Cancel Reservation"
            >
              <XCircle size={14} />
            </Button>
          )}

          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModal({ open: true, id: row.id })}
            title="Delete Record"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Reservations</h1>
          <p className="page-subtitle">Monitor, confirm, and manage energy trading reservations</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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

      {/* Filter and Search Controls */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 260, maxWidth: 500, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by Buyer, Seller, ID, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 38, width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Filter size={14} /> Filter Status:
            </span>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: 140 }}
            >
              <option value="ALL">All Statuses ({reservations.length})</option>
              <option value="Pending">Pending ({reservations.filter(r => r.status === 'Pending').length})</option>
              <option value="Confirmed">Confirmed ({reservations.filter(r => r.status === 'Confirmed').length})</option>
              <option value="Completed">Completed ({reservations.filter(r => r.status === 'Completed').length})</option>
              <option value="Cancelled">Cancelled ({reservations.filter(r => r.status === 'Cancelled').length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={filteredReservations}
        loading={loading}
        emptyMessage="No reservations match the criteria"
        emptySubtext="Try adjusting your search terms or filter selection."
        emptyIcon={<Bookmark size={44} strokeWidth={1.5} color="var(--text-secondary)" />}
      />

      {/* Cancel Reservation Modal */}
      <Modal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, id: null })}
        title="Cancel Reservation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelModal({ open: false, id: null })}>
              Keep Reservation
            </Button>
            <Button variant="danger" onClick={handleCancel}>
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to cancel this reservation?
        </p>
        <div style={{ marginTop: 12, padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--danger)', margin: 0 }}>
            Notice: Cancelling will release the allocated energy slot back to the microgrid market as available.
          </p>
        </div>
      </Modal>

      {/* Delete Reservation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        title="Delete Reservation Record"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, id: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Record
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to permanently delete this reservation record? This action cannot be reversed.
        </p>
      </Modal>
    </div>
  );
};

export default Reservations;
