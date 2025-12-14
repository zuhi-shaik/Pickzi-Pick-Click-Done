import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { useToast } from '../Components/Toast/ToastProvider';

// Resolve API base URL for both Vite and CRA, fallback to localhost:5000
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL)
  || 'http://localhost:5000';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const sendOtp = async (e) => {
    e.preventDefault();
    setError('');

    const emailOk = /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);
    if (!emailOk) {
      setError('Enter a valid email');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = (data && data.message) || 'Failed to send OTP';
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success('One-time code sent to your Pickzi inbox.');
      // Proceed to OTP screen with usernameOrEmail
      navigate('/verify-otp', { state: { usernameOrEmail: email.trim() } });
    } catch (err) {
      const msg = err?.message || 'Failed to send OTP';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-illustration">
          <div>
            <h3>Reset your password securely</h3>
            <p>We’ll send a one-time code to your registered email address. Enter it on the next step to set up a new password.</p>
          </div>
          <ul className="auth-info-list">
            <li><span className="auth-info-bullet">1</span> Fast, secure OTP verification</li>
            <li><span className="auth-info-bullet">2</span> No account lockouts or downtime</li>
            <li><span className="auth-info-bullet">3</span> Continue shopping in minutes</li>
          </ul>
        </aside>
        <section className="auth-card">
          <header>
            <h2 className="auth-title">Forgot your password?</h2>
            <p className="auth-subtitle">Enter the email linked to your Pickzi account. We’ll email you the OTP.</p>
          </header>
          <form className="auth-form" onSubmit={sendOtp}>
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {error ? <div className="auth-error">{error}</div> : null}
            <button type="submit" className="auth-button">Send OTP</button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ForgotPassword;
