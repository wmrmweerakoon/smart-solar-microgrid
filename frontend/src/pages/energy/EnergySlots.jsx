import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle,
  Bookmark,
  Filter,
  Search,
  RotateCcw,
  Zap,
  Calendar,
  Clock,
  Battery
} from 'lucide-react';
import { energySlotService, prosumerService, microgridService, reservationService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

/**
 * Energy Slot Management Page (Member 1).
 * Displays available and scheduled energy generation slots with filtering, creation modal, and inventory control.
 */
const EnergySlots = () => {
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [prosumers, setProsumers] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [nodeFilter, setNodeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Create Slot Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    microgridNodeId: '',
    prosumerId: '',
    energyAmount: '',
    pricePerUnit: '',
    slotDate: '',
    startTime: '09:00',
    endTime: '12:00',
  });

  // Reserve Slot Modal State
  const [reserveModal, setReserveModal] = useState({
    open: false,
    slot: null,
    buyerProsumerId: '',
    energyAmount: '',
    notes: '',
  });
  const [reserveLoading, setReserveLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [slotsRes, prosumersRes, nodesRes] = await Promise.all([
        energySlotService.getAll(),
        prosumerService.getAll().catch(() => ({ data: [] })),
        microgridService.getAll().catch(() => ({ data: [] })),
      ]);
      setSlots(slotsRes.data || []);
      setProsumers(prosumersRes.data || []);
      setNodes(nodesRes.data || []);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load energy slots and related data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!formData.prosumerId || !formData.microgridNodeId || !formData.energyAmount || !formData.pricePerUnit || !formData.slotDate || !formData.startTime || !formData.endTime) {
      setFormError('Please fill in all required slot parameters.');
      return;
    }

    setCreateLoading(true);
    try {
      await energySlotService.create({
        ...formData,
        energyAmount: parseFloat(formData.energyAmount),
        pricePerUnit: parseFloat(formData.pricePerUnit),
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
      await fetchData();
      setAlert({ type: 'success', message: 'New energy slot published successfully!' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create energy slot.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Delete this available energy slot?')) return;
    try {
      await energySlotService.delete(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
      setAlert({ type: 'success', message: 'Energy slot deleted successfully.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete slot.' });
    }
  };

  const openReserveModal = (slot) => {
    setReserveModal({
      open: true,
      slot,
      buyerProsumerId: '',
      energyAmount: slot.energyAmount.toString(),
      notes: '',
    });
  };

  const handleReserveSubmit = async (e) => {
    e.preventDefault();
    if (!reserveModal.buyerProsumerId) {
      setAlert({ type: 'error', message: 'Please select a buyer prosumer to claim this energy slot.' });
      return;
    }

    const requestedAmount = parseFloat(reserveModal.energyAmount);
    if (!requestedAmount || requestedAmount <= 0 || requestedAmount > reserveModal.slot.energyAmount) {
      setAlert({ type: 'error', message: `Energy amount must be between 0.1 and ${reserveModal.slot.energyAmount} kWh.` });
      return;
    }

    setReserveLoading(true);
    try {
      const calculatedTotal = requestedAmount * reserveModal.slot.pricePerUnit;
      await reservationService.create({
        energySlotId: reserveModal.slot.id,
        buyerProsumerId: reserveModal.buyerProsumerId,
        sellerProsumerId: reserveModal.slot.prosumerId,
        microgridNodeId: reserveModal.slot.microgridNodeId,
        energyAmount: requestedAmount,
        totalPrice: calculatedTotal,
        notes: reserveModal.notes,
      });

      setReserveModal({ open: false, slot: null, buyerProsumerId: '', energyAmount: '', notes: '' });
      await fetchData();
      setAlert({ type: 'success', message: 'Energy reservation created successfully!' });
      navigate('/reservations');
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to reserve energy slot.' });
    } finally {
      setReserveLoading(false);
    }
  };

  const findProsumer = (nicOrId) => prosumers.find((p) => p.nic === nicOrId || p.id === nicOrId);
  const findNode = (id) => nodes.find((n) => n.id === id);

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

  // Filter slots
  const filteredSlots = slots.filter((slot) => {
    const seller = findProsumer(slot.prosumerId);
    const node = findNode(slot.microgridNodeId);

    // Text search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchSeller = seller && (seller.name.toLowerCase().includes(term) || seller.nic?.toLowerCase().includes(term));
      const matchNode = node && (node.nodeName.toLowerCase().includes(term) || node.location.toLowerCase().includes(term));
      const matchId = slot.id?.toLowerCase().includes(term);
      if (!matchSeller && !matchNode && !matchId) return false;
    }

    // Status filter
    if (statusFilter !== 'All' && slot.status !== statusFilter) return false;

    // Node filter
    if (nodeFilter !== 'All' && slot.microgridNodeId !== nodeFilter) return false;

    // Date filter
    if (dateFilter) {
      const slotDateStr = new Date(slot.slotDate).toISOString().split('T')[0];
      if (slotDateStr !== dateFilter) return false;
    }

    return true;
  });

  const columns = [
    {
      key: 'id',
      label: 'Slot ID',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-light)' }}>
          {row.id ? `#${row.id.slice(-8)}` : '—'}
        </span>
      ),
    },
    {
      key: 'prosumerId',
      label: 'Seller Prosumer',
      render: (row) => {
        const p = findProsumer(row.prosumerId);
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{p ? p.name : 'Unknown'}</div>
            <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
              {row.prosumerId}
            </div>
          </div>
        );
      },
    },
    {
      key: 'microgridNodeId',
      label: 'Microgrid Node',
      render: (row) => {
        const n = findNode(row.microgridNodeId);
        return n ? `${n.nodeName} (${n.location})` : '—';
      },
    },
    {
      key: 'energyAmount',
      label: 'Capacity (kWh)',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--accent-light)' }}>
          <Zap size={14} /> {row.energyAmount} kWh
        </span>
      ),
    },
    {
      key: 'pricePerUnit',
      label: 'Price/kWh',
      render: (row) => <span style={{ fontWeight: 600, color: 'var(--primary-light)' }}>${row.pricePerUnit}</span>,
    },
    {
      key: 'slotDate',
      label: 'Date & Time',
      render: (row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={13} color="var(--text-secondary)" /> {new Date(row.slotDate).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={13} /> {row.startTime} – {row.endTime}
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
      render: (row) => (
        <div className="btn-group" style={{ flexWrap: 'nowrap' }}>
          {row.status === 'Available' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => openReserveModal(row)}
              title="Reserve this energy slot"
            >
              <Bookmark size={14} className="icon-mr" /> Reserve
            </Button>
          )}
          {row.status === 'Available' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteSlot(row.id)}
              title="Delete Slot"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Energy Slots Marketplace</h1>
          <p className="page-subtitle">Inspect, publish, and reserve tradeable solar microgrid energy slots</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="icon-mr" /> Publish Energy Slot
        </Button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {alert.type === 'success' ? <CheckCircle size={18} color="var(--success)" /> : <AlertTriangle size={18} color="var(--danger)" />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 220px', minWidth: 200 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={14} /> Search Slots
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by prosumer name, NIC, or node..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ flex: '0 1 160px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} /> Status
            </label>
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

          <div style={{ flex: '0 1 200px' }}>
            <label className="form-label">Microgrid Node</label>
            <select
              className="form-control"
              value={nodeFilter}
              onChange={(e) => setNodeFilter(e.target.value)}
            >
              <option value="All">All Nodes</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.nodeName} ({node.location})
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '0 1 170px' }}>
            <label className="form-label">Slot Date</label>
            <input
              type="date"
              className="form-control"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div>
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setNodeFilter('All');
                setDateFilter('');
              }}
            >
              <RotateCcw size={14} className="icon-mr" /> Reset
            </Button>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredSlots}
        loading={loading}
        emptyMessage="No energy slots match the specified filters"
        emptySubtext="Try adjusting your filter parameters or search terms."
        emptyIcon={<Battery size={44} strokeWidth={1.5} color="var(--accent)" />}
      />

      {/* Create Energy Slot Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Publish New Energy Slot"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={createLoading} onClick={handleCreateSlot}>
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

        <form onSubmit={handleCreateSlot}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Seller Prosumer *</label>
            <select
              className="form-control"
              name="prosumerId"
              value={formData.prosumerId}
              onChange={handleCreateChange}
              required
            >
              <option value="">Select a prosumer...</option>
              {prosumers.map((p) => (
                <option key={p.nic || p.id} value={p.nic || p.id}>
                  {p.name} ({p.nic || p.id}) — {p.solarCapacity} kW
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Assigned Microgrid Node *</label>
            <select
              className="form-control"
              name="microgridNodeId"
              value={formData.microgridNodeId}
              onChange={handleCreateChange}
              required
            >
              <option value="">Select a node...</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nodeName} ({n.location})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Energy Capacity (kWh) *</label>
              <input
                className="form-control"
                name="energyAmount"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="e.g. 25.0"
                value={formData.energyAmount}
                onChange={handleCreateChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Price per Unit ($/kWh) *</label>
              <input
                className="form-control"
                name="pricePerUnit"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 0.15"
                value={formData.pricePerUnit}
                onChange={handleCreateChange}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Slot Date *</label>
            <input
              className="form-control"
              name="slotDate"
              type="date"
              value={formData.slotDate}
              onChange={handleCreateChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input
                className="form-control"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleCreateChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time *</label>
              <input
                className="form-control"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleCreateChange}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Reserve Slot Modal */}
      <Modal
        isOpen={reserveModal.open}
        onClose={() => setReserveModal({ open: false, slot: null, buyerProsumerId: '', energyAmount: '', notes: '' })}
        title="Reserve Energy Slot"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setReserveModal({ open: false, slot: null, buyerProsumerId: '', energyAmount: '', notes: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={reserveLoading}
              onClick={handleReserveSubmit}
            >
              <Bookmark size={16} className="icon-mr" /> Confirm Reservation
            </Button>
          </>
        }
      >
        {reserveModal.slot && (
          <form onSubmit={handleReserveSubmit}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: 14, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: 4 }}>Slot Details</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Seller: <strong>{findProsumer(reserveModal.slot.prosumerId)?.name || reserveModal.slot.prosumerId}</strong><br />
                Node: {findNode(reserveModal.slot.microgridNodeId)?.nodeName || 'Microgrid'}<br />
                Date & Time: {new Date(reserveModal.slot.slotDate).toLocaleDateString()} from {reserveModal.slot.startTime} to {reserveModal.slot.endTime}<br />
                Price: ${reserveModal.slot.pricePerUnit} per kWh
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Buyer Prosumer *</label>
              <select
                className="form-control"
                value={reserveModal.buyerProsumerId}
                onChange={(e) => setReserveModal({ ...reserveModal, buyerProsumerId: e.target.value })}
                required
              >
                <option value="">Select buyer prosumer...</option>
                {prosumers
                  .filter((p) => p.status === 'Active' && p.nic !== reserveModal.slot.prosumerId && p.id !== reserveModal.slot.prosumerId)
                  .map((p) => (
                    <option key={p.nic || p.id} value={p.nic || p.id}>
                      {p.name} ({p.nic || p.id})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">Energy Amount (kWh) *</label>
                <input
                  className="form-control"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={reserveModal.slot.energyAmount}
                  value={reserveModal.energyAmount}
                  onChange={(e) => setReserveModal({ ...reserveModal, energyAmount: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Max available: {reserveModal.slot.energyAmount} kWh
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Total Price ($)</label>
                <input
                  className="form-control"
                  disabled
                  value={`$${((parseFloat(reserveModal.energyAmount) || 0) * reserveModal.slot.pricePerUnit).toFixed(2)}`}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reservation Notes (Optional)</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="e.g. EV charging demand, commercial consumption..."
                value={reserveModal.notes}
                onChange={(e) => setReserveModal({ ...reserveModal, notes: e.target.value })}
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default EnergySlots;
