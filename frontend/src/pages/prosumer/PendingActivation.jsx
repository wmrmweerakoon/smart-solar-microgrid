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
  RefreshCw 
} from 'lucide-react';
import { prosumerService, microgridService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const PendingActivation = () => {
  const navigate = useNavigate();

  const [pendingProsumers, setPendingProsumers] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Reject / Deactivate Modal
  const [rejectModal, setRejectModal] = useState({ open: false, nic: '', name: '', reason: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const [pendingRes, nodesRes] = await Promise.all([
        prosumerService.getByStatus('Pending'),
        microgridService.getAll().catch(() => ({ data: [] })),
      ]);
      setPendingProsumers(pendingRes.data);
      setNodes(nodesRes.data);
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
      setAlert({ type: 'success', message: `Prosumer "${name}" (NIC: ${nic}) has been activated successfully!` });
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to activate prosumer account.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await prosumerService.deactivate(rejectModal.nic, rejectModal.reason || 'Rejected by Backoffice operator');
      setPendingProsumers((prev) => prev.filter((p) => (p.nic || p.id) !== rejectModal.nic));
      setAlert({ type: 'success', message: `Prosumer "${rejectModal.name}" was rejected and marked Inactive.` });
      setRejectModal({ open: false, nic: '', name: '', reason: '' });
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to reject application.' });
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
      label: 'NIC',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-color)' }}>
          {row.nic || row.id}
        </span>
      ),
    },
    { key: 'name', label: 'Applicant Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'solarCapacity',
      label: 'Capacity',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Zap size={14} color="var(--primary-color)" /> {row.solarCapacity} kW
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
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
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
              loading={actionLoading}
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
      <div className="page-header-actions">
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
          {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Summary KPI Banner */}
      <div className="card" style={{ marginBottom: 24, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
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
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
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

      <Table
        columns={columns}
        data={pendingProsumers}
        loading={loading}
        emptyMessage="No pending prosumer registrations require activation at this time."
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
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          This will set the prosumer account to <strong>Inactive</strong> status and prevent energy trading.
        </p>
        <div className="form-group">
          <label className="form-label">Rejection / Deactivation Reason</label>
          <textarea
            className="form-input"
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
