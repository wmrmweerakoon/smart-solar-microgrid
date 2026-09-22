import { useState, useEffect } from 'react';
import { prosumerService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';

const PendingActivation = () => {
  const [prosumers, setProsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const response = await prosumerService.getByStatus('Pending');
      setProsumers(response.data);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load pending prosumers.' });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      await prosumerService.activate(id);
      setProsumers(prosumers.filter((p) => p.id !== id));
      setAlert({ type: 'success', message: 'Prosumer activated successfully!' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to activate prosumer.' });
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await prosumerService.deactivate(id);
      setProsumers(prosumers.filter((p) => p.id !== id));
      setAlert({ type: 'success', message: 'Prosumer deactivated.' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to deactivate prosumer.' });
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'solarCapacity', label: 'Capacity (kW)', render: (row) => `${row.solarCapacity} kW` },
    {
      key: 'status',
      label: 'Status',
      render: () => <span className="status-badge status-pending">Pending</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="btn-group">
          <Button variant="success" size="sm" onClick={() => handleActivate(row.id)}>
            ✅ Activate
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDeactivate(row.id)}>
            ❌ Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Pending Activations</h1>
        <p className="page-subtitle">Review and activate new prosumer registrations</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? '✅' : '⚠️'} {alert.message}
        </div>
      )}

      <Table
        columns={columns}
        data={prosumers}
        loading={loading}
        emptyMessage="No pending activations"
        emptyIcon="✅"
      />
    </div>
  );
};

export default PendingActivation;
