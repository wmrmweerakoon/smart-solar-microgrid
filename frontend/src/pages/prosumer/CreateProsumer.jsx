import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  AlertTriangle,
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
 * Create Prosumer Profile Page (Member 2).
 * Uses National Identity Card (NIC) as primary unique identifier.
 */
const CreateProsumer = () => {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nic: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    microgridNodeId: '',
    solarCapacity: '',
  });

  useEffect(() => {
    microgridService.getAll()
      .then((res) => setNodes(res.data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanNic = formData.nic.trim();
    if (!cleanNic) {
      setError('National Identity Card (NIC) is required as the unique identifier.');
      return;
    }

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Full Name and Email Address are required.');
      return;
    }

    if (!formData.microgridNodeId) {
      setError('Please select an associated Microgrid Node.');
      return;
    }

    setLoading(true);
    try {
      await prosumerService.create({
        nic: cleanNic,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        microgridNodeId: formData.microgridNodeId,
        solarCapacity: parseFloat(formData.solarCapacity) || 0,
      });
      navigate('/prosumers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create prosumer profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Button variant="secondary" size="sm" onClick={() => navigate('/prosumers')} style={{ marginBottom: 12 }}>
          <ArrowLeft size={14} className="icon-mr" /> Back to Prosumers
        </Button>
        <h1 className="page-title">Add Solar Prosumer</h1>
        <p className="page-subtitle">Register a new energy prosumer with unique NIC identification</p>
      </div>

      <div className="card" style={{ maxWidth: 760, margin: '0 auto' }}>
        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Primary Identifier: NIC */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" htmlFor="nic" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCard size={15} color="var(--primary)" />
              National Identity Card (NIC) *
            </label>
            <input
              id="nic"
              className="form-control"
              name="nic"
              value={formData.nic}
              onChange={handleChange}
              placeholder="e.g. 199012345678 or 901234567V"
              required
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>
              Primary key required by the microgrid governance system.
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
                placeholder="e.g. Sunil Perera"
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
                placeholder="e.g. sunil@example.com"
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
                placeholder="+94 77 123 4567"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="solarCapacity" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={15} color="var(--primary)" />
                Solar Generation Capacity (kW)
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
                placeholder="e.g. 15.5"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="address" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} color="var(--text-secondary)" />
              Premises / Property Address
            </label>
            <input
              id="address"
              className="form-control"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. 45 Lake Road, Colombo 03"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="microgridNodeId" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={15} color="var(--accent)" />
              Connected Microgrid Node *
            </label>
            <select
              id="microgridNodeId"
              className="form-control"
              name="microgridNodeId"
              value={formData.microgridNodeId}
              onChange={handleChange}
              required
            >
              <option value="">Select a Microgrid Node...</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.nodeName} ({node.location}) — Capacity: {node.capacity} kW
                </option>
              ))}
            </select>
          </div>

          <div className="btn-group" style={{ marginTop: 28, display: 'flex', gap: 12 }}>
            <Button type="submit" variant="primary" loading={loading}>
              <Save size={16} className="icon-mr" /> Save Prosumer Profile
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

export default CreateProsumer;
