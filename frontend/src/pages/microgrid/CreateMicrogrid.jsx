import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { microgridService } from '../../services/api';
import Button from '../../components/Button';

const CreateMicrogrid = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nodeName: '', location: '', capacity: '', latitude: '', longitude: '', status: 'Active',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nodeName || !formData.location) {
      setError('Node name and location are required.');
      return;
    }
    setLoading(true);
    try {
      await microgridService.create({
        ...formData,
        capacity: parseFloat(formData.capacity) || 0,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
      });
      navigate('/microgrid');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create node.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Add Microgrid Node</h1>
        <p className="page-subtitle">Register a new microgrid infrastructure node</p>
      </div>
      <div className="card" style={{ maxWidth: 700 }}>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Node Name *</label>
              <input className="form-input" name="nodeName" value={formData.nodeName} onChange={handleChange} placeholder="e.g. Node-Alpha" />
            </div>
            <div className="form-group">
              <label className="form-label">Location *</label>
              <input className="form-input" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Colombo District" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Capacity (kW)</label>
              <input className="form-input" name="capacity" type="number" step="0.1" value={formData.capacity} onChange={handleChange} placeholder="e.g. 100" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-input" name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} placeholder="e.g. 6.9271" />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-input" name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} placeholder="e.g. 79.8612" />
            </div>
          </div>
          <div className="btn-group" style={{ marginTop: 24 }}>
            <Button type="submit" variant="primary" loading={loading}>💾 Create Node</Button>
            <Button variant="secondary" onClick={() => navigate('/microgrid')}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMicrogrid;
