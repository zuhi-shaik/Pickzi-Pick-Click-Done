import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { loadToken } from '../../api/client';

const API = process.env.REACT_APP_API || 'http://localhost:5000';

const statusFilters = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusBadgeStyle = (status) => {
  const palette = {
    pending: { bg: '#fef3c7', fg: '#92400e' },
    paid: { bg: '#dcfce7', fg: '#166534' },
    shipped: { bg: '#dbeafe', fg: '#1d4ed8' },
    delivered: { bg: '#e0f2fe', fg: '#0369a1' },
    cancelled: { bg: '#fee2e2', fg: '#b91c1c' },
  };
  const colors = palette[status] || { bg: '#e2e8f0', fg: '#475569' };
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    background: colors.bg,
    color: colors.fg,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  };
};

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = loadToken();
      if (!token) throw new Error('Missing admin session. Please log in again.');
      const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
      const res = await fetch(`${API}/api/admin/orders${query}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => null);
      if (res.status === 401 || res.status === 403) {
        throw new Error(data?.message || 'Not authorized. Please log in with an admin account.');
      }
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to load orders');
      }
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setOrders([]);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const handler = () => fetchOrders();
    if (typeof window !== 'undefined') {
      window.addEventListener('admin:orders:refresh', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('admin:orders:refresh', handler);
      }
    };
  }, [fetchOrders]);

  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const codCount = orders.filter((order) => order.paymentMethod === 'cod').length;
    return {
      totalOrders,
      totalRevenue,
      codCount,
    };
  }, [orders]);

  const toggleExpanded = (id) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0 }}>Orders</h3>
          <span style={{ fontSize: 13, color: '#64748b' }}>Track customer purchases and fulfillment status</span>
        </div>
        <button
          style={{ padding: '10px 16px', borderRadius: 999, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
          onClick={fetchOrders}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <MetricCard label="Total orders" value={metrics.totalOrders} desc="Lifetime" />
        <MetricCard label="Gross revenue" value={formatCurrency(metrics.totalRevenue)} desc="All time" />
        <MetricCard label="Cash on delivery" value={metrics.codCount} desc="Awaiting collection" />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
          {statusFilters.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{ color: '#dc2626', fontSize: 14 }}>{error}</div>
      ) : orders.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No orders yet</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Orders placed by customers will appear here instantly.</div>
        </div>
      ) : (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', fontSize: 13, textAlign: 'left' }}>
                <th style={thStyle}>Order</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Payment</th>
                <th style={thStyle}>Total</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Placed</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Items</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const itemCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) : 0;
                const created = order.createdAt ? new Date(order.createdAt).toLocaleString() : '—';
                const isExpanded = expanded === order._id;
                return (
                  <React.Fragment key={order._id || order.orderId}>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>{order.orderId || order._id}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>#{(order._id || '').slice(-6)}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>{order.user?.name || order.shippingAddress?.fullName || 'Guest shopper'}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{order.email || order.user?.email || '—'}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, textTransform: 'uppercase' }}>{order.paymentMethod || 'n/a'}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{formatCurrency(order.subtotal)} + {formatCurrency(order.shipping)} shipping</div>
                      </td>
                      <td style={tdStyle}>{formatCurrency(order.total)}</td>
                      <td style={tdStyle}><span style={statusBadgeStyle(order.status)}>{order.status || 'unknown'}</span></td>
                      <td style={tdStyle}>{created}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button
                          style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 12 }}
                          onClick={() => toggleExpanded(order._id)}
                        >
                          {isExpanded ? 'Hide' : `${itemCount} item${itemCount === 1 ? '' : 's'}`}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && Array.isArray(order.items) ? (
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan={7} style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'grid', gap: 12 }}>
                            {order.items.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                  {item.image ? <img src={item.image} alt={item.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} /> : (
                                    <div style={{ width: 48, height: 48, borderRadius: 10, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛍️</div>
                                  )}
                                  <div style={{ display: 'grid' }}>
                                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                                    <span style={{ fontSize: 12, color: '#6b7280' }}>Size: {item.size || '—'}</span>
                                  </div>
                                </div>
                                <div style={{ display: 'grid', textAlign: 'right', gap: 4 }}>
                                  <span>{formatCurrency(item.price)} × {item.quantity}</span>
                                  <strong>{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</strong>
                                </div>
                              </div>
                            ))}
                            {order.shippingAddress ? (
                              <div style={{ marginTop: 8, fontSize: 13, color: '#475569' }}>
                                <strong>Ship to:</strong>{' '}
                                {[order.shippingAddress.fullName, order.shippingAddress.line1, order.shippingAddress.line2, `${order.shippingAddress.city || ''} ${order.shippingAddress.state || ''}`.trim(), order.shippingAddress.postalCode, order.shippingAddress.country]
                                  .filter(Boolean)
                                  .join(', ')}
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, desc }) => (
  <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, background: '#fff', boxShadow: '0 20px 40px -32px rgba(15,23,42,0.35)' }}>
    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    <div style={{ fontSize: 12, color: '#94a3b8' }}>{desc}</div>
  </div>
);

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  fontSize: 14,
  minWidth: 180,
};

const thStyle = {
  padding: '14px 16px',
  fontWeight: 600,
  color: '#1f2937',
};

const tdStyle = {
  padding: '14px 16px',
  fontSize: 14,
  color: '#1f2937',
  verticalAlign: 'top',
};

const emptyStateStyle = {
  padding: '48px 24px',
  border: '1px dashed #dbeafe',
  borderRadius: 16,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  background: '#f8fafc',
};

export default Orders;
