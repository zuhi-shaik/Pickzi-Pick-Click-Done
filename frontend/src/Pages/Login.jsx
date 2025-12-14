import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { AuthAPI } from '../api/client';
import { useToast } from '../Components/Toast/ToastProvider';

const Login = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.username || !form.password) {
      setError('Please enter username and password');
      return;
    }

    try {
      const data = await AuthAPI.login({ username: form.username.trim(), password: form.password });
      if (!data || !data.token) {
        const message = data?.message || 'Login failed. Please try again.';
        setError(message);
        toast.error(message);
        return;
      }

      const displayName = data.user?.name || data.user?.username || form.username;
      toast.success(`Welcome back, ${displayName}!`);
      navigate('/');
    } catch (err) {
      const message = err?.message || 'Network error. Please try again later.';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-illustration">
          <div>
            <h3>Welcome back to Pickzi!</h3>
            <p>Access exclusive deals, track your orders, and enjoy a smarter shopping experience with personalised recommendations.</p>
          </div>
          <ul className="auth-info-list">
            <li><span className="auth-info-bullet">1</span> Secure login with JWT sessions</li>
            <li><span className="auth-info-bullet">2</span> Quick checkout and saved carts</li>
            <li><span className="auth-info-bullet">3</span> Get instant alerts on offers</li>
          </ul>
        </aside>
        <section className="auth-card">
          <header>
            <h2 className="auth-title">Sign in to your account</h2>
            <p className="auth-subtitle">Enter your credentials to continue shopping with ease.</p>
          </header>
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-field">
              <label htmlFor="username">Username or Email</label>
              <input
                id="username"
                type="text"
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder="jane.doe"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="auth-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {error ? <div className="auth-error">{error}</div> : null}
            <button type="submit" className="auth-button">Login</button>
          </form>
          <div className="auth-link-row">
            <Link className="auth-link" to="/forgot-password">Forgot password?</Link>
            <span className="auth-note">Need an account?</span>
          </div>
          <div className="auth-link-row" style={{ justifyContent: 'flex-start' }}>
            <span>New user?</span>
            <Link className="auth-link" to="/register">Create an account</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;
