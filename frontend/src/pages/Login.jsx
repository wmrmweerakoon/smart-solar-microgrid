import { AlertTriangle, LogIn, Sun, Shield, Lock, ArrowLeft } from 'lucide-react';
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
      <div className="login-bg-overlay"></div>
      
      <button className="login-back-btn" onClick={() => navigate('/')} title="Back to Home">
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <div className="login-glass-card">
        <div className="login-header">
          <div className="login-logo-icon">
            <Sun size={28} color="var(--primary)" />
          </div>
          <h1>Smart Solar Microgrid</h1>
          <p>Secure System Access</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span><AlertTriangle size={16} className="icon-mr" /></span> {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group login-input-wrapper">
            <Shield className="login-input-icon" size={18} />
            <input
              id="username"
              name="username"
              type="text"
              className="form-input login-input"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className="form-group login-input-wrapper">
            <Lock className="login-input-icon" size={18} />
            <input
              id="password"
              name="password"
              type="password"
              className="form-input login-input"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <Button type="submit" variant="primary" loading={loading} size="lg" className="login-submit-btn">
            <LogIn size={18} className="icon-mr" /> Authenticate
          </Button>
        </form>

        <div className="login-footer">
          <p>Demo Credentials:</p>
          <div className="demo-credentials">
            <span><strong style={{ color: 'var(--primary-light)' }}>Admin:</strong> admin / admin123</span>
            <span><strong style={{ color: 'var(--accent-light)' }}>Operator:</strong> gridoperator / operator123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
