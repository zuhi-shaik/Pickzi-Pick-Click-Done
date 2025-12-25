import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { useToast } from '../Components/Toast/ToastProvider';
import { AuthAPI } from '../api/client';

const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({ password: false, confirm: false });
  const [error, setError] = useState('');

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.username || !form.email || !form.mobile || !form.password) {
      setError('Please fill all required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        username: form.username,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        confirmPassword: form.confirmPassword
      };

      const data = await AuthAPI.register(payload);

      if (data && data.needsEmailVerification && data.user?.email) {
        toast.success('Account created! Please verify the OTP sent to your email.');
        navigate('/verify-email', { state: { email: data.user.email } });
        return;
      }

      if (!data || !data.user) {
        toast.info('Registration successful. Please login.');
        navigate('/login');
        return;
      }

      const displayName = data.user.name || data.user.username || 'Your account';
      toast.success(`${displayName} registered successfully! Welcome to Pickzi.`);
      navigate('/');
    } catch (err) {
      const msg = err?.message || 'Registration failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-illustration">
          <div className="auth-illustration-content">
            <h3>Join the Pickzi community</h3>
            <p>Create your account to unlock curated collections, personalised recommendations, and faster checkout experiences tailored just for you.</p>
          </div>
          <ul className="auth-info-list">
            <li>
              <span className="auth-icon">✨</span>
              <span>Special offers delivered to your inbox</span>
            </li>
            <li>
              <span className="auth-icon">💖</span>
              <span>Save your wishlist across devices</span>
            </li>
            <li>
              <span className="auth-icon">🚀</span>
              <span>One-click checkout with secure payments</span>
            </li>
          </ul>
        </aside>
        <section className="auth-card">
          <header className="auth-header">
            <h2 className="auth-title">Create an account</h2>
            <p className="auth-subtitle">Tell us a few details and start shopping smarter.</p>
          </header>
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-grid">
              <div className="auth-field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Jane Doe"
                  className="auth-input"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={onChange}
                  placeholder="janedoe"
                  className="auth-input"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="jane@example.com"
                  className="auth-input"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="mobile">Mobile number</label>
                <input
                  id="mobile"
                  name="mobile"
                  value={form.mobile}
                  onChange={onChange}
                  placeholder="e.g. 9876543210"
                  className="auth-input"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="password">Password</label>
                <div className="auth-password-wrapper">
                  <input
                    id="password"
                    type={showPassword.password ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder="Create a password"
                    className="auth-input"
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPassword((prev) => ({ ...prev, password: !prev.password }))}
                    tabIndex="-1"
                  >
                    {showPassword.password ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm password</label>
                <div className="auth-password-wrapper">
                  <input
                    id="confirmPassword"
                    type={showPassword.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={onChange}
                    placeholder="Repeat password"
                    className="auth-input"
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                    tabIndex="-1"
                  >
                    {showPassword.confirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="auth-error-banner">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className={`auth-button ${loading ? 'loading' : ''}`}
              disabled={loading}
              style={{ marginTop: '24px' }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link className="auth-link-highlight" to="/login">Log in</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Register;
