import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Clock,
  Zap,
  ShieldCheck,
  RefreshCw,
  Search,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { prosumerService, microgridService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';

/**
 * Pending Activation Management Page (Member 2).
 * Restricted to Backoffice role. Displays pending accounts requiring verification.
 */
const PendingActivation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pendingProsumers, setPendingProsumers] = useState([]);
  const [filteredProsumers, setFilteredProsumers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Reject / Deactivate Modal
  const [rejectModal, setRejectModal] = useState({ open: false, nic: '', name: '', reason: '' });

  useEffect(() => {
    fetchPending();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      setFilteredProsumers(
        pendingProsumers.filter(
          (p) =>
            p.nic?.toLowerCase().includes(q) ||
            p.name?.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q) ||
            p.phone?.toLowerCase().includes(q)
        )
      );
    } else {
      setFilteredProsumers(pendingProsumers);
    }
  }, [searchTerm, pendingProsumers]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const [pendingRes, nodesRes] = await Promise.all([
        prosumerService.getByStatus('Pending'),
        microgridService.getAll().catch(() => ({ data: [] })),
      ]);
      setPendingProsumers(pendingRes.data || []);
      setNodes(nodesRes.data || []);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to retrieve pending activations.' });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (nic, name) => {
    setActionLoading(true);
    try {
      await prosumerService.activate(nic);
      setPendingProsumers((prev) => prev.filter((p) => (p.nic || p.id) !== nic));
      toast.confirm(`Prosumer "${name}" (NIC: ${nic}) account activated successfully!`, 'Account Activated');
      setAlert({ type: 'success', message: `Prosumer "${name}" (NIC: ${nic}) has been activated successfully!` });
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to activate prosumer account.';
      toast.error(errMsg, 'Activation Failed');
      setAlert({ type: 'error', message: errMsg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await prosumerService.deactivate(rejectModal.nic, rejectModal.reason || 'Rejected by Backoffice operator');
      setPendingProsumers((prev) => prev.filter((p) => (p.nic || p.id) !== rejectModal.nic));
      toast.warning(`Application for "${rejectModal.name}" rejected and marked Inactive.`, 'Application Rejected');
      setAlert({ type: 'success', message: `Prosumer "${rejectModal.name}" was rejected and marked Inactive.` });
      setRejectModal({ open: false, nic: '', name: '', reason: '' });
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to reject application.';
      toast.error(errMsg, 'Rejection Failed');
      setAlert({ type: 'error', message: errMsg });
    } finally {
      setActionLoading(false);
    }
  };

  const getNodeName = (nodeId) => {
    if (!nodeId) return 'Unassigned';
    const found = nodes.find((n) => n.id === nodeId);
    return found ? `${found.nodeName} (${found.location})` : 'Assigned Node';
  };

  const columns = [
    {
      key: 'nic',
      label: 'NIC (Identity)',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-color, var(--primary))' }}>
          {row.nic || row.id}
        </span>
      ),
    },
    { key: 'name', label: 'Applicant Name', render: (row) => <strong>{row.name}</strong> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'solarCapacity',
      label: 'Capacity',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Zap size={14} color="var(--primary-color, var(--primary))" /> {row.solarCapacity} kW
        </span>
      ),
    },
    {
      key: 'microgridNodeId',
      label: 'Microgrid Node',
      render: (row) => getNodeName(row.microgridNodeId),
    },
    {
      key: 'createdAt',
      label: 'Registered On',
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'),
    },
    {
      key: 'actions',
      label: 'Backoffice Actions',
      render: (row) => {
        const nic = row.nic || row.id;
        return (
          <div className="btn-group">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/prosumers/${nic}`)}
              title="Review Complete Profile"
            >
              <Eye size={14} className="icon-mr" /> Review
            </Button>
            <Button
              variant="success"
              size="sm"
              disabled={actionLoading}
              onClick={() => handleActivate(nic, row.name)}
              title="Approve and Activate Account"
            >
              <CheckCircle size={14} className="icon-mr" /> Approve & Activate
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setRejectModal({ open: true, nic, name: row.name, reason: '' })}
              title="Reject Application"
            >
              <XCircle size={14} className="icon-mr" /> Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header-actions" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Pending Account Activations</h1>
          <p className="page-subtitle">Review, verify, and approve new prosumer onboarding requests</p>
        </div>
        <Button variant="secondary" onClick={fetchPending} loading={loading}>
          <RefreshCw size={14} className="icon-mr" /> Refresh List
        </Button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {alert.type === 'success' ? (
            <CheckCircle size={18} color="var(--success)" />
          ) : (
            <AlertTriangle size={18} color="var(--danger)" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Summary KPI Banner */}
      <div className="card" style={{ marginBottom: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: '50%', 
            background: 'rgba(245, 158, 11, 0.15)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--accent, #f59e0b)'
          }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {pendingProsumers.length} {pendingProsumers.length === 1 ? 'Application' : 'Applications'} Pending Review
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Authorized Backoffice action is required to verify identity and enable trading access.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="status-badge status-pending" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            Backoffice Verification
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search pending by NIC, Name, Email, or Phone..."
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

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, nic: '', name: '', reason: '' })}
        title="Reject Prosumer Registration"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRejectModal({ open: false, nic: '', name: '', reason: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={actionLoading}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <p style={{ marginBottom: 12 }}>
          Are you sure you want to reject the application for <strong>{rejectModal.name}</strong> (NIC: {rejectModal.nic})?
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          This will set the prosumer account to <strong>Inactive</strong> status and prevent energy trading.
        </p>
        <div className="form-group">
          <label className="form-label">Rejection / Deactivation Reason</label>
          <textarea
            className="form-control"
            rows="3"
            placeholder="e.g. Incomplete documentation, invalid meter number, unverified address..."
            value={rejectModal.reason}
            onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
};

export default PendingActivation;
