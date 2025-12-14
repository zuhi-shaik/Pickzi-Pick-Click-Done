import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadToken } from '../../api/client';

const API = process.env.REACT_APP_API || 'http://localhost:5000';

const Card = ({ title, value, desc }) => (
  <div style={{
    background: '#fff', border: '1px solid #eee', borderRadius: 12,
    padding: 16, minWidth: 220, boxShadow: '0 6px 20px -16px rgba(0,0,0,0.3)'
  }}>
    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
    {desc ? <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{desc}</div> : null}
  </div>
);

const AdminDashboard = () => {
  const [health, setHealth] = useState(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = loadToken();
    if (!token) {
      setError('Admin session missing. Please log in again.');
      setLoading(false);
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    (async () => {
      try {
        // health
        const h = await fetch(`${API}/api/admin/health`, { headers });
        const hStatus = h.status;
        const hJson = await h.json().catch(() => null);
        if (hStatus === 401 || hStatus === 403) {
          throw new Error('You are not authorized. Log in with an admin account.');
        }
        setHealth(h.ok ? hJson : { ok: false, env: hJson?.env });

        // products for low stock widget
        const p = await fetch(`${API}/api/admin/products`, { headers });
        const pStatus = p.status;
        const items = await p.json().catch(() => []);
        if (pStatus === 401 || pStatus === 403) {
          throw new Error('You are not authorized. Log in with an admin account.');
        }
        setTotalProducts(Array.isArray(items) ? items.length : 0);
        const low = (Array.isArray(items) ? items : []).filter(x => (x.stock || 0) <= 5).length;
        setLowStockCount(low);
        setLoading(false);
      } catch (e) {
        setError(e.message || 'Failed to load admin data');
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>Admin Dashboard</h2>
      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{ color: '#dc2626' }}>Error: {error}</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <Card title="Backend Health" value={health?.ok ? 'OK' : 'DOWN'} desc={`env: ${health?.env || 'dev'}`} />
            <Card title="Total Products" value={totalProducts} desc="Across all categories" />
            <Card title="Low Stock" value={lowStockCount} desc="Stock ≤ 5 items" />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/admin" style={linkStyle}>Dashboard</Link>
            <Link to="/admin/add-items" style={linkStyle}>Add Items</Link>
            <Link to="/admin/list-items" style={linkStyle}>List Items</Link>
            <Link to="/admin/orders" style={linkStyle}>Orders</Link>
          </div>
        </>
      )}
    </div>
  );
};

const linkStyle = {
  background: '#111827', color: '#fff', padding: '10px 14px', borderRadius: 10,
  fontSize: 14, textDecoration: 'none'
};

export default AdminDashboard;
