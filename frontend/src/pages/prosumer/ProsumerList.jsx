import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Users,
  Shield,
  CreditCard
} from 'lucide-react';
import { prosumerService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

/**
 * Prosumer Management Page (Member 2).
 * Displays prosumer directory with NIC primary key, search, status filtering, and edit/delete actions.
 */
const ProsumerList = () => {
  const navigate = useNavigate();
  const [prosumers, setProsumers] = useState([]);
  const [filteredProsumers, setFilteredProsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [alert, setAlert] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchProsumers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, prosumers]);

  const fetchProsumers = async () => {
    setLoading(true);
    try {
      const response = await prosumerService.getAll();
      setProsumers(response.data);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load prosumer directory.' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...prosumers];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.nic?.toLowerCase().includes(q) ||
          p.name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter((p) => p.status === statusFilter);
    }

    setFilteredProsumers(result);
  };

  const handleDelete = async () => {
    try {
      await prosumerService.delete(deleteModal.id);
      setProsumers(prosumers.filter((p) => (p.nic || p.id) !== deleteModal.id));
      setDeleteModal({ open: false, id: null, name: '' });
      setAlert({ type: 'success', message: 'Prosumer account deleted successfully.' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to delete prosumer.' });
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'inactive':
        return 'status-inactive';
      default:
        return 'status-available';
    }
  };

  const columns = [
    {
      key: 'nic',
      label: 'NIC (Primary Key)',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-light)' }}>
          {row.nic || row.id}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      render: (row) => <strong>{row.name}</strong>,
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'solarCapacity',
      label: 'Capacity',
      render: (row) => `${row.solarCapacity} kW`,
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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/prosumers/edit/${row.nic || row.id}`)}
            title="Edit Prosumer"
          >
            <Pencil size={14} className="icon-mr" /> Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModal({ open: true, id: row.nic || row.id, name: row.name })}
            title="Delete Account"
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
          <h1 className="page-title">Prosumer Management</h1>
          <p className="page-subtitle">Manage solar energy producers and consumer profiles</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/prosumers/create')}>
          <Plus size={16} className="icon-mr" /> Add New Prosumer
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
              placeholder="Search by NIC, Name, Email, Phone..."
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
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
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
        data={filteredProsumers}
        loading={loading}
        emptyMessage="No prosumers found matching your criteria"
        emptyIcon={<Users size={44} strokeWidth={1.5} color="var(--text-secondary)" />}
        emptyAction={
          <Button variant="primary" size="sm" onClick={() => navigate('/prosumers/create')}>
            <Plus size={14} className="icon-mr" /> Add First Prosumer
          </Button>
        }
      />

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: '' })}
        title="Delete Prosumer Account"
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
          Are you sure you want to delete prosumer <strong>{deleteModal.name}</strong> (NIC: {deleteModal.id})?
          This action will permanently erase their profile and cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default ProsumerList;
