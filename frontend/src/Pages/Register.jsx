import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { useToast } from '../Components/Toast/ToastProvider';
import { AuthAPI } from '../api/client';

const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();
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
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-illustration">
          <div>
            <h3>Join the Pickzi community</h3>
            <p>Create your account to unlock curated collections, personalised recommendations, and faster checkout experiences tailored just for you.</p>
          </div>
          <ul className="auth-info-list">
            <li><span className="auth-info-bullet">1</span> Special offers delivered to your inbox</li>
            <li><span className="auth-info-bullet">2</span> Save your wishlist across devices</li>
            <li><span className="auth-info-bullet">3</span> One-click checkout with secure payments</li>
          </ul>
        </aside>
        <section className="auth-card">
          <header>
            <h2 className="auth-title">Create an account</h2>
            <p className="auth-subtitle">Tell us a few details and start shopping smarter.</p>
          </header>
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-grid">
              <div className="auth-field">
                <label htmlFor="name">Full name</label>
                <input id="name" name="name" value={form.name} onChange={onChange} placeholder="Jane Doe" />
              </div>
              <div className="auth-field">
                <label htmlFor="username">Username</label>
                <input id="username" name="username" value={form.username} onChange={onChange} placeholder="janedoe" />
              </div>
              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" name="email" value={form.email} onChange={onChange} placeholder="jane@example.com" />
              </div>
              <div className="auth-field">
                <label htmlFor="mobile">Mobile number</label>
                <input id="mobile" name="mobile" value={form.mobile} onChange={onChange} placeholder="e.g. 9876543210" />
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
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPassword((prev) => ({ ...prev, password: !prev.password }))}
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
            </div>
            {error ? <div className="auth-error" style={{ marginTop: 4 }}>{error}</div> : null}
            <button type="submit" className="auth-button" style={{ marginTop: 8 }}>Create account</button>
          </form>
          <div className="auth-link-row" style={{ justifyContent: 'flex-start' }}>
            <span>Already have an account?</span>
            <Link className="auth-link" to="/login">Login</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Register;
