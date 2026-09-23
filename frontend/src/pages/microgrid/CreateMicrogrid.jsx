import { Plus, Pencil, Trash2, PauseCircle, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { microgridService } from '../../services/api';
import Button from '../../components/Button';

const CreateMicrogrid = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nodeName: '', location: '', capacity: '', batteryStorageSlots: '', latitude: '', longitude: '', status: 'Active',
  });
  const [schedules, setSchedules] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        batteryStorageSlots: parseInt(formData.batteryStorageSlots) || 0,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        schedules
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
      <div className="card" style={{ maxWidth: 800 }}>
        {error && <div className="alert alert-error"><AlertTriangle size={16} className="icon-mr" /> {error}</div>}
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
              <label className="form-label">Battery Storage Slots</label>
              <input className="form-input" name="batteryStorageSlots" type="number" value={formData.batteryStorageSlots} onChange={handleChange} placeholder="e.g. 5" />
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

          <div style={{ marginTop: 24, padding: 16, border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Operational Schedules</h3>
              <Button type="button" variant="secondary" size="sm" onClick={addSchedule}><Plus size={16} className="icon-mr" /> Add Schedule</Button>
            </div>
            {schedules.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No schedules added yet.</p>}
            {schedules.map((schedule, i) => (
              <div key={i} className="form-row" style={{ alignItems: 'flex-end', marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Day</label>
                  <select className="form-select" value={schedule.dayOfWeek} onChange={(e) => handleScheduleChange(i, 'dayOfWeek', e.target.value)}>
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
                  <input type="time" className="form-input" value={schedule.startTime} onChange={(e) => handleScheduleChange(i, 'startTime', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="time" className="form-input" value={schedule.endTime} onChange={(e) => handleScheduleChange(i, 'endTime', e.target.value)} />
                </div>
                <div className="form-group">
                  <Button type="button" variant="danger" onClick={() => removeSchedule(i)}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}
          </div>

          <div className="btn-group" style={{ marginTop: 24 }}>
            <Button type="submit" variant="primary" loading={loading}><Save size={16} className="icon-mr" /> Create Node</Button>
            <Button variant="secondary" onClick={() => navigate('/microgrid')}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMicrogrid;
