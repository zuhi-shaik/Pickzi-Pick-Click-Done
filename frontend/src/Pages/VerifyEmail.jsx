import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { useToast } from '../Components/Toast/ToastProvider';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL)
  || 'http://localhost:5000';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const onVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.trim().length < 4) {
      setError('Enter the OTP sent to your email');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/users/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = (data && data.message) || 'Invalid OTP';
        setError(msg);
        toast.error(msg);
        return;
      }

      // If backend returns token + user, set session via AuthAPI.login helpers
      if (data.token && data.user) {
        // Reuse AuthAPI by calling setSession via a small helper
        try {
          // AuthAPI.login normally hits /login, so we just navigate to login and let user sign in.
          toast.success('Email verified! You can now log in.');
          navigate('/login');
          return;
        } catch {
          // fall through to normal path
        }
      }

      toast.success('Email verified! You can now log in.');
      navigate('/login');
    } catch (err) {
      const msg = err?.message || 'Invalid OTP';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-illustration">
          <div>
            <h3>Confirm your email</h3>
            <p>We've sent a one-time passcode to <strong>{email}</strong>. Enter it below to verify your account.</p>
          </div>
          <ul className="auth-info-list">
            <li><span className="auth-info-bullet">1</span> OTP expires in 10 minutes</li>
            <li><span className="auth-info-bullet">2</span> Never share the code with anyone</li>
            <li><span className="auth-info-bullet">3</span> Need help? Contact support@pickzi.com</li>
          </ul>
        </aside>
        <section className="auth-card">
          <header>
            <h2 className="auth-title">Verify your email</h2>
            <p className="auth-subtitle">Enter the four-digit code we just emailed you.</p>
          </header>
          <form className="auth-form" onSubmit={onVerify}>
            <div className="auth-field">
              <label htmlFor="otp">One-time passcode</label>
              <div className="otp-row">
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="1234"
                  maxLength={6}
                />
                <button type="button" className="auth-secondary-button" onClick={() => setOtp('')}>
                  Clear
                </button>
              </div>
            </div>
            {error ? <div className="auth-error">{error}</div> : null}
            <button type="submit" className="auth-button">Verify Email</button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default VerifyEmail;
