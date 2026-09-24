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
  Filter,
  Check,
  X
} from 'lucide-react';
import { bookingService, microgridService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';

/**
 * Pending Bookings management page.
 * Displays energy bookings awaiting operational confirmation/approval.
 */
const PendingBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [alert, setAlert] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');

  const navigate = useNavigate();

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
      setBookings(bookingsRes.data);
      setNodes(nodesRes.data);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load pending bookings from the API.' });
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
    if (!window.confirm('Approve and confirm this energy booking? This locks the energy slot for the buyer.')) {
      return;
    }

    setActionLoading(id);
    try {
      await bookingService.confirm(id);
      setAlert({ type: 'success', message: `Booking ${id.slice(-6)} confirmed successfully.` });
      await fetchData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to confirm booking.'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Reject/cancel this pending booking? The slot will be returned to the open market.')) {
      return;
    }

    setActionLoading(id);
    try {
      await bookingService.cancel(id);
      setAlert({ type: 'success', message: `Booking ${id.slice(-6)} cancelled.` });
      await fetchData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to cancel booking.'
      });
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
          {row.id ? row.id.slice(-8) : '—'}
        </span>
      ),
    },
    {
      key: 'microgridNodeName',
      label: 'Microgrid Node',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.microgridNodeName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.microgridLocation}</div>
        </div>
      ),
    },
    {
      key: 'buyer',
      label: 'Buyer Prosumer',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.buyerName || 'N/A'}</div>
          {row.buyerProsumerId && row.buyerProsumerId !== 'N/A' && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.buyerProsumerId}</div>
          )}
        </div>
      ),
    },
    {
      key: 'seller',
      label: 'Seller Prosumer',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.sellerName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.sellerProsumerId}</div>
        </div>
      ),
    },
    {
      key: 'energy',
      label: 'Energy Volume',
      render: (row) => (
        <div>
          <strong>{row.energyAmount} kWh</strong>
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
        <strong style={{ color: 'var(--accent)' }}>
          ${row.totalPrice?.toFixed(2) ?? ((row.energyAmount || 0) * (row.pricePerUnit || 0)).toFixed(2)}
        </strong>
      ),
    },
    {
      key: 'slotDate',
      label: 'Scheduled Slot',
      render: (row) => (
        <div>
          <div>{new Date(row.slotDate).toLocaleDateString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {row.startTime} – {row.endTime}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <span className="status-badge status-pending">Pending Approval</span>,
    },
    {
      key: 'actions',
      label: 'Operational Actions',
      render: (row) => (
        <div className="btn-group">
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
            title="Confirm & Approve Booking"
          >
            <Check size={14} className="icon-mr" /> Approve
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => handleCancel(row.id)}
            disabled={actionLoading === row.id}
            title="Reject / Cancel"
          >
            <X size={14} className="icon-mr" /> Cancel
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
          Review, approve, or cancel booking requests awaiting operational authorization
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

      {/* Filter Bar */}
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

          {/* Node Filter */}
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

      {/* Table */}
      <Table
        columns={columns}
        data={filteredBookings}
        loading={loading}
        emptyMessage="No pending bookings requiring approval"
        emptyIcon={<Clock size={48} strokeWidth={1} color="var(--text-secondary)" />}
      />
    </div>
  );
};

export default PendingBookings;
