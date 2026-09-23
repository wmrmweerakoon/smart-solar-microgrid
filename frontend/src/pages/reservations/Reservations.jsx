import { Plus, Pencil, Trash2, PauseCircle, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservationService, prosumerService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const Reservations = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [prosumers, setProsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [resRes, prosRes] = await Promise.all([reservationService.getAll(), prosumerService.getAll()]);
      setReservations(resRes.data);
      setProsumers(prosRes.data);
    } catch { setAlert({ type: 'error', message: 'Failed to load reservations.' }); }
    finally { setLoading(false); }
  };

  const findName = (id) => prosumers.find((p) => p.id === id)?.name || '—';

  const handleConfirm = async (id) => {
    try { await reservationService.confirm(id); fetchData(); setAlert({ type: 'success', message: 'Reservation confirmed!' }); }
    catch { setAlert({ type: 'error', message: 'Failed to confirm.' }); }
  };

  const handleCancel = async (id) => {
    try { await reservationService.cancel(id); fetchData(); setAlert({ type: 'success', message: 'Reservation cancelled.' }); }
    catch { setAlert({ type: 'error', message: 'Failed to cancel.' }); }
  };

  const handleComplete = async (id) => {
    try { await reservationService.complete(id); fetchData(); setAlert({ type: 'success', message: 'Reservation completed!' }); }
    catch { setAlert({ type: 'error', message: 'Failed to complete.' }); }
  };

  const handleDelete = async () => {
    try {
      await reservationService.delete(deleteModal.id);
      setReservations(reservations.filter((r) => r.id !== deleteModal.id));
      setDeleteModal({ open: false, id: null });
      setAlert({ type: 'success', message: 'Reservation deleted.' });
    } catch { setAlert({ type: 'error', message: 'Failed to delete.' }); }
  };

  const getStatusClass = (status) => {
    const map = { Pending: 'status-pending', Confirmed: 'status-confirmed', Cancelled: 'status-cancelled', Completed: 'status-completed' };
    return map[status] || '';
  };

  const columns = [
    { key: 'buyerProsumerId', label: 'Buyer', render: (row) => findName(row.buyerProsumerId) },
    { key: 'sellerProsumerId', label: 'Seller', render: (row) => findName(row.sellerProsumerId) },
    { key: 'energyAmount', label: 'Energy (kWh)', render: (row) => `${row.energyAmount} kWh` },
    { key: 'totalPrice', label: 'Total Price', render: (row) => `$${row.totalPrice}` },
    { key: 'status', label: 'Status', render: (row) => <span className={`status-badge ${getStatusClass(row.status)}`}>{row.status}</span> },
    { key: 'reservedAt', label: 'Reserved', render: (row) => new Date(row.reservedAt).toLocaleDateString() },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="btn-group">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/reservations/${row.id}`)}>👁️</Button>
          {row.status === 'Pending' && <Button variant="success" size="sm" onClick={() => handleConfirm(row.id)}><CheckCircle size={16} className="icon-mr" /></Button>}
          {row.status === 'Confirmed' && <Button variant="primary" size="sm" onClick={() => handleComplete(row.id)}>🏁</Button>}
          {(row.status === 'Pending' || row.status === 'Confirmed') && <Button variant="danger" size="sm" onClick={() => handleCancel(row.id)}>❌</Button>}
          <Button variant="danger" size="sm" onClick={() => setDeleteModal({ open: true, id: row.id })}><Trash2 size={14} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header"><h1 className="page-title">Reservations</h1><p className="page-subtitle">Manage energy trading reservations</p></div>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.type === 'success' ? '<CheckCircle size={16} className="icon-mr" />' : '<AlertTriangle size={16} className="icon-mr" />'} {alert.message}</div>}
      <Table columns={columns} data={reservations} loading={loading} emptyMessage="No reservations found" emptyIcon="🔖" />
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null })} title="Delete Reservation"
        footer={<><Button variant="secondary" onClick={() => setDeleteModal({ open: false, id: null })}>Cancel</Button><Button variant="danger" onClick={handleDelete}>Delete</Button></>}
      >
        <p>Are you sure you want to delete this reservation? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Reservations;
