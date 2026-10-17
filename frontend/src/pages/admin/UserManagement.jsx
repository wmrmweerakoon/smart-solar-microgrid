import { useState, useEffect } from 'react';
import {
  Shield,
  UserPlus,
  Users,
  CheckCircle,
  AlertTriangle,
  Search,
  PowerOff,
  Lock,
  Mail,
  User as UserIcon,
  RotateCcw
} from 'lucide-react';
import { authService } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

/**
 * User Management Administration Page (Backoffice Only).
 * Allows managing system administrators and grid site operators with role assignments.
 */
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'GridOperator',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, roleFilter, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await authService.getUsers();
      setUsers(response.data || []);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load system users.' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...users];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== 'All') {
      result = result.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(result);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setModalError('');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) {
      setModalError('Username and password are required.');
      return;
    }

    if (formData.password.length < 6) {
      setModalError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      await authService.createUser(formData);
      setAlert({
        type: 'success',
        message: `User "${formData.username}" (${formData.role}) created successfully!`,
      });
      setCreateModalOpen(false);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        email: '',
        role: 'GridOperator',
      });
      await fetchUsers();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.isActive;
      await authService.updateUserStatus(user.id, newStatus);
      setAlert({
        type: 'success',
        message: `User "${user.username}" status updated to ${newStatus ? 'Active' : 'Inactive'}.`,
      });
      await fetchUsers();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update user status.',
      });
    }
  };

  const columns = [
    {
      key: 'username',
      label: 'Username',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.username}</span>
        </div>
      ),
    },
    {
      key: 'fullName',
      label: 'Full Name',
      render: (row) => row.fullName || '-',
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => row.email || '-',
    },
    {
      key: 'role',
      label: 'System Role',
      render: (row) => (
        <span
          className={`navbar-role ${row.role === 'Backoffice' ? 'role-backoffice' : 'role-gridoperator'}`}
          style={{ display: 'inline-block' }}
        >
          {row.role === 'Backoffice' ? 'Backoffice Admin' : 'Grid Operator'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.isActive ? 'status-active' : 'status-inactive'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      render: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        // Prevent deactivating own default admin account
        const isMasterAdmin = row.username?.toLowerCase() === 'admin';
        return (
          <div className="btn-group">
            <Button
              variant={row.isActive ? 'secondary' : 'success'}
              size="sm"
              disabled={isMasterAdmin}
              onClick={() => handleToggleStatus(row)}
              title={isMasterAdmin ? 'Cannot deactivate root administrator' : row.isActive ? 'Deactivate User' : 'Activate User'}
            >
              {row.isActive ? (
                <>
                  <PowerOff size={14} className="icon-mr" /> Deactivate
                </>
              ) : (
                <>
                  <CheckCircle size={14} className="icon-mr" /> Activate
                </>
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  const totalUsers = users.length;
  const backofficeUsers = users.filter((u) => u.role === 'Backoffice').length;
  const operatorUsers = users.filter((u) => u.role === 'GridOperator').length;

  return (
    <div className="page-container">
      <div className="page-header-actions" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            System administration: manage Backoffice officers and Grid Operators with role access
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
          <UserPlus size={16} className="icon-mr" /> Add New User
        </Button>
      </div>

      {alert && (
        <div
          className={`alert alert-${alert.type}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}
        >
          {alert.type === 'success' ? (
            <CheckCircle size={18} color="var(--success)" />
          ) : (
            <AlertTriangle size={18} color="var(--danger)" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon primary">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{totalUsers}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon primary">
            <Shield size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Backoffice Admins</div>
            <div className="stat-value">{backofficeUsers}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon primary">
            <UserIcon size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Grid Site Operators</div>
            <div className="stat-value">{operatorUsers}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search by username, full name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>

          <div style={{ flex: '1 1 180px' }}>
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All">All System Roles</option>
              <option value="Backoffice">Backoffice Admin</option>
              <option value="GridOperator">Grid Operator</option>
            </select>
          </div>

          {(searchTerm || roleFilter !== 'All') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('All');
              }}
            >
              <RotateCcw size={14} className="icon-mr" /> Reset
            </Button>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage="No system users found"
        emptySubtext="Create an operator or administrator using the Add New User button."
      />

      {/* Add New User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New System User"
      >
        {modalError && (
          <div
            className="alert alert-error"
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}
          >
            <AlertTriangle size={16} color="var(--danger)" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label className="form-label">Username *</label>
            <div style={{ position: 'relative' }}>
              <UserIcon
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                name="username"
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="e.g. operator_john"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password * (min 6 characters)</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="password"
                name="password"
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="Enter secure password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                className="form-input"
                placeholder="e.g. John Silva"
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={15}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  placeholder="john@smartsolar.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role Assignment *</label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleInputChange}
              required
            >
              <option value="GridOperator">Grid Operator (Operational Tools Access)</option>
              <option value="Backoffice">Backoffice (System Administration Access)</option>
            </select>
            <small
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                marginTop: 6,
                display: 'block',
              }}
            >
              {formData.role === 'Backoffice'
                ? 'Backoffice users have full system administration rights, user management, and prosumer activation/deletion permissions.'
                : 'Grid Operators have access to operational tools: microgrid hubs, energy slots, bookings, and reservations.'}
            </small>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
