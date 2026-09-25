import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  RotateCcw,
  Clock,
  UserCheck
} from 'lucide-react';
import { prosumerService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';

/**
 * Pending Activation Management Page (Member 2).
 * Restricted to Backoffice role. Displays pending accounts requiring verification.
 */
const PendingActivation = () => {
  const [prosumers, setProsumers] = useState([]);
  const [filteredProsumers, setFilteredProsumers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      setFilteredProsumers(
        prosumers.filter(
          (p) =>
            p.nic?.toLowerCase().includes(q) ||
            p.name?.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q) ||
            p.phone?.toLowerCase().includes(q)
        )
      );
    } else {
      setFilteredProsumers(prosumers);
    }
  }, [searchTerm, prosumers]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const response = await prosumerService.getByStatus('Pending');
      setProsumers(response.data);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load pending prosumers from service.' });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    setActionLoading(id);
    try {
      await prosumerService.activate(id);
      setProsumers(prosumers.filter((p) => (p.nic || p.id) !== id));
      setAlert({ type: 'success', message: `Prosumer #${id} activated successfully!` });
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to activate prosumer.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm(`Reject registration for prosumer #${id}?`)) return;

    setActionLoading(id);
    try {
      await prosumerService.deactivate(id, 'Registration rejected by administrator');
      setProsumers(prosumers.filter((p) => (p.nic || p.id) !== id));
      setAlert({ type: 'success', message: `Prosumer #${id} registration rejected.` });
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to reject prosumer.' });
    } finally {
      setActionLoading(null);
    }
  };

  const columns = [
    {
      key: 'nic',
      label: 'NIC (Identity)',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-light)' }}>
          {row.nic || row.id}
        </span>
      ),
    },
    { key: 'name', label: 'Full Name', render: (row) => <strong>{row.name}</strong> },
    { key: 'email', label: 'Email Address' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'solarCapacity',
      label: 'Capacity',
      render: (row) => `${row.solarCapacity} kW`,
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <span className="status-badge status-pending">Pending Approval</span>,
    },
    {
      key: 'actions',
      label: 'Backoffice Actions',
      render: (row) => (
        <div className="btn-group">
          <Button
            variant="success"
            size="sm"
            onClick={() => handleActivate(row.nic || row.id)}
            disabled={actionLoading === (row.nic || row.id)}
          >
            <CheckCircle size={14} className="icon-mr" /> Activate
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeactivate(row.nic || row.id)}
            disabled={actionLoading === (row.nic || row.id)}
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
        <h1 className="page-title">Pending Account Activations</h1>
        <p className="page-subtitle">Review, verify, and approve new solar prosumer registration requests</p>
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

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search by NIC, Name, Email, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          {searchTerm && (
            <Button variant="secondary" size="sm" onClick={() => setSearchTerm('')}>
              <RotateCcw size={14} className="icon-mr" /> Reset
            </Button>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredProsumers}
        loading={loading}
        emptyMessage="All prosumer accounts are currently activated"
        emptySubtext="There are no pending registrations requiring backoffice action."
        emptyIcon={<UserCheck size={44} strokeWidth={1.5} color="var(--success)" />}
      />
    </div>
  );
};

export default PendingActivation;
