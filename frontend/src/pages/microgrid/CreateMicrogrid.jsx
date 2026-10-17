import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, AlertTriangle, ArrowLeft, MapPin, Calendar, Clock } from 'lucide-react';
import { microgridService } from '../../services/api';
import Button from '../../components/Button';
import LocationPickerMap from '../../components/LocationPickerMap';

const CreateMicrogrid = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nodeName: '',
    location: '',
    capacity: '',
    batteryStorageSlots: '',
    latitude: '',
    longitude: '',
    status: 'Active',
  });
  const [schedules, setSchedules] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const field = name === 'gridNodeName' ? 'nodeName' : name;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
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
    setSchedules([
      ...schedules,
      {
        scheduleType: 'Weekly',
        dayOfWeek: 'Monday',
        startDate: '',
        endDate: '',
        startTime: '08:00',
        endTime: '18:00'
      }
    ]);
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
    setError('');

    if (!formData.nodeName.trim()) {
      setError('Node name is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.location.trim()) {
      setError('Location is required. Please choose a location from the map or type a city.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const capacityVal = parseFloat(formData.capacity);
    if (isNaN(capacityVal) || capacityVal <= 0) {
      setError('Capacity is required and must be greater than 0 kW.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate operational schedules
    for (let i = 0; i < schedules.length; i++) {
      const s = schedules[i];
      if (s.scheduleType === 'DateRange') {
        if (!s.startDate || !s.endDate) {
          setError(`Schedule #${i + 1}: Please select both Start Date and End Date for the date range.`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        if (s.startDate > s.endDate) {
          setError(`Schedule #${i + 1}: End Date cannot be before Start Date.`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
      if (!s.startTime || !s.endTime) {
        setError(`Schedule #${i + 1}: Please specify both Start Time and End Time.`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (s.startTime >= s.endTime) {
        setError(`Schedule #${i + 1}: End Time (${s.endTime}) must be later than Start Time (${s.startTime}).`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setLoading(true);
    try {
      await microgridService.create({
        nodeName: formData.nodeName.trim(),
        location: formData.location.trim(),
        capacity: capacityVal,
        batteryStorageSlots: parseInt(formData.batteryStorageSlots) || 0,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        status: formData.status || 'Active',
        schedules
      });

      navigate('/microgrid', {
        state: { message: `Microgrid node "${formData.nodeName.trim()}" created successfully!` }
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create node.';
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-actions" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Add Microgrid Node</h1>
          <p className="page-subtitle">Register a new microgrid infrastructure node with geographic positioning</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/microgrid')}>
          <ArrowLeft size={16} className="icon-mr" /> Back to Nodes
        </Button>
      </div>

      <div className="card" style={{ maxWidth: 880, margin: '0 auto' }}>
        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <span>{error}</span>
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

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Capacity (kW) *</label>
              <input
                className="form-input"
                name="capacity"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="e.g. 500"
                required
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
                placeholder="e.g. 10"
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

          {/* Interactive Map Picker */}
          <LocationPickerMap
            latitude={formData.latitude}
            longitude={formData.longitude}
            locationName={formData.location}
            onLocationSelect={handleMapLocationSelect}
          />

          {/* Coordinates (auto-filled, fine-tunable) */}
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
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={18} color="var(--primary)" /> Operational Schedules & Date Ranges
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Configure weekly operating days or custom calendar date ranges for grid station availability.
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addSchedule}>
                <Plus size={16} className="icon-mr" /> Add Schedule
              </Button>
            </div>

            {schedules.length === 0 && (
              <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px dashed var(--border)', borderRadius: 6, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                  No custom operational schedules added. By default, this node operates <strong>24/7</strong>.
                </p>
              </div>
            )}

            {schedules.map((schedule, i) => {
              const isDateRange = schedule.scheduleType === 'DateRange';
              return (
                <div
                  key={i}
                  style={{
                    padding: 16,
                    marginBottom: 14,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                        Schedule #{i + 1}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: isDateRange ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: isDateRange ? '#60a5fa' : '#34d399',
                          fontWeight: 500
                        }}
                      >
                        {isDateRange ? '📅 Custom Date Range' : '🔄 Weekly Recurring'}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeSchedule(i)}
                      title="Remove schedule"
                    >
                      <Trash2 size={13} className="icon-mr" /> Remove
                    </Button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isDateRange ? '1.2fr 1fr 1fr 0.9fr 0.9fr' : '1.3fr 1.5fr 1fr 1fr',
                      gap: 12,
                      alignItems: 'flex-end'
                    }}
                  >
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Schedule Type</label>
                      <select
                        className="form-select"
                        value={schedule.scheduleType || 'Weekly'}
                        onChange={(e) => handleScheduleChange(i, 'scheduleType', e.target.value)}
                      >
                        <option value="Weekly">Weekly (Day of Week)</option>
                        <option value="DateRange">Date Range (From - To)</option>
                      </select>
                    </div>

                    {isDateRange ? (
                      <>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Start Date *</label>
                          <input
                            type="date"
                            className="form-input"
                            value={schedule.startDate || ''}
                            onChange={(e) => handleScheduleChange(i, 'startDate', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>End Date *</label>
                          <input
                            type="date"
                            className="form-input"
                            value={schedule.endDate || ''}
                            onChange={(e) => handleScheduleChange(i, 'endDate', e.target.value)}
                            required
                          />
                        </div>
                      </>
                    ) : (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Day of Week</label>
                        <select
                          className="form-select"
                          value={schedule.dayOfWeek || 'Monday'}
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
                          <option value="Weekends">Weekends</option>
                        </select>
                      </div>
                    )}

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Start Time</label>
                      <input
                        type="time"
                        className="form-input"
                        value={schedule.startTime || '08:00'}
                        onChange={(e) => handleScheduleChange(i, 'startTime', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>End Time</label>
                      <input
                        type="time"
                        className="form-input"
                        value={schedule.endTime || '18:00'}
                        onChange={(e) => handleScheduleChange(i, 'endTime', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
              <AlertTriangle size={18} color="var(--danger)" />
              <span>{error}</span>
            </div>
          )}

          <div className="btn-group" style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <Button type="submit" variant="primary" loading={loading}>
              <Save size={16} className="icon-mr" /> Create Node
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

export default CreateMicrogrid;
