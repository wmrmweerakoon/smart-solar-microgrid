import { useState, useEffect } from 'react';
import { energySlotService, prosumerService, microgridService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const EnergySlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [prosumers, setProsumers] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    microgridNodeId: '', prosumerId: '', energyAmount: '', pricePerUnit: '', slotDate: '', startTime: '', endTime: '',
  });

  useEffect(() => { fetchSlots(); }, []);

  const fetchSlots = async () => {
    try {
      const [slotsRes, prosumersRes, nodesRes] = await Promise.all([
        energySlotService.getAll(), prosumerService.getAll(), microgridService.getAll(),
      ]);
      setSlots(slotsRes.data);
      setProsumers(prosumersRes.data);
      setNodes(nodesRes.data);
    } catch { setAlert({ type: 'error', message: 'Failed to load energy slots.' }); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await energySlotService.create({
        ...formData,
        energyAmount: parseFloat(formData.energyAmount) || 0,
        pricePerUnit: parseFloat(formData.pricePerUnit) || 0,
        slotDate: formData.slotDate ? new Date(formData.slotDate).toISOString() : new Date().toISOString(),
      });
      setShowCreate(false);
      setFormData({ microgridNodeId: '', prosumerId: '', energyAmount: '', pricePerUnit: '', slotDate: '', startTime: '', endTime: '' });
      fetchSlots();
      setAlert({ type: 'success', message: 'Energy slot created!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to create slot.' });
    } finally { setCreateLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await energySlotService.delete(id);
      setSlots(slots.filter((s) => s.id !== id));
      setAlert({ type: 'success', message: 'Slot deleted.' });
    } catch { setAlert({ type: 'error', message: 'Failed to delete slot.' }); }
  };

  const getStatusClass = (status) => {
    const map = { Available: 'status-available', Booked: 'status-booked', Completed: 'status-completed', Cancelled: 'status-cancelled' };
    return map[status] || '';
  };

  const findName = (list, id, field = 'name') => list.find((i) => i.id === id)?.[field] || '—';

  const columns = [
    { key: 'prosumerId', label: 'Prosumer', render: (row) => findName(prosumers, row.prosumerId) },
    { key: 'microgridNodeId', label: 'Node', render: (row) => findName(nodes, row.microgridNodeId, 'nodeName') },
    { key: 'energyAmount', label: 'Energy (kWh)', render: (row) => `${row.energyAmount} kWh` },
    { key: 'pricePerUnit', label: 'Price/kWh', render: (row) => `$${row.pricePerUnit}` },
    { key: 'slotDate', label: 'Date', render: (row) => new Date(row.slotDate).toLocaleDateString() },
    { key: 'time', label: 'Time', render: (row) => `${row.startTime} – ${row.endTime}` },
    { key: 'status', label: 'Status', render: (row) => <span className={`status-badge ${getStatusClass(row.status)}`}>{row.status}</span> },
    {
      key: 'actions', label: '', render: (row) => row.status === 'Available' ? (
        <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>🗑️</Button>
      ) : null,
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header-actions">
        <div><h1 className="page-title">Energy Slots</h1><p className="page-subtitle">Manage tradeable energy time slots</p></div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>➕ Create Slot</Button>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.type === 'success' ? '✅' : '⚠️'} {alert.message}</div>}

      <Table columns={columns} data={slots} loading={loading} emptyMessage="No energy slots found" emptyIcon="🔋" />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Energy Slot"
        footer={<>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" loading={createLoading} onClick={handleCreate}>💾 Create</Button>
        </>}
      >
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Prosumer</label>
            <select className="form-select" name="prosumerId" value={formData.prosumerId} onChange={handleChange}>
              <option value="">Select...</option>
              {prosumers.filter(p => p.status === 'Active').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Microgrid Node</label>
            <select className="form-select" name="microgridNodeId" value={formData.microgridNodeId} onChange={handleChange}>
              <option value="">Select...</option>
              {nodes.filter(n => n.status === 'Active').map((n) => <option key={n.id} value={n.id}>{n.nodeName}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Energy (kWh)</label><input className="form-input" name="energyAmount" type="number" step="0.1" value={formData.energyAmount} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Price/kWh ($)</label><input className="form-input" name="pricePerUnit" type="number" step="0.01" value={formData.pricePerUnit} onChange={handleChange} /></div>
          </div>
          <div className="form-group"><label className="form-label">Slot Date</label><input className="form-input" name="slotDate" type="date" value={formData.slotDate} onChange={handleChange} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Start Time</label><input className="form-input" name="startTime" type="time" value={formData.startTime} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">End Time</label><input className="form-input" name="endTime" type="time" value={formData.endTime} onChange={handleChange} /></div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EnergySlots;
