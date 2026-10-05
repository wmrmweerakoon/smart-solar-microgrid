import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  Sun,
  User,
  Mail,
  Phone,
  MapPin,
  Zap,
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

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    microgridService
      .getAll()
      .then((res) => setNodes(res.data))
      .catch(() => {});
  }, []);

  const validate = () => {
    const errors = {};
    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const trimmedNic = formData.nic.trim();
    if (!trimmedNic) {
      errors.nic = 'NIC is required as the primary identifier.';
    } else if (!nicRegex.test(trimmedNic)) {
      errors.nic = 'Invalid NIC format. Must be 9 digits + V/X (e.g., 981234567V) or 12 digits (e.g., 200012345678).';
    }

    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required.';
    }

    if (!formData.address.trim()) {
      errors.address = 'Property address is required.';
    }

    const capacity = parseFloat(formData.solarCapacity);
    if (!formData.solarCapacity || isNaN(capacity) || capacity <= 0) {
      errors.solarCapacity = 'Solar capacity must be greater than 0 kW.';
    }

    if (!formData.microgridNodeId) {
      errors.microgridNodeId = 'Please select a microgrid node.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      await prosumerService.create({
        nic: formData.nic.trim().toUpperCase(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        microgridNodeId: formData.microgridNodeId,
        solarCapacity: parseFloat(formData.solarCapacity) || 0,
      });
      navigate('/prosumers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register prosumer. Please check input data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-actions" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Register Solar Prosumer</h1>
          <p className="page-subtitle">Create a new prosumer profile using National Identity Card (NIC) as primary identifier</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/prosumers')}>
          <ArrowLeft size={16} className="icon-mr" /> Back to Prosumers
        </Button>
      </div>

      <div className="card" style={{ maxWidth: 780, margin: '0 auto' }}>
        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Identity Section */}
          <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="var(--primary)" /> National Identity & Personal Details
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              NIC serves as the unique primary key for prosumer verification and energy transactions.
            </p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="nic" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CreditCard size={15} color="var(--primary)" />
                NIC (National Identity Card) *
              </label>
              <input
                id="nic"
                className={`form-control ${fieldErrors.nic ? 'input-error' : ''}`}
                name="nic"
                value={formData.nic}
                onChange={handleChange}
                placeholder="e.g. 981234567V or 200012345678"
                style={{ textTransform: 'uppercase' }}
              />
              {fieldErrors.nic && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fieldErrors.nic}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={15} color="var(--accent)" />
                Full Name *
              </label>
              <input
                id="name"
                className={`form-control ${fieldErrors.name ? 'input-error' : ''}`}
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Samantha Perera"
              />
              {fieldErrors.name && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fieldErrors.name}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={15} color="var(--info)" />
                Email Address *
              </label>
              <input
                id="email"
                className={`form-control ${fieldErrors.email ? 'input-error' : ''}`}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="prosumer@solar.lk"
              />
              {fieldErrors.email && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fieldErrors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={15} color="var(--success)" />
                Phone Number *
              </label>
              <input
                id="phone"
                className={`form-control ${fieldErrors.phone ? 'input-error' : ''}`}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+94 77 123 4567"
              />
              {fieldErrors.phone && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fieldErrors.phone}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="address" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} color="var(--text-muted)" />
              Property Address *
            </label>
            <input
              id="address"
              className={`form-control ${fieldErrors.address ? 'input-error' : ''}`}
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. No. 45, Temple Road, Kandy"
            />
            {fieldErrors.address && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fieldErrors.address}</span>}
          </div>

          {/* Solar & Microgrid Section */}
          <div style={{ marginTop: 32, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sun size={18} color="var(--primary)" /> Solar Generation & Grid Allocation
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Configure property solar capacity and assign to a local microgrid node.
            </p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="solarCapacity" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={15} color="var(--primary)" />
                Solar Panel Capacity (kW) *
              </label>
              <input
                id="solarCapacity"
                className={`form-control ${fieldErrors.solarCapacity ? 'input-error' : ''}`}
                name="solarCapacity"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.solarCapacity}
                onChange={handleChange}
                placeholder="e.g. 5.5"
              />
              {fieldErrors.solarCapacity && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fieldErrors.solarCapacity}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="microgridNodeId" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={15} color="var(--accent)" />
                Assigned Microgrid Node *
              </label>
              <select
                id="microgridNodeId"
                className={`form-control ${fieldErrors.microgridNodeId ? 'input-error' : ''}`}
                name="microgridNodeId"
                value={formData.microgridNodeId}
                onChange={handleChange}
              >
                <option value="">Select a microgrid node...</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.nodeName} ({node.location}) â€” Capacity: {node.capacity} kW
                  </option>
                ))}
              </select>
              {fieldErrors.microgridNodeId && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fieldErrors.microgridNodeId}</span>}
            </div>
          </div>

          <div className="btn-group" style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button type="button" variant="secondary" onClick={() => navigate('/prosumers')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              <Save size={16} className="icon-mr" /> Register Prosumer Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProsumer;
