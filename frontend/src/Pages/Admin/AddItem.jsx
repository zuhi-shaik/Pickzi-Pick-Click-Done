import React, { useState } from 'react';
import { loadToken } from '../../api/client';

const API = process.env.REACT_APP_API || 'http://localhost:5000';

const AddItem = () => {
  const [form, setForm] = useState({
    image: '',
    imageFile: null,
    name: '',
    category: 'women',
    new_price: '',
    old_price: ''
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const token = loadToken();
      
      // Create FormData for file upload
      const formData = new FormData();
      if (form.imageFile) {
        formData.append('image', form.imageFile);
      }
      formData.append('name', form.name);
      formData.append('description', form.name);
      formData.append('category', form.category);
      formData.append('new_price', form.new_price);
      if (form.old_price) {
        formData.append('old_price', form.old_price);
      }
      formData.append('stock', '10');
      
      const res = await fetch(`${API}/api/admin/products`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
          // Don't set Content-Type for FormData - browser sets it with boundary
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to add');
      setMessage('Item added successfully');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('catalog:refresh'));
        window.dispatchEvent(new CustomEvent('admin:products:refresh'));
      }
      setForm({ image: '', imageFile: null, name: '', category: 'women', new_price: '', old_price: '' });
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setMessage(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  // Handle file selection - store both file object and name
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setForm((f) => ({ ...f, image: file.name, imageFile: file }));
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h3 style={{ marginBottom: 16 }}>Add Items</h3>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Upload Image</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="file" accept="image/*" onChange={onFile} />
            <input
              type="text"
              placeholder="Selected file name"
              name="image"
              value={form.image}
              readOnly
              style={inputStyle}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Product name</label>
          <input name="name" placeholder="Type here" value={form.name} onChange={onChange} style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Product category</label>
            <select name="category" value={form.category} onChange={onChange} style={inputStyle}>
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="kids">Kids</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Product price</label>
            <input name="new_price" placeholder="e.g. 599" value={form.new_price} onChange={onChange} style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Old price (optional)</label>
          <input name="old_price" placeholder="e.g. 699" value={form.old_price} onChange={onChange} style={inputStyle} />
        </div>
        <button type="submit" disabled={busy} style={btnStyle}>{busy ? 'Adding…' : 'ADD'}</button>
        {message ? <div style={{ fontSize: 13, color: message.includes('success') ? '#16a34a' : '#dc2626' }}>{message}</div> : null}
      </form>
    </div>
  );
};

const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb' };
const btnStyle = { padding: '10px 16px', borderRadius: 999, background: '#111827', color: '#fff', border: 'none', cursor: 'pointer', width: 120 };

export default AddItem;
