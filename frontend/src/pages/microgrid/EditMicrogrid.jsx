import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { microgridService } from '../../services/api';
import Button from '../../components/Button';

const EditMicrogrid = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nodeName: '', location: '', capacity: '', currentLoad: '', latitude: '', longitude: '', status: 'Active',
  });

  useEffect(() => {
    microgridService.getById(id).then((res) => {
      const n = res.data;
      setFormData({ nodeName: n.nodeName, location: n.location, capacity: n.capacity, currentLoad: n.currentLoad, latitude: n.latitude, longitude: n.longitude, status: n.status });
    }).catch(() => setError('Failed to load node data.')).finally(() => setFetching(false));
  }, [id]);

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await microgridService.update(id, {
        ...formData,
        capacity: parseFloat(formData.capacity) || 0,
        currentLoad: parseFloat(formData.currentLoad) || 0,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
      });
      navigate('/microgrid');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update node.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="page-container"><div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading...</span></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Edit Microgrid Node</h1>
        <p className="page-subtitle">Update node configuration</p>
      </div>
      <div className="card" style={{ maxWidth: 700 }}>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Node Name *</label><input className="form-input" name="nodeName" value={formData.nodeName} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Location *</label><input className="form-input" name="location" value={formData.location} onChange={handleChange} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Capacity (kW)</label><input className="form-input" name="capacity" type="number" step="0.1" value={formData.capacity} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Current Load (kW)</label><input className="form-input" name="currentLoad" type="number" step="0.1" value={formData.currentLoad} onChange={handleChange} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Latitude</label><input className="form-input" name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Longitude</label><input className="form-input" name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} /></div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
              <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Maintenance">Maintenance</option>
            </select>
          </div>
          <div className="btn-group" style={{ marginTop: 24 }}>
            <Button type="submit" variant="primary" loading={loading}>💾 Update Node</Button>
            <Button variant="secondary" onClick={() => navigate('/microgrid')}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMicrogrid;
