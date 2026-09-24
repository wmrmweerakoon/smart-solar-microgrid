import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Eye, 
  Pencil, 
  Trash2, 
  CheckCircle, 
  CheckCheck, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  RotateCcw,
  Zap,
  Bookmark,
  Clock
} from 'lucide-react';
import { reservationService, prosumerService, microgridService, energySlotService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const Reservations = () => {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [prosumers, setProsumers] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({
    energySlotId: '',
    buyerProsumerId: '',
    energyAmount: '',
    notes: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Edit Modal (Step 4 - 12-hour notice)
  const [editModal, setEditModal] = useState({
    open: false,
    id: null,
    energyAmount: '',
    notes: '',
    maxCapacity: 0,
    pricePerUnit: 0,
  });
  const [editLoading, setEditLoading] = useState(false);

  // Cancel Modal (Step 5 - 12-hour notice)
  const [cancelModal, setCancelModal] = useState({ open: false, id: null });
  const [cancelLoading, setCancelLoading] = useState(false);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRes, prosRes, nodesRes, slotsRes] = await Promise.all([
        reservationService.getAll(),
        prosumerService.getAll(),
        microgridService.getAll(),
        energySlotService.getByStatus('Available').catch(() => ({ data: [] })),
      ]);
      setReservations(resRes.data);
      setProsumers(prosRes.data);
      setNodes(nodesRes.data);
      setAvailableSlots(slotsRes.data);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load reservations and related records.' });
    } finally {
      setLoading(false);
    }
  };

  const findProsumer = (nicOrId) => prosumers.find((p) => p.nic === nicOrId || p.id === nicOrId);
  const findNode = (id) => nodes.find((n) => n.id === id);

  // Step 2: Handle Create Reservation (Enforcing 7-day rule via API)
  const handleCreateReservation = async (e) => {
    e.preventDefault();
    if (!createData.energySlotId || !createData.buyerProsumerId || !createData.energyAmount) {
      setAlert({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    setCreateLoading(true);
    try {
      await reservationService.create({
        energySlotId: createData.energySlotId,
        buyerProsumerId: createData.buyerProsumerId,
        energyAmount: parseFloat(createData.energyAmount) || 0,
        notes: createData.notes,
      });

      setShowCreate(false);
      setCreateData({ energySlotId: '', buyerProsumerId: '', energyAmount: '', notes: '' });
      await fetchData();
      setAlert({ type: 'success', message: 'Energy reservation request created successfully!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to create reservation.' });
    } finally {
      setCreateLoading(false);
    }
  };

  // Step 4: Open Edit Modal
  const openEditModal = async (res) => {
    try {
      const details = await reservationService.getDetails(res.id);
      setEditModal({
        open: true,
        id: res.id,
        energyAmount: res.energyAmount,
        notes: res.notes || '',
        maxCapacity: details.data.energyAmount,
        pricePerUnit: details.data.pricePerUnit,
      });
    } catch {
      setEditModal({
        open: true,
        id: res.id,
        energyAmount: res.energyAmount,
        notes: res.notes || '',
        maxCapacity: res.energyAmount,
        pricePerUnit: 0,
      });
    }
  };

  // Step 4: Submit Update (Enforces 12-hour rule)
  const handleUpdateReservation = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await reservationService.update(editModal.id, {
        energyAmount: parseFloat(editModal.energyAmount) || 0,
        notes: editModal.notes,
      });
      setEditModal({ open: false, id: null, energyAmount: '', notes: '', maxCapacity: 0, pricePerUnit: 0 });
      await fetchData();
      setAlert({ type: 'success', message: 'Reservation updated successfully!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update reservation.' });
    } finally {
      setEditLoading(false);
    }
  };

  // Step 5: Cancel Reservation (Enforces 12-hour rule)
  const handleCancelReservation = async () => {
    setCancelLoading(true);
    try {
      await reservationService.cancel(cancelModal.id);
      setCancelModal({ open: false, id: null });
      await fetchData();
      setAlert({ type: 'success', message: 'Reservation cancelled and slot released back to Available.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Cancellation rejected.' });
    } finally {
      setCancelLoading(false);
    }
  };

  // Step 6: Status Transitions
  const handleConfirm = async (id) => {
    try {
      await reservationService.confirm(id);
      await fetchData();
      setAlert({ type: 'success', message: 'Reservation approved and confirmed!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to confirm reservation.' });
    }
  };

  const handleComplete = async (id) => {
    try {
      await reservationService.complete(id);
      await fetchData();
      setAlert({ type: 'success', message: 'Reservation marked as Completed!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to complete reservation.' });
    }
  };

  const handleDelete = async () => {
    try {
      await reservationService.delete(deleteModal.id);
      setDeleteModal({ open: false, id: null });
      await fetchData();
      setAlert({ type: 'success', message: 'Reservation deleted.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete.' });
    }
  };

  const getStatusClass = (status) => {
    const map = {
      Pending: 'status-pending',
      Confirmed: 'status-active',
      Completed: 'status-active',
      Cancelled: 'status-inactive',
    };
    return map[status] || '';
  };

  // Filter reservations
  const filteredReservations = reservations.filter((r) => {
    const buyer = findProsumer(r.buyerProsumerId);
    const seller = findProsumer(r.sellerProsumerId);
    const node = findNode(r.microgridNodeId);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchBuyer = buyer && (buyer.name.toLowerCase().includes(term) || buyer.nic?.toLowerCase().includes(term));
      const matchSeller = seller && (seller.name.toLowerCase().includes(term) || seller.nic?.toLowerCase().includes(term));
      const matchNode = node && (node.nodeName.toLowerCase().includes(term) || node.location.toLowerCase().includes(term));
      if (!matchBuyer && !matchSeller && !matchNode) return false;
    }

    if (statusFilter !== 'All' && r.status !== statusFilter) return false;

    return true;
  });

  const columns = [
    {
      key: 'buyerProsumerId',
      label: 'Buyer Prosumer',
      render: (row) => {
        const p = findProsumer(row.buyerProsumerId);
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{p ? p.name : 'Unknown Buyer'}</div>
            <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
              {row.buyerProsumerId}
            </div>
          </div>
        );
      },
    },
    {
      key: 'sellerProsumerId',
      label: 'Seller Prosumer',
      render: (row) => {
        const p = findProsumer(row.sellerProsumerId);
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{p ? p.name : 'Unknown Seller'}</div>
            <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
              {row.sellerProsumerId}
            </div>
          </div>
        );
      },
    },
    {
      key: 'microgridNodeId',
      label: 'Node',
      render: (row) => {
        const n = findNode(row.microgridNodeId);
        return n ? n.nodeName : '—';
      },
    },
    {
      key: 'energyAmount',
      label: 'Energy (kWh)',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
          <Zap size={14} color="var(--primary-color)" /> {row.energyAmount} kWh
        </span>
      ),
    },
    {
      key: 'totalPrice',
      label: 'Total Cost',
      render: (row) => <span style={{ fontWeight: 700 }}>${row.totalPrice}</span>,
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
      key: 'reservedAt',
      label: 'Reserved On',
      render: (row) => new Date(row.reservedAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="btn-group">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/reservations/${row.id}`)}
            title="View Details"
          >
            <Eye size={14} className="icon-mr" /> View
          </Button>

          {row.status === 'Pending' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleConfirm(row.id)}
              title="Confirm & Approve Reservation"
            >
              <CheckCircle size={14} className="icon-mr" /> Approve
            </Button>
          )}

          {row.status === 'Confirmed' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleComplete(row.id)}
              title="Mark as Completed"
            >
              <CheckCheck size={14} className="icon-mr" /> Complete
            </Button>
          )}

          {(row.status === 'Pending' || row.status === 'Confirmed') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openEditModal(row)}
              title="Update Reservation (12h notice required)"
            >
              <Pencil size={14} />
            </Button>
          )}

          {(row.status === 'Pending' || row.status === 'Confirmed') && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setCancelModal({ open: true, id: row.id })}
              title="Cancel Reservation (12h notice required)"
            >
              <XCircle size={14} />
            </Button>
          )}

          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModal({ open: true, id: row.id })}
            title="Delete Record"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const selectedSlot = availableSlots.find((s) => s.id === createData.energySlotId);

  return (
    <div className="page-container">
      <div className="page-header-actions">
        <div>
          <h1 className="page-title">Energy Reservations</h1>
          <p className="page-subtitle">Schedule, verify, and manage microgrid energy transfer reservations</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="icon-mr" /> Create Reservation
        </Button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 240px', minWidth: 200 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={14} /> Search Reservations
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by buyer, seller, or node..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ flex: '0 1 180px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} /> Status Filter
            </label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}
            >
              <RotateCcw size={14} className="icon-mr" /> Reset
            </Button>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredReservations}
        loading={loading}
        emptyMessage="No reservations match your criteria."
      />

      {/* Create Reservation Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Energy Reservation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={createLoading} onClick={handleCreateReservation}>
              <Bookmark size={16} className="icon-mr" /> Submit Reservation
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateReservation}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
            <strong>Seven-Day Scheduling Rule:</strong> Reservations must be scheduled within 7 days from today.
          </div>

          <div className="form-group">
            <label className="form-label">Available Energy Slot *</label>
            <select
              className="form-select"
              value={createData.energySlotId}
              onChange={(e) => {
                const slot = availableSlots.find((s) => s.id === e.target.value);
                setCreateData({
                  ...createData,
                  energySlotId: e.target.value,
                  energyAmount: slot ? slot.energyAmount : '',
                });
              }}
            >
              <option value="">Select an available slot...</option>
              {availableSlots.map((s) => {
                const seller = findProsumer(s.prosumerId);
                const node = findNode(s.microgridNodeId);
                return (
                  <option key={s.id} value={s.id}>
                    {new Date(s.slotDate).toLocaleDateString()} ({s.startTime}–{s.endTime}) — {s.energyAmount} kWh @ ${s.pricePerUnit}/kWh — {seller?.name || s.prosumerId} [{node?.nodeName || 'Node'}]
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Buyer Prosumer *</label>
            <select
              className="form-select"
              value={createData.buyerProsumerId}
              onChange={(e) => setCreateData({ ...createData, buyerProsumerId: e.target.value })}
            >
              <option value="">Select purchasing prosumer...</option>
              {prosumers
                .filter((p) => p.status === 'Active' && (!selectedSlot || (p.nic !== selectedSlot.prosumerId && p.id !== selectedSlot.prosumerId)))
                .map((p) => (
                  <option key={p.nic || p.id} value={p.nic || p.id}>
                    {p.name} ({p.nic || p.id})
                  </option>
                ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Energy Amount (kWh) *</label>
              <input
                className="form-input"
                type="number"
                step="0.1"
                min="0.1"
                max={selectedSlot ? selectedSlot.energyAmount : undefined}
                value={createData.energyAmount}
                onChange={(e) => setCreateData({ ...createData, energyAmount: e.target.value })}
              />
              {selectedSlot && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Max capacity: {selectedSlot.energyAmount} kWh
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Total Price ($)</label>
              <input
                className="form-input"
                disabled
                value={selectedSlot ? `$${((parseFloat(createData.energyAmount) || 0) * selectedSlot.pricePerUnit).toFixed(2)}` : '$0.00'}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-input"
              rows="2"
              placeholder="e.g. Demand peak backup, commercial operations..."
              value={createData.notes}
              onChange={(e) => setCreateData({ ...createData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Edit Reservation Modal (12-Hour Notice) */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, id: null, energyAmount: '', notes: '', maxCapacity: 0, pricePerUnit: 0 })}
        title="Update Energy Reservation"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditModal({ open: false, id: null, energyAmount: '', notes: '', maxCapacity: 0, pricePerUnit: 0 })}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={editLoading}
              onClick={handleUpdateReservation}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateReservation}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--accent, #f59e0b)', marginBottom: 2 }}>
              <Clock size={16} /> 12-Hour Notice Requirement
            </div>
            Updates must be made at least 12 hours prior to the scheduled energy slot time.
          </div>

          <div className="form-group">
            <label className="form-label">Energy Amount (kWh) *</label>
            <input
              className="form-input"
              type="number"
              step="0.1"
              min="0.1"
              value={editModal.energyAmount}
              onChange={(e) => setEditModal({ ...editModal, energyAmount: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reservation Notes</label>
            <textarea
              className="form-input"
              rows="3"
              value={editModal.notes}
              onChange={(e) => setEditModal({ ...editModal, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Cancel Reservation Modal (12-Hour Notice) */}
      <Modal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, id: null })}
        title="Confirm Reservation Cancellation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelModal({ open: false, id: null })}>
              Keep Reservation
            </Button>
            <Button variant="danger" loading={cancelLoading} onClick={handleCancelReservation}>
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#ef4444', marginBottom: 2 }}>
            <Clock size={16} /> 12-Hour Notice Rule
          </div>
          Cancellations require at least 12 hours' advance notice before the slot begins. The energy slot will be released back to the market as Available.
        </div>
        <p>Are you sure you want to cancel this reservation?</p>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        title="Delete Reservation Record"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, id: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Record
            </Button>
          </>
        }
      >
        <p>Are you sure you want to permanently delete this reservation record?</p>
      </Modal>
    </div>
  );
};

export default Reservations;
