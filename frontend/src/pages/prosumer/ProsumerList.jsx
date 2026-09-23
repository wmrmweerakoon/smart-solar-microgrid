import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  PowerOff, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  RotateCcw,
  Zap
} from 'lucide-react';
import { prosumerService, microgridService } from '../../services/api';
import { getRole } from '../../utils/auth';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const ProsumerList = () => {
  const navigate = useNavigate();
  const userRole = getRole();
  const isBackoffice = userRole === 'Backoffice';

  const [prosumers, setProsumers] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [nodeFilter, setNodeFilter] = useState('All');

  // Modals State
  const [deleteModal, setDeleteModal] = useState({ open: false, nic: '', name: '' });
  const [deactivateModal, setDeactivateModal] = useState({ open: false, nic: '', name: '', reason: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prosumerRes, nodeRes] = await Promise.all([
        prosumerService.getAll(),
        microgridService.getAll().catch(() => ({ data: [] }))
      ]);
      setProsumers(prosumerRes.data);
      setNodes(nodeRes.data);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load prosumers list.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await prosumerService.search({
        query: searchTerm,
        status: statusFilter,
        nodeId: nodeFilter,
      });
      setProsumers(res.data);
    } catch (error) {
      setAlert({ type: 'error', message: 'Search query failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = async () => {
    setSearchTerm('');
    setStatusFilter('All');
    setNodeFilter('All');
    setLoading(true);
    try {
      const res = await prosumerService.getAll();
      setProsumers(res.data);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to reload prosumers.' });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (nic) => {
    setActionLoading(true);
    try {
      await prosumerService.activate(nic);
      setAlert({ type: 'success', message: `Prosumer (${nic}) activated successfully!` });
      await handleSearch();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to activate prosumer.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setActionLoading(true);
    try {
      await prosumerService.deactivate(deactivateModal.nic, deactivateModal.reason);
      setAlert({ type: 'success', message: `Prosumer (${deactivateModal.nic}) deactivated successfully.` });
      setDeactivateModal({ open: false, nic: '', name: '', reason: '' });
      await handleSearch();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to deactivate prosumer.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await prosumerService.delete(deleteModal.nic);
      setAlert({ type: 'success', message: `Prosumer (${deleteModal.nic}) removed successfully.` });
      setDeleteModal({ open: false, nic: '', name: '' });
      await handleSearch();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to delete prosumer.' });
    } finally {
      setActionLoading(false);
    }
  };

  const getNodeName = (nodeId) => {
    if (!nodeId) return '—';
    const found = nodes.find((n) => n.id === nodeId);
    return found ? found.nodeName : 'Assigned Node';
  };

  const getStatusBadge = (status) => {
    const map = {
      Active: 'status-active',
      Pending: 'status-pending',
      Inactive: 'status-inactive'
    };
    return (
      <span className={`status-badge ${map[status] || ''}`}>
        {status}
      </span>
    );
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
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'solarCapacity',
      label: 'Solar (kW)',
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
      key: 'status',
      label: 'Status',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        const nic = row.nic || row.id;
        return (
          <div className="btn-group">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/prosumers/${nic}`)}
              title="View Detailed Profile"
            >
              <Eye size={14} className="icon-mr" /> View
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/prosumers/edit/${nic}`)}
              title="Edit Profile"
            >
              <Pencil size={14} className="icon-mr" /> Edit
            </Button>
            
            {row.status === 'Active' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeactivateModal({ open: true, nic, name: row.name, reason: '' })}
                title="Deactivate Account"
                style={{ color: 'var(--danger-color, #ef4444)' }}
              >
                <PowerOff size={14} className="icon-mr" /> Deactivate
              </Button>
            ) : isBackoffice ? (
              <Button
                variant="success"
                size="sm"
                onClick={() => handleActivate(nic)}
                title="Activate Account"
              >
                <CheckCircle size={14} className="icon-mr" /> Activate
              </Button>
            ) : null}

            {isBackoffice && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteModal({ open: true, nic, name: row.name })}
                title="Delete Profile"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header-actions">
        <div>
          <h1 className="page-title">Prosumer Management</h1>
          <p className="page-subtitle">Search, inspect, and manage solar prosumer profiles and states</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/prosumers/create')}>
          <Plus size={16} className="icon-mr" /> Add New Prosumer
        </Button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 250px', minWidth: 200 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={14} /> Search Prosumers
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by NIC, Name, Email, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ flex: '0 1 180px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} /> Status
            </label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div style={{ flex: '0 1 220px' }}>
            <label className="form-label">Microgrid Node</label>
            <select
              className="form-select"
              value={nodeFilter}
              onChange={(e) => setNodeFilter(e.target.value)}
            >
              <option value="All">All Microgrids</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.nodeName} ({node.location})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="submit" variant="primary" loading={loading}>
              <Search size={14} className="icon-mr" /> Filter
            </Button>
            <Button type="button" variant="secondary" onClick={handleResetFilters}>
              <RotateCcw size={14} className="icon-mr" /> Reset
            </Button>
          </div>
        </form>
      </div>

      <Table
        columns={columns}
        data={prosumers}
        loading={loading}
        emptyMessage="No prosumers match your criteria."
      />

      {/* Deactivate Modal */}
      <Modal
        isOpen={deactivateModal.open}
        onClose={() => setDeactivateModal({ open: false, nic: '', name: '', reason: '' })}
        title="Confirm Account Deactivation"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeactivateModal({ open: false, nic: '', name: '', reason: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={actionLoading}
              onClick={handleDeactivate}
            >
              Confirm Deactivate
            </Button>
          </>
        }
      >
        <p style={{ marginBottom: 16 }}>
          Are you sure you want to deactivate the account for <strong>{deactivateModal.name}</strong> (NIC: {deactivateModal.nic})?
        </p>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
          Deactivation will temporarily suspend their energy trading capabilities. Accounts with active pending or confirmed reservations cannot be deactivated until reservations are completed.
        </div>
        <div className="form-group">
          <label className="form-label">Deactivation Reason (Optional)</label>
          <textarea
            className="form-input"
            rows="3"
            placeholder="e.g. Inverter maintenance, user request, grid inspection..."
            value={deactivateModal.reason}
            onChange={(e) => setDeactivateModal({ ...deactivateModal, reason: e.target.value })}
          />
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, nic: '', name: '' })}
        title="Delete Prosumer Profile"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ open: false, nic: '', name: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={actionLoading}
              onClick={handleDelete}
            >
              Delete Record
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to permanently delete prosumer <strong>{deleteModal.name}</strong> (NIC: {deleteModal.nic})?
        </p>
        <p style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.85rem', marginTop: 8 }}>
          This operation cannot be reversed.
        </p>
      </Modal>
    </div>
  );
};

export default ProsumerList;
