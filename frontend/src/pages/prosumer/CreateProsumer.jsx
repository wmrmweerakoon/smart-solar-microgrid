import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { prosumerService, microgridService } from '../../services/api';
import Button from '../../components/Button';

const CreateProsumer = () => {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    microgridNodeId: '',
    solarCapacity: '',
  });

  useEffect(() => {
    microgridService.getAll().then((res) => setNodes(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setError('Name and email are required.');
      return;
    }

    setLoading(true);
    try {
      await prosumerService.create({
        ...formData,
        solarCapacity: parseFloat(formData.solarCapacity) || 0,
      });
      navigate('/prosumers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create prosumer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Add Prosumer</h1>
        <p className="page-subtitle">Register a new solar prosumer</p>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" name="name" value={formData.name} onChange={handleChange} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" name="phone" value={formData.phone} onChange={handleChange} placeholder="+94 XX XXX XXXX" />
            </div>
            <div className="form-group">
              <label className="form-label">Solar Capacity (kW)</label>
              <input className="form-input" name="solarCapacity" type="number" step="0.1" value={formData.solarCapacity} onChange={handleChange} placeholder="e.g. 5.5" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" name="address" value={formData.address} onChange={handleChange} placeholder="Street address" />
          </div>

          <div className="form-group">
            <label className="form-label">Microgrid Node</label>
            <select className="form-select" name="microgridNodeId" value={formData.microgridNodeId} onChange={handleChange}>
              <option value="">Select a node...</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>{node.nodeName} – {node.location}</option>
              ))}
            </select>
          </div>

          <div className="btn-group" style={{ marginTop: 24 }}>
            <Button type="submit" variant="primary" loading={loading}>💾 Create Prosumer</Button>
            <Button variant="secondary" onClick={() => navigate('/prosumers')}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProsumer;
