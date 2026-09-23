import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, AlertTriangle, ShieldCheck, Sun, CheckCircle } from 'lucide-react';
import { prosumerService, microgridService } from '../../services/api';
import Button from '../../components/Button';

const EditProsumer = () => {
  const { id } = useParams(); // NIC or ID
  const navigate = useNavigate();

  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nic: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    microgridNodeId: '',
    solarCapacity: '',
    status: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    Promise.all([
      prosumerService.getById(id),
      microgridService.getAll().catch(() => ({ data: [] })),
    ])
      .then(([prosumerRes, nodesRes]) => {
        const p = prosumerRes.data;
        setFormData({
          nic: p.nic || p.id,
          name: p.name || '',
          email: p.email || '',
          phone: p.phone || '',
          address: p.address || '',
          microgridNodeId: p.microgridNodeId || '',
          solarCapacity: p.solarCapacity || '',
          status: p.status || 'Pending',
        });
        setNodes(nodesRes.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load prosumer profile.');
      })
      .finally(() => setFetching(false));
  }, [id]);

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const nic = formData.nic || id;
      await prosumerService.update(nic, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        microgridNodeId: formData.microgridNodeId,
        solarCapacity: parseFloat(formData.solarCapacity),
        status: formData.status,
      });

      setSuccess('Prosumer profile updated successfully!');
      setTimeout(() => {
        navigate(`/prosumers/${nic}`);
      }, 1200);
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
          <span className="loading-text">Loading profile data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-actions">
        <div>
          <h1 className="page-title">Edit Prosumer Profile</h1>
          <p className="page-subtitle">Update contact details, solar capacity, or microgrid allocation</p>
        </div>
        <div className="btn-group">
          <Button variant="secondary" onClick={() => navigate(`/prosumers/${formData.nic || id}`)}>
            <ArrowLeft size={16} className="icon-mr" /> Back to Profile
          </Button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 780, margin: '0 auto' }}>
        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Identity Header */}
          <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="var(--primary-color)" /> National Identity & Account
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              NIC serves as the permanent primary identifier and cannot be modified.
            </p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">NIC (Primary Identifier)</label>
              <input
                className="form-input"
                name="nic"
                value={formData.nic}
                disabled
                style={{ fontFamily: 'monospace', fontWeight: 700, opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className={`form-input ${fieldErrors.name ? 'input-error' : ''}`}
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
              {fieldErrors.name && <span style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fieldErrors.name}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
              {fieldErrors.email && <span style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fieldErrors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                className={`form-input ${fieldErrors.phone ? 'input-error' : ''}`}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
              {fieldErrors.phone && <span style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fieldErrors.phone}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Property Address *</label>
            <input
              className={`form-input ${fieldErrors.address ? 'input-error' : ''}`}
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
            {fieldErrors.address && <span style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fieldErrors.address}</span>}
          </div>

          {/* Grid & Solar Allocation */}
          <div style={{ marginTop: 32, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sun size={18} color="var(--primary-color)" /> Technical Parameters & Grid State
            </h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Solar Panel Capacity (kW) *</label>
              <input
                className={`form-input ${fieldErrors.solarCapacity ? 'input-error' : ''}`}
                name="solarCapacity"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.solarCapacity}
                onChange={handleChange}
              />
              {fieldErrors.solarCapacity && <span style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fieldErrors.solarCapacity}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Microgrid Node *</label>
              <select
                className={`form-select ${fieldErrors.microgridNodeId ? 'input-error' : ''}`}
                name="microgridNodeId"
                value={formData.microgridNodeId}
                onChange={handleChange}
              >
                <option value="">Select a microgrid node...</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.nodeName} — {node.location}
                  </option>
                ))}
              </select>
              {fieldErrors.microgridNodeId && <span style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fieldErrors.microgridNodeId}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Account Status</label>
            <select
              className="form-select"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="btn-group" style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button type="button" variant="secondary" onClick={() => navigate(`/prosumers/${formData.nic || id}`)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              <Save size={16} className="icon-mr" /> Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProsumer;
