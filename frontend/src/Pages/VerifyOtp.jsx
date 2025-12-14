import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { useToast } from '../Components/Toast/ToastProvider';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL)
  || 'http://localhost:5000';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const usernameOrEmail = location.state?.usernameOrEmail || '';

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
      const res = await fetch(`${API_BASE}/api/users/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, otp })
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = (data && data.message) || 'Invalid OTP';
        setError(msg);
        toast.error(msg);
        return;
      }
      if (!data.resetToken) {
        const msg = 'Reset token missing from server response.';
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success('OTP verified! Let’s set a brand-new password.');
      navigate('/reset-password', {
        state: {
          resetToken: data.resetToken,
          usernameOrEmail
        }
      });
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
            <h3>Check your inbox</h3>
            <p>We've sent a one-time passcode to <strong>{usernameOrEmail}</strong>. Enter it below to verify your identity and continue resetting your password.</p>
          </div>
          <ul className="auth-info-list">
            <li><span className="auth-info-bullet">1</span> OTP expires in 5 minutes</li>
            <li><span className="auth-info-bullet">2</span> Never share the code with anyone</li>
            <li><span className="auth-info-bullet">3</span> Need help? Contact support@pickzi.com</li>
          </ul>
        </aside>
        <section className="auth-card">
          <header>
            <h2 className="auth-title">Verify your OTP</h2>
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
            <button type="submit" className="auth-button">Verify OTP</button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default VerifyOtp;
