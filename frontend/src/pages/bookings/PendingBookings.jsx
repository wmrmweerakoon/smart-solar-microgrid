import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Eye,
  Search,
  RotateCcw,
  AlertTriangle,
  Clock,
  Calendar
} from 'lucide-react';
import { bookingService, microgridService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';

/**
 * Pending Bookings operational view.
 * Displays energy claims awaiting operator approval with batch and individual confirmation controls.
 */
const PendingBookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [alert, setAlert] = useState(null);
  const [cancelModal, setCancelModal] = useState({ open: false, id: null });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedNode, selectedDate, bookings]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, nodesRes] = await Promise.all([
        bookingService.getPending(),
        microgridService.getAll().catch(() => ({ data: [] }))
      ]);
      setBookings(bookingsRes.data || []);
      setNodes(nodesRes.data || []);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load pending bookings from the central service.' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...bookings];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (b) =>
          b.id?.toLowerCase().includes(q) ||
          b.buyerName?.toLowerCase().includes(q) ||
          b.buyerProsumerId?.toLowerCase().includes(q) ||
          b.sellerName?.toLowerCase().includes(q) ||
          b.sellerProsumerId?.toLowerCase().includes(q) ||
          b.microgridNodeName?.toLowerCase().includes(q)
      );
    }

    if (selectedNode !== 'All') {
      result = result.filter((b) => b.microgridNodeId === selectedNode);
    }

    if (selectedDate) {
      result = result.filter(
        (b) => new Date(b.slotDate).toISOString().slice(0, 10) === selectedDate
      );
    }

    setFilteredBookings(result);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedNode('All');
    setSelectedDate('');
  };

  const handleConfirm = async (id) => {
    setActionLoading(id);
    try {
      await bookingService.confirm(id);
      toast.confirm(`Booking #${id.slice(-6)} has been approved and confirmed!`, 'Booking Confirmed');
      setAlert({ type: 'success', message: `Booking #${id.slice(-6)} has been approved and confirmed!` });
      await fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to approve booking.';
      toast.error(errMsg, 'Approval Error');
      setAlert({ type: 'error', message: errMsg });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelModal.id) return;
    const id = cancelModal.id;
    setActionLoading(id);
    try {
      await bookingService.cancel(id);
      setCancelModal({ open: false, id: null });
      toast.cancellation(`Booking #${id.slice(-6)} has been rejected and cancelled.`, 'Booking Rejected');
      setAlert({ type: 'success', message: `Booking #${id.slice(-6)} has been rejected and cancelled.` });
      await fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to cancel booking.';
      if (errMsg.toLowerCase().includes('notice') || errMsg.toLowerCase().includes('hour') || errMsg.toLowerCase().includes('24') || errMsg.toLowerCase().includes('12')) {
        toast.cancellationNotice(errMsg);
      } else {
        toast.error(errMsg, 'Cancellation Rejected');
      }
      setAlert({ type: 'error', message: errMsg });
    } finally {
      setActionLoading(null);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Booking ID',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-light)' }}>
          {row.id ? `#${row.id.slice(-8)}` : '—'}
        </span>
      ),
    },
    {
      key: 'microgridNodeName',
      label: 'Microgrid Node',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.microgridNodeName || 'Assigned Node'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.microgridLocation || ''}</div>
        </div>
      ),
    },
    {
      key: 'buyer',
      label: 'Claiming Buyer',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.buyerName || 'Unassigned / Open'}</div>
          {row.buyerProsumerId && row.buyerProsumerId !== 'N/A' && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.buyerProsumerId}</div>
          )}
        </div>
      ),
    },
    {
      key: 'seller',
      label: 'Source Seller',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.sellerName || 'Seller'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.sellerProsumerId || ''}</div>
        </div>
      ),
    },
    {
      key: 'energy',
      label: 'Energy Volume',
      render: (row) => (
        <div>
          <strong style={{ color: 'var(--accent-light)' }}>{row.energyAmount} kWh</strong>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            ${row.pricePerUnit}/kWh
          </div>
        </div>
      ),
    },
    {
      key: 'totalPrice',
      label: 'Total Value',
      render: (row) => (
        <strong style={{ color: 'var(--primary-light)' }}>
          ${row.totalPrice?.toFixed(2) ?? ((row.energyAmount || 0) * (row.pricePerUnit || 0)).toFixed(2)}
        </strong>
      ),
    },
    {
      key: 'slotDate',
      label: 'Schedule',
      minWidth: '160px',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, whiteSpace: 'nowrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
            <Calendar size={14} color="var(--primary-light)" style={{ flexShrink: 0 }} />
            <span>{new Date(row.slotDate).toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            <Clock size={13} color="var(--accent-light)" style={{ flexShrink: 0 }} />
            <span>{row.startTime} – {row.endTime}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <span className="status-badge status-pending">Pending</span>,
    },
    {
      key: 'actions',
      label: 'Operational Actions',
      render: (row) => (
        <div className="btn-group" style={{ flexWrap: 'nowrap' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/bookings/${row.id}`)}
            title="View Details"
          >
            <Eye size={14} className="icon-mr" /> Details
          </Button>

          <Button
            variant="success"
            size="sm"
            onClick={() => handleConfirm(row.id)}
            disabled={actionLoading === row.id}
            title="Approve booking"
          >
            <CheckCircle size={14} className="icon-mr" /> Confirm
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setCancelModal({ open: true, id: row.id })}
            disabled={actionLoading === row.id}
            title="Reject booking"
          >
            <XCircle size={14} className="icon-mr" /> Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Pending Bookings</h1>
        <p className="page-subtitle">
          Review, approve, or reject incoming energy bookings awaiting network confirmation
        </p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {alert.type === 'success' ? (
            <CheckCircle size={18} color="var(--success)" />
          ) : (
            <AlertTriangle size={18} color="var(--danger)" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Keyword Search */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search by Prosumer, NIC, Node, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>

          {/* Microgrid Node Filter */}
          <div style={{ flex: '1 1 200px' }}>
            <select
              className="form-control"
              value={selectedNode}
              onChange={(e) => setSelectedNode(e.target.value)}
            >
              <option value="All">All Microgrid Nodes</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nodeName} ({n.location})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ flex: '1 1 160px' }}>
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Reset Button */}
          {(searchTerm || selectedNode !== 'All' || selectedDate) && (
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              <RotateCcw size={14} className="icon-mr" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      <Table
        columns={columns}
        data={filteredBookings}
        loading={loading}
        emptyMessage="No pending bookings match your criteria"
        emptySubtext="All submitted energy bookings have been processed or none match the active filters."
        emptyIcon={<Clock size={48} strokeWidth={1} color="var(--text-secondary)" />}
      />

      {/* Reject/Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, id: null })}
        title="Reject Pending Booking"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelModal({ open: false, id: null })}>
              Keep Pending
            </Button>
            <Button variant="danger" onClick={handleCancel}>
              Confirm Rejection
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to reject and cancel this pending booking?
        </p>
      </Modal>
    </div>
  );
};

export default PendingBookings;
