import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  RotateCcw,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  Filter
} from 'lucide-react';
import { bookingService, microgridService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';

/**
 * Booking History page.
 * Displays completed and cancelled energy bookings with search, status filtering, and audit details.
 */
const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedNode, setSelectedNode] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedStatus, selectedNode, selectedDate, bookings]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [historyRes, nodesRes] = await Promise.all([
        bookingService.getHistory(),
        microgridService.getAll().catch(() => ({ data: [] }))
      ]);
      setBookings(historyRes.data);
      setNodes(nodesRes.data);
    } catch (err) {
      console.error('Failed to load booking history:', err);
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

    if (selectedStatus !== 'All') {
      result = result.filter((b) => b.status === selectedStatus);
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
    setSelectedStatus('All');
    setSelectedNode('All');
    setSelectedDate('');
  };

  const getStatusBadge = (status) => {
    if (status === 'Completed') {
      return <span className="status-badge status-completed">Completed</span>;
    }
    if (status === 'Cancelled') {
      return <span className="status-badge status-cancelled">Cancelled</span>;
    }
    return <span className="status-badge status-available">{status}</span>;
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
      label: 'Settlement Amount',
      render: (row) => (
        <strong>
          ${row.totalPrice?.toFixed(2) ?? ((row.energyAmount || 0) * (row.pricePerUnit || 0)).toFixed(2)}
        </strong>
      ),
    },
    {
      key: 'slotDate',
      label: 'Slot Schedule',
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
      label: 'Final Status',
      render: (row) => getStatusBadge(row.status),
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
          <Eye size={14} className="icon-mr" /> Details
        </Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Booking History</h1>
        <p className="page-subtitle">
          Audit trail and archival records of completed and cancelled energy trades
        </p>
      </div>

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

          {/* Status Filter */}
          <div style={{ flex: '1 1 150px' }}>
            <select
              className="form-control"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
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
          {(searchTerm || selectedStatus !== 'All' || selectedNode !== 'All' || selectedDate) && (
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
        emptyMessage="No historical booking records found"
        emptyIcon={<History size={48} strokeWidth={1} color="var(--text-secondary)" />}
      />
    </div>
  );
};

export default BookingHistory;
