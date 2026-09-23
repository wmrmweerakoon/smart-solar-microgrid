import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, PauseCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { microgridService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const MicrogridList = () => {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [alert, setAlert] = useState(null);

  useEffect(() => { fetchNodes(); }, []);

  const fetchNodes = async () => {
    try {
      const response = await microgridService.getAll();
      setNodes(response.data);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load microgrid nodes.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await microgridService.delete(deleteModal.id);
      setNodes(nodes.filter((n) => n.id !== deleteModal.id));
      setDeleteModal({ open: false, id: null, name: '' });
      setAlert({ type: 'success', message: 'Node deleted successfully.' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to delete node.' });
    }
  };

  const handleDeactivate = async (id) => {
    try {
      const res = await microgridService.deactivate(id);
      setNodes(nodes.map(n => n.id === id ? res.data : n));
      setAlert({ type: 'success', message: 'Node deactivated successfully.' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to deactivate node.';
      setAlert({ type: 'error', message: msg });
    }
  };

  const getStatusClass = (status) => {
    const map = { Active: 'status-active', Inactive: 'status-inactive', Maintenance: 'status-maintenance' };
    return map[status] || '';
  };

  const columns = [
    { key: 'nodeName', label: 'Node Name' },
    { key: 'location', label: 'Location' },
    { key: 'capacity', label: 'Capacity (kW)', render: (row) => `${row.capacity} kW` },
    { key: 'batteryStorageSlots', label: 'Battery Slots', render: (row) => row.batteryStorageSlots || 0 },
    { key: 'currentLoad', label: 'Load (kW)', render: (row) => `${row.currentLoad} kW` },
    {
      key: 'status', label: 'Status',
      render: (row) => <span className={`status-badge ${getStatusClass(row.status)}`}>{row.status}</span>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="btn-group">
          {row.status === 'Active' && (
            <Button variant="secondary" size="sm" onClick={() => handleDeactivate(row.id)}><PauseCircle size={14} className="icon-mr" /> Deactivate</Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => navigate(`/microgrid/edit/${row.id}`)}><Pencil size={14} className="icon-mr" /> Edit</Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteModal({ open: true, id: row.id, name: row.nodeName })}><Trash2 size={14} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header-actions">
        <div>
          <h1 className="page-title">Microgrid Nodes</h1>
          <p className="page-subtitle">Manage solar microgrid infrastructure</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/microgrid/create')}><Plus size={16} className="icon-mr" /> Add Node</Button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle size={16} className="icon-mr" /> : <AlertTriangle size={16} className="icon-mr" />}
          {alert.message}
        </div>
      )}

      <Table columns={columns} data={nodes} loading={loading} emptyMessage="No microgrid nodes found" emptyIcon="⚡" />

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: '' })}
        title="Delete Node"
        footer={<>
          <Button variant="secondary" onClick={() => setDeleteModal({ open: false, id: null, name: '' })}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </>}
      >
        <p>Are you sure you want to delete <strong>{deleteModal.name}</strong>?</p>
      </Modal>
    </div>
  );
};

export default MicrogridList;
