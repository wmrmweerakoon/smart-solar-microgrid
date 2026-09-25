import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle,
  Battery,
  Search,
  RotateCcw,
  Zap,
  Calendar,
  Clock,
  DollarSign
} from 'lucide-react';
import { energySlotService, prosumerService, microgridService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

/**
 * Energy Slot Management Page (Member 1).
 * Displays available and scheduled energy generation slots with filtering, creation modal, and inventory control.
 */
const EnergySlots = () => {
  const [slots, setSlots] = useState([]);
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [prosumers, setProsumers] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [nodeFilter, setNodeFilter] = useState('All');

  const [formData, setFormData] = useState({
    microgridNodeId: '',
    prosumerId: '',
    energyAmount: '',
    pricePerUnit: '',
    slotDate: '',
    startTime: '09:00',
    endTime: '12:00',
  });

  useEffect(() => {
    fetchSlots();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, nodeFilter, slots, prosumers, nodes]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const [slotsRes, prosumersRes, nodesRes] = await Promise.all([
        energySlotService.getAll(),
        prosumerService.getAll().catch(() => ({ data: [] })),
        microgridService.getAll().catch(() => ({ data: [] })),
      ]);
      setSlots(slotsRes.data);
      setProsumers(prosumersRes.data);
      setNodes(nodesRes.data);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load energy slots from server.' });
    } finally {
      setLoading(false);
    }
  };

  const findName = (list, id, field = 'name') => {
    const item = list.find((i) => i.id === id || i.nic === id);
    return item ? item[field] : id || '—';
  };

  const applyFilters = () => {
    let result = [...slots];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((s) => {
        const pName = findName(prosumers, s.prosumerId, 'name').toLowerCase();
        const nName = findName(nodes, s.microgridNodeId, 'nodeName').toLowerCase();
        return (
          s.id?.toLowerCase().includes(q) ||
          s.prosumerId?.toLowerCase().includes(q) ||
          pName.includes(q) ||
          nName.includes(q)
        );
      });
    }

    if (statusFilter !== 'All') {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (nodeFilter !== 'All') {
      result = result.filter((s) => s.microgridNodeId === nodeFilter);
    }

    setFilteredSlots(result);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.microgridNodeId || !formData.prosumerId) {
      setFormError('Please select both a Microgrid Node and a Supplier Prosumer.');
      return;
    }
    if (!formData.energyAmount || parseFloat(formData.energyAmount) <= 0) {
      setFormError('Energy amount must be greater than zero.');
      return;
    }
    if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0) {
      setFormError('Price per unit must be greater than zero.');
      return;
    }
    if (!formData.slotDate) {
      setFormError('Slot date is required.');
      return;
    }

    setCreateLoading(true);
    try {
      await energySlotService.create({
        ...formData,
        energyAmount: parseFloat(formData.energyAmount) || 0,
        pricePerUnit: parseFloat(formData.pricePerUnit) || 0,
        slotDate: new Date(formData.slotDate).toISOString(),
      });
      setShowCreate(false);
      setFormData({
        microgridNodeId: '',
        prosumerId: '',
        energyAmount: '',
        pricePerUnit: '',
        slotDate: '',
        startTime: '09:00',
        endTime: '12:00',
      });
      fetchSlots();
      setAlert({ type: 'success', message: 'Energy slot added to marketplace successfully.' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create energy slot.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this available energy slot from the system?')) return;
    try {
      await energySlotService.delete(id);
      setSlots(slots.filter((s) => s.id !== id));
      setAlert({ type: 'success', message: 'Energy slot removed.' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to delete slot.' });
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'status-available';
      case 'booked':
        return 'status-booked';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-available';
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Slot ID',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-light)' }}>
          {row.id ? row.id.slice(-8) : '—'}
        </span>
      ),
    },
    {
      key: 'prosumerId',
      label: 'Prosumer (Seller)',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{findName(prosumers, row.prosumerId, 'name')}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.prosumerId}</div>
        </div>
      ),
    },
    {
      key: 'microgridNodeId',
      label: 'Node',
      render: (row) => findName(nodes, row.microgridNodeId, 'nodeName'),
    },
    {
      key: 'energyAmount',
      label: 'Capacity',
      render: (row) => <strong>{row.energyAmount} kWh</strong>,
    },
    {
      key: 'pricePerUnit',
      label: 'Unit Price',
      render: (row) => `$${row.pricePerUnit}/kWh`,
    },
    {
      key: 'slotDate',
      label: 'Date & Time',
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
      render: (row) =>
        row.status === 'Available' ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(row.id)}
            title="Delete Available Slot"
          >
            <Trash2 size={14} />
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Energy Slots Marketplace</h1>
          <p className="page-subtitle">Manage tradable time-indexed solar energy allocations</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="icon-mr" /> Create Energy Slot
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
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search by Prosumer, Node, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>

          <div style={{ flex: '1 1 160px' }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <select
              className="form-control"
              value={nodeFilter}
              onChange={(e) => setNodeFilter(e.target.value)}
            >
              <option value="All">All Microgrid Nodes</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nodeName}
                </option>
              ))}
            </select>
          </div>

          {(searchTerm || statusFilter !== 'All' || nodeFilter !== 'All') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setNodeFilter('All');
              }}
            >
              <RotateCcw size={14} className="icon-mr" /> Reset
            </Button>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredSlots}
        loading={loading}
        emptyMessage="No energy slots match your search criteria"
        emptyIcon={<Battery size={44} strokeWidth={1.5} color="var(--accent)" />}
        emptyAction={
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} className="icon-mr" /> Create Energy Slot
          </Button>
        }
      />

      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          setFormError('');
        }}
        title="Create New Energy Slot"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={createLoading} onClick={handleCreate}>
              <Save size={16} className="icon-mr" /> Publish Slot
            </Button>
          </>
        }
      >
        {formError && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={16} color="var(--danger)" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreate}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" htmlFor="slotProsumerId">Supplier Prosumer *</label>
            <select
              id="slotProsumerId"
              className="form-control"
              name="prosumerId"
              value={formData.prosumerId}
              onChange={handleChange}
              required
            >
              <option value="">Select Prosumer...</option>
              {prosumers.map((p) => (
                <option key={p.nic || p.id} value={p.nic || p.id}>
                  {p.name} ({p.nic || p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" htmlFor="slotNodeId">Microgrid Node *</label>
            <select
              id="slotNodeId"
              className="form-control"
              name="microgridNodeId"
              value={formData.microgridNodeId}
              onChange={handleChange}
              required
            >
              <option value="">Select Microgrid Node...</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nodeName} ({n.location})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="slotEnergy">Energy Amount (kWh) *</label>
              <input
                id="slotEnergy"
                className="form-control"
                name="energyAmount"
                type="number"
                step="0.5"
                min="0.1"
                placeholder="e.g. 50"
                value={formData.energyAmount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="slotPrice">Price per kWh ($) *</label>
              <input
                id="slotPrice"
                className="form-control"
                name="pricePerUnit"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 0.25"
                value={formData.pricePerUnit}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" htmlFor="slotDate">Slot Date *</label>
            <input
              id="slotDate"
              className="form-control"
              name="slotDate"
              type="date"
              value={formData.slotDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="slotStart">Start Time *</label>
              <input
                id="slotStart"
                className="form-control"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="slotEnd">End Time *</label>
              <input
                id="slotEnd"
                className="form-control"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EnergySlots;
