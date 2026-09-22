import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { setAuth } from '../utils/auth';
import Button from '../components/Button';

/**
 * Login page with premium glassmorphism card design.
 */
const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.login(formData);
      const { token, username, role, fullName, userId } = response.data;

      setAuth(token, { username, role, fullName, userId });

      // Redirect based on role
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">☀️</div>
          <h1>Smart Solar Microgrid</h1>
          <p>Trading System Administration</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              className="form-input"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <Button type="submit" variant="primary" loading={loading} size="lg">
            🔐 Sign In
          </Button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <p>Demo Credentials:</p>
          <p style={{ marginTop: 4 }}>
            <strong style={{ color: 'var(--primary-light)' }}>Backoffice:</strong> admin / admin123
          </p>
          <p>
            <strong style={{ color: 'var(--accent-light)' }}>Grid Operator:</strong> gridoperator / operator123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
