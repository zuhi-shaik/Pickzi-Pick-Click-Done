import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { useToast } from '../Components/Toast/ToastProvider';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL)
  || 'http://localhost:5000';

const ResetPassword = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const resetToken = location.state?.resetToken || '';
  const usernameOrEmail = location.state?.usernameOrEmail || '';

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState({ new: false, confirm: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!resetToken) {
      const msg = 'Reset token missing. Please restart the forgot password process.';
      setError(msg);
      toast.error(msg);
    }
  }, [resetToken, toast]);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetToken) {
      setError('Reset token missing.');
      const msg = 'Reset token missing.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!form.newPassword || !form.confirmPassword) {
      const msg = 'Please enter and confirm your new password';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (form.newPassword.length < 8) {
      const msg = 'Password must be at least 8 characters long';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      const msg = 'Passwords do not match';
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = (data && data.message) || 'Failed to reset password';
        setError(msg);
        toast.error(msg);
        return;
      }

      const msg = 'Password reset successful. Redirecting to login...';
      setSuccess(msg);
      toast.success('Password reset successfully! Log in with your new credentials.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const msg = err?.message || 'Failed to reset password';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-illustration">
          <div>
            <h3>Choose a strong, memorable password</h3>
            <p>For best security, use at least 8 characters with a mix of letters, numbers, and symbols. Avoid using passwords you’ve used elsewhere.</p>
          </div>
          <ul className="auth-info-list">
            <li><span className="auth-info-bullet">1</span> Never share your password with anyone</li>
            <li><span className="auth-info-bullet">2</span> Update passwords regularly for extra safety</li>
            <li><span className="auth-info-bullet">3</span> Need help? Reach out at support@pickzi.com</li>
          </ul>
        </aside>
        <section className="auth-card">
          <header>
            <h2 className="auth-title">Reset your password</h2>
            <p className="auth-subtitle">Set a new password for <strong>{usernameOrEmail || 'your account'}</strong>.</p>
          </header>
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-field">
              <label htmlFor="newPassword">New password</label>
              <div className="auth-password-wrapper">
                <input
                  id="newPassword"
                  type={showPassword.new ? 'text' : 'password'}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={onChange}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="auth-toggle"
                  onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
                >
                  {showPassword.new ? 'Hide' : 'Show'}
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
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  className="auth-toggle"
                  onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPassword.confirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {error ? <div className="auth-error">{error}</div> : null}
            {success ? <div className="auth-success">{success}</div> : null}
            <button type="submit" className="auth-button" disabled={!resetToken}>
              Reset password
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
;

export default ResetPassword;
