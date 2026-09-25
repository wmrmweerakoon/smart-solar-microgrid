import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  User,
  Shield,
  Zap,
  Mail,
  Phone,
  MapPin,
  CreditCard
} from 'lucide-react';
import { prosumerService, microgridService } from '../../services/api';
import Button from '../../components/Button';

/**
 * Edit Prosumer Profile Page (Member 2).
 * Allows modifying prosumer contact, capacity, and node linkage. NIC is immutable.
 */
const EditProsumer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nic: id || '',
    name: '',
    email: '',
    phone: '',
    address: '',
    microgridNodeId: '',
    solarCapacity: '',
    status: '',
  });

  useEffect(() => {
    Promise.all([
      prosumerService.getById(id),
      microgridService.getAll(),
    ])
      .then(([prosumerRes, nodesRes]) => {
        const p = prosumerRes.data;
        setFormData({
          nic: p.nic || p.id || id,
          name: p.name || '',
          email: p.email || '',
          phone: p.phone || '',
          address: p.address || '',
          microgridNodeId: p.microgridNodeId || '',
          solarCapacity: p.solarCapacity?.toString() || '0',
          status: p.status || 'Pending',
        });
        setNodes(nodesRes.data || []);
      })
      .catch(() => setError('Failed to load prosumer profile data.'))
      .finally(() => setFetching(false));
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and Email are required.');
      return;
    }

    setLoading(true);
    try {
      await prosumerService.update(id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        microgridNodeId: formData.microgridNodeId,
        solarCapacity: parseFloat(formData.solarCapacity) || 0,
        status: formData.status,
      });
      navigate('/prosumers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update prosumer profile.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Loading prosumer data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Button variant="secondary" size="sm" onClick={() => navigate('/prosumers')} style={{ marginBottom: 12 }}>
          <ArrowLeft size={14} className="icon-mr" /> Back to Prosumers
        </Button>
        <h1 className="page-title">Edit Prosumer Profile</h1>
        <p className="page-subtitle">Update registration details for NIC #{formData.nic}</p>
      </div>

      <div className="card" style={{ maxWidth: 760, margin: '0 auto' }}>
        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Readonly NIC */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" htmlFor="nic" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCard size={15} color="var(--primary)" />
              National Identity Card (NIC) — Primary Key
            </label>
            <input
              id="nic"
              className="form-control"
              value={formData.nic}
              disabled
              style={{ background: 'var(--bg-input)', opacity: 0.75, cursor: 'not-allowed' }}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>
              NIC is immutable and uniquely identifies this account in the database.
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={15} color="var(--accent)" />
                Full Name *
              </label>
              <input
                id="name"
                className="form-control"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={15} color="var(--info)" />
                Email Address *
              </label>
              <input
                id="email"
                className="form-control"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="phone" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={15} color="var(--success)" />
                Phone Number
              </label>
              <input
                id="phone"
                className="form-control"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="solarCapacity" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={15} color="var(--primary)" />
                Solar Capacity (kW)
              </label>
              <input
                id="solarCapacity"
                className="form-control"
                name="solarCapacity"
                type="number"
                step="0.1"
                min="0"
                value={formData.solarCapacity}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="address" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} color="var(--text-secondary)" />
              Address
            </label>
            <input
              id="address"
              className="form-control"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="microgridNodeId" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={15} color="var(--accent)" />
                Microgrid Node
              </label>
              <select
                id="microgridNodeId"
                className="form-control"
                name="microgridNodeId"
                value={formData.microgridNodeId}
                onChange={handleChange}
              >
                <option value="">Select a Node...</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.nodeName} ({node.location})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="status">Account Status</label>
              <select
                id="status"
                className="form-control"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="btn-group" style={{ marginTop: 28, display: 'flex', gap: 12 }}>
            <Button type="submit" variant="primary" loading={loading}>
              <Save size={16} className="icon-mr" /> Save Changes
            </Button>
            <Button variant="secondary" onClick={() => navigate('/prosumers')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProsumer;
