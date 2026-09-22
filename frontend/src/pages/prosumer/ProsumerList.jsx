import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { prosumerService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const ProsumerList = () => {
  const navigate = useNavigate();
  const [prosumers, setProsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchProsumers();
  }, []);

  const fetchProsumers = async () => {
    try {
      const response = await prosumerService.getAll();
      setProsumers(response.data);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load prosumers.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await prosumerService.delete(deleteModal.id);
      setProsumers(prosumers.filter((p) => p.id !== deleteModal.id));
      setDeleteModal({ open: false, id: null, name: '' });
      setAlert({ type: 'success', message: 'Prosumer deleted successfully.' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to delete prosumer.' });
    }
  };

  const getStatusClass = (status) => {
    const map = { Active: 'status-active', Pending: 'status-pending', Inactive: 'status-inactive' };
    return map[status] || '';
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'solarCapacity', label: 'Capacity (kW)', render: (row) => `${row.solarCapacity} kW` },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className={`status-badge ${getStatusClass(row.status)}`}>{row.status}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="btn-group">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/prosumers/edit/${row.id}`)}>
            ✏️ Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModal({ open: true, id: row.id, name: row.name })}
          >
            🗑️
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header-actions">
        <div>
          <h1 className="page-title">Prosumers</h1>
          <p className="page-subtitle">Manage solar energy prosumers</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/prosumers/create')}>
          ➕ Add Prosumer
        </Button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? '✅' : '⚠️'} {alert.message}
        </div>
      )}

      <Table columns={columns} data={prosumers} loading={loading} emptyMessage="No prosumers found" emptyIcon="👥" />

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: '' })}
        title="Delete Prosumer"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, id: null, name: '' })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{deleteModal.name}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default ProsumerList;
