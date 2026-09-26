import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, PauseCircle, Save, AlertTriangle, CheckCircle, ArrowLeft, MapPin } from 'lucide-react';
import { microgridService } from '../../services/api';
import Button from '../../components/Button';
import LocationPickerMap from '../../components/LocationPickerMap';

const EditMicrogrid = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    nodeName: '',
    location: '',
    capacity: '',
    batteryStorageSlots: '',
    currentLoad: '',
    latitude: '',
    longitude: '',
    status: 'Active',
  });
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    microgridService.getById(id).then((res) => {
      const n = res.data;
      setFormData({ 
        nodeName: n.nodeName || '',
        location: n.location || '',
        capacity: n.capacity ?? '',
        currentLoad: n.currentLoad ?? '', 
        latitude: n.latitude !== undefined && n.latitude !== null ? n.latitude.toString() : '',
        longitude: n.longitude !== undefined && n.longitude !== null ? n.longitude.toString() : '',
        status: n.status || 'Active',
        batteryStorageSlots: n.batteryStorageSlots ?? ''
      });
      setSchedules(n.schedules || []);
    }).catch(() => setError('Failed to load node data.')).finally(() => setFetching(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const field = name === 'gridNodeName' ? 'nodeName' : name;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  // Called automatically when user clicks map, moves marker, or chooses a preset
  const handleMapLocationSelect = ({ latitude, longitude, location }) => {
    setFormData((prev) => ({
      ...prev,
      latitude,
      longitude,
      location: location || prev.location,
    }));
    setError('');
  };

  const addSchedule = () => {
    setSchedules([...schedules, { dayOfWeek: 'Monday', startTime: '08:00', endTime: '18:00' }]);
  };

  const removeSchedule = (index) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (index, field, value) => {
    const updated = [...schedules];
    updated[index][field] = value;
    setSchedules(updated);
  };

  const handleDeactivate = async () => {
    try {
      setLoading(true);
      const res = await microgridService.deactivate(id);
      setFormData({ ...formData, status: res.data.status });
      setSuccess('Node deactivated successfully.');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate node.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nodeName || !formData.location) {
      setError('Node name and location are required.');
      return;
    }
    setLoading(true);
    try {
      await microgridService.update(id, {
        ...formData,
        capacity: parseFloat(formData.capacity) || 0,
        batteryStorageSlots: parseInt(formData.batteryStorageSlots) || 0,
        currentLoad: parseFloat(formData.currentLoad) || 0,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        schedules
      });
      navigate('/microgrid');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update node.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Loading node data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-actions" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Edit Microgrid Node</h1>
          <p className="page-subtitle">Update node configuration and geographic location</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {formData.status === 'Active' && (
            <Button variant="danger" onClick={handleDeactivate} loading={loading}>
              <PauseCircle size={15} className="icon-mr" /> Deactivate Node
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/microgrid')}>
            <ArrowLeft size={15} className="icon-mr" /> Back to Nodes
          </Button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 840, margin: '0 auto' }}>
        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <CheckCircle size={18} color="var(--success)" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Node Name *</label>
              <input
                className="form-input"
                name="gridNodeName"
                value={formData.nodeName}
                onChange={handleChange}
                placeholder="e.g. Node Silver Moon"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={15} color="var(--primary)" />
                Location *
              </label>
              <input
                className="form-input"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Galle, Colombo, Kandy"
                required
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                Auto-detected when you click the map below, or type custom city.
              </small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Capacity (kW)</label>
              <input
                className="form-input"
                name="capacity"
                type="number"
                step="0.1"
                min="0"
                value={formData.capacity}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Battery Storage Slots</label>
              <input
                className="form-input"
                name="batteryStorageSlots"
                type="number"
                min="0"
                value={formData.batteryStorageSlots}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Current Load (kW)</label>
              <input
                className="form-input"
                name="currentLoad"
                type="number"
                step="0.1"
                value={formData.currentLoad}
                disabled
                title="Current load is monitored live from telemetry"
              />
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

          {/* Interactive Map Location Picker */}
          <LocationPickerMap
            latitude={formData.latitude}
            longitude={formData.longitude}
            locationName={formData.location}
            onLocationSelect={handleMapLocationSelect}
          />

          {/* Latitude & Longitude (auto-filled, fine-tunable) */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Latitude (Auto-detected)</label>
              <input
                className="form-input"
                name="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="e.g. 6.0535"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude (Auto-detected)</label>
              <input
                className="form-input"
                name="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="e.g. 80.2210"
              />
            </div>
          </div>

          {/* Operational Schedules */}
          <div style={{ marginTop: 24, padding: 18, border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 8px)', background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Operational Schedules</h3>
              <Button type="button" variant="secondary" size="sm" onClick={addSchedule}>
                <Plus size={16} className="icon-mr" /> Add Schedule
              </Button>
            </div>
            {schedules.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                No schedules added yet. Default operational schedule will be 24/7.
              </p>
            )}
            {schedules.map((schedule, i) => (
              <div key={i} className="form-row" style={{ alignItems: 'flex-end', marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Day</label>
                  <select
                    className="form-control"
                    value={schedule.dayOfWeek}
                    onChange={(e) => handleScheduleChange(i, 'dayOfWeek', e.target.value)}
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                    <option value="Everyday">Everyday</option>
                    <option value="Weekdays">Weekdays</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={schedule.startTime}
                    onChange={(e) => handleScheduleChange(i, 'startTime', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={schedule.endTime}
                    onChange={(e) => handleScheduleChange(i, 'endTime', e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: '0 0 auto' }}>
                  <Button type="button" variant="danger" size="sm" onClick={() => removeSchedule(i)} title="Remove schedule">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="btn-group" style={{ marginTop: 28, display: 'flex', gap: 12 }}>
            <Button type="submit" variant="primary" loading={loading}>
              <Save size={16} className="icon-mr" /> Save Changes
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/microgrid')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMicrogrid;
