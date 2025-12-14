import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadToken } from '../../api/client';

const API = process.env.REACT_APP_API || 'http://localhost:5000';

const categories = [
  { value: 'all', label: 'All categories' },
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'kids', label: 'Kids' },
];

const ListItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const token = loadToken();
      if (!token) {
        throw new Error('Missing admin session. Please log in again.');
      }
      const res = await fetch(`${API}/api/admin/products`, {
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
        throw new Error(data?.message || 'Failed to load products');
      }
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setItems([]);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    const handler = () => fetchItems();
    if (typeof window !== 'undefined') {
      window.addEventListener('admin:products:refresh', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('admin:products:refresh', handler);
      }
    };
  }, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      if (!q) return matchesCategory;
      const haystack = `${item.name || ''} ${item.description || ''}`.toLowerCase();
      return matchesCategory && haystack.includes(q);
    });
  }, [items, query, category]);

  const deleteItem = async (id) => {
    const proceed = typeof window !== 'undefined' ? window.confirm('Delete this product?') : true;
    if (!proceed) return;
    setDeletingId(id);
    try {
      const token = loadToken();
      if (!token) throw new Error('Missing admin session. Please log in again.');
      const res = await fetch(`${API}/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to delete product');
      }
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0 }}>Products</h3>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Manage all products in the catalog</span>
        </div>
        <Link to='/admin/add-items' style={{ alignSelf: 'center' }}>
          <button style={buttonStyle}>+ Add product</button>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search by name or description'
          style={inputStyle}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <button style={ghostButtonStyle} onClick={fetchItems} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{ color: '#dc2626', fontSize: 14 }}>{error}</div>
      ) : filteredItems.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🗂️</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No products found</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
            Adjust your search filters or add a new product.
          </div>
          <Link to='/admin/add-items'>
            <button style={buttonStyle}>Add your first product</button>
          </Link>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left', fontSize: 13 }}>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Stock</th>
                <th style={thStyle}>Created</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{item.description}</div>
                  </td>
                  <td style={tdStyle}>{item.category}</td>
                  <td style={tdStyle}>₹{Number(item.new_price || 0).toFixed(2)}</td>
                  <td style={tdStyle}>{item.stock ?? 0}</td>
                  <td style={tdStyle}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <Link to={`/product/${item._id}`} target="_blank" rel="noopener noreferrer">
                        <button style={viewButtonStyle}>View</button>
                      </Link>
                      <button
                        style={dangerButtonStyle}
                        onClick={() => deleteItem(item._id)}
                        disabled={deletingId === item._id}
                      >
                        {deletingId === item._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  fontSize: 14,
  minWidth: 180,
};

const buttonStyle = {
  padding: '10px 16px',
  borderRadius: 12,
  background: '#111827',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
};

const ghostButtonStyle = {
  ...buttonStyle,
  background: '#fff',
  color: '#111827',
  border: '1px solid #d1d5db',
};

const dangerButtonStyle = {
  ...buttonStyle,
  background: '#dc2626',
  borderRadius: 999,
  padding: '8px 14px',
};

const viewButtonStyle = {
  ...buttonStyle,
  background: '#2563eb',
  borderRadius: 999,
  padding: '8px 14px',
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

const thStyle = {
  padding: '14px 16px',
  fontWeight: 600,
  color: '#111827',
};

const tdStyle = {
  padding: '14px 16px',
  fontSize: 14,
  color: '#111827',
  verticalAlign: 'top',
};

export default ListItems;
