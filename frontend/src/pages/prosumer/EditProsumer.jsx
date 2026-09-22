import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { prosumerService, microgridService } from '../../services/api';
import Button from '../../components/Button';

const EditProsumer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', microgridNodeId: '', solarCapacity: '', status: '',
  });

  useEffect(() => {
    Promise.all([
      prosumerService.getById(id),
      microgridService.getAll(),
    ]).then(([prosumerRes, nodesRes]) => {
      const p = prosumerRes.data;
      setFormData({
        name: p.name, email: p.email, phone: p.phone, address: p.address,
        microgridNodeId: p.microgridNodeId, solarCapacity: p.solarCapacity, status: p.status,
      });
      setNodes(nodesRes.data);
    }).catch(() => setError('Failed to load prosumer data.'))
      .finally(() => setFetching(false));
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await prosumerService.update(id, {
        ...formData,
        solarCapacity: parseFloat(formData.solarCapacity) || 0,
      });
      navigate('/prosumers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update prosumer.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="page-container">
        <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Edit Prosumer</h1>
        <p className="page-subtitle">Update prosumer information</p>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" name="email" type="email" value={formData.email} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Solar Capacity (kW)</label>
              <input className="form-input" name="solarCapacity" type="number" step="0.1" value={formData.solarCapacity} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" name="address" value={formData.address} onChange={handleChange} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Microgrid Node</label>
              <select className="form-select" name="microgridNodeId" value={formData.microgridNodeId} onChange={handleChange}>
                <option value="">Select a node...</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>{node.nodeName} – {node.location}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="btn-group" style={{ marginTop: 24 }}>
            <Button type="submit" variant="primary" loading={loading}>💾 Update Prosumer</Button>
            <Button variant="secondary" onClick={() => navigate('/prosumers')}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProsumer;
