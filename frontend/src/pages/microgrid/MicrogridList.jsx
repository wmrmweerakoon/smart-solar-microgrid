import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  PauseCircle,
  CheckCircle,
  AlertTriangle,
  Zap,
  Search,
  RotateCcw,
  Battery
} from 'lucide-react';
import { microgridService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

/**
 * Microgrid Node Directory Page (Member 1).
 * Displays solar microgrid distribution nodes with load tracking, status filters, and management actions.
 */
const MicrogridList = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [nodes, setNodes] = useState([]);
  const [filteredNodes, setFilteredNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [alert, setAlert] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (routerLocation.state?.message) {
      setAlert({ type: 'success', message: routerLocation.state.message });
      window.history.replaceState({}, document.title);
    }
    fetchNodes();
  }, [routerLocation.state]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, nodes]);

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const response = await microgridService.getAll();
      const list = response.data || [];
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setNodes(list);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load microgrid nodes.' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...nodes];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (n) =>
          n.nodeName?.toLowerCase().includes(q) ||
          n.location?.toLowerCase().includes(q) ||
          n.id?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter((n) => n.status === statusFilter);
    }

    setFilteredNodes(result);
  };

  const handleDelete = async () => {
    try {
      await microgridService.delete(deleteModal.id);
      setNodes(nodes.filter((n) => n.id !== deleteModal.id));
      setDeleteModal({ open: false, id: null, name: '' });
      setAlert({ type: 'success', message: 'Microgrid node deleted successfully.' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to delete node.' });
    }
  };

  const handleDeactivate = async (id) => {
    try {
      const res = await microgridService.deactivate(id);
      setNodes(nodes.map((n) => (n.id === id ? res.data : n)));
      setAlert({ type: 'success', message: 'Microgrid node deactivated.' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to deactivate node.';
      setAlert({ type: 'error', message: msg });
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'maintenance':
        return 'status-maintenance';
      default:
        return 'status-available';
    }
  };

  const columns = [
    {
      key: 'nodeName',
      label: 'Node Name',
      render: (row) => <strong>{row.nodeName}</strong>,
    },
    { key: 'location', label: 'Grid Location' },
    {
      key: 'capacity',
      label: 'Capacity (kW)',
      render: (row) => `${row.capacity} kW`,
    },
    {
      key: 'batteryStorageSlots',
      label: 'Storage Slots',
      render: (row) => row.batteryStorageSlots || 0,
    },
    {
      key: 'currentLoad',
      label: 'Load (kW)',
      render: (row) => `${row.currentLoad || 0} kW`,
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
        <div className="btn-group">
          {row.status === 'Active' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleDeactivate(row.id)}
              title="Deactivate Node"
            >
              <PauseCircle size={14} className="icon-mr" /> Deactivate
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/microgrid/edit/${row.id}`)}
            title="Edit Node"
          >
            <Pencil size={14} className="icon-mr" /> Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModal({ open: true, id: row.id, name: row.nodeName })}
            title="Delete Node"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Microgrid Nodes</h1>
          <p className="page-subtitle">Manage solar grid distribution hubs and storage capacity</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/microgrid/create')}>
          <Plus size={16} className="icon-mr" /> Add Microgrid Node
        </Button>
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
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search by Node Name, Location, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>

          <div style={{ flex: '1 1 180px' }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== 'All') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}
            >
              <RotateCcw size={14} className="icon-mr" /> Reset
            </Button>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredNodes}
        loading={loading}
        emptyMessage="No microgrid nodes found"
        emptyIcon={<Zap size={44} strokeWidth={1.5} color="var(--primary)" />}
        emptyAction={
          <Button variant="primary" size="sm" onClick={() => navigate('/microgrid/create')}>
            <Plus size={14} className="icon-mr" /> Create First Node
          </Button>
        }
      />

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: '' })}
        title="Delete Microgrid Node"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, id: null, name: '' })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Confirm Delete
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete node <strong>{deleteModal.name}</strong>?
          This will revoke connection for associated prosumers and cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default MicrogridList;
