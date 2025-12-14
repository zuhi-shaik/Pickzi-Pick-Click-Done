import React, { useContext, useMemo, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ShopContext } from '../Context/ShopContext'
import { loadUser } from '../api/client'

const normalizeAddressForForm = (value) => {
  const base = {
    fullName: '',
    phone: '',
    postalCode: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: 'India',
  };
  if (!value || typeof value !== 'object') return base;

  const result = { ...base };
  for (const key of Object.keys(base)) {
    const next = value[key];
    if (next !== undefined && next !== null) {
      result[key] = next;
    }
  }
  if (value.postalCode !== undefined && value.postalCode !== null) {
    result.postalCode = value.postalCode;
  } else if (value.pincode !== undefined && value.pincode !== null) {
    result.postalCode = value.pincode;
  }
  return result;
};

const Checkout = () => {
  const { all_product, address, setAddress } = useContext(ShopContext);
  const userProfile = useMemo(() => loadUser?.() || null, []);
  const userEmail = userProfile?.email || null;
  const location = useLocation();
  const navigate = useNavigate();
  const state = location?.state || {};
  const stateItems = Array.isArray(state.items) ? state.items : null;
  const stateItem = stateItems ? null : state.item || null;

  const items = useMemo(() => {
    const resolveProduct = (rawId, fallbackProduct = {}) => {
      if (!rawId && !fallbackProduct) return null;
      const id = (rawId ?? fallbackProduct?.id ?? fallbackProduct?._id);
      const idStr = id != null ? id.toString() : null;
      if (idStr) {
        const catalogMatch = all_product.find((prod) => String(prod._id || prod.id) === idStr);
        if (catalogMatch) return catalogMatch;
      }
      if (fallbackProduct && Object.keys(fallbackProduct).length) {
        return {
          _id: fallbackProduct._id || idStr,
          id: fallbackProduct.id || idStr,
          name: fallbackProduct.name || 'Selected product',
          image: fallbackProduct.image || '',
          new_price: fallbackProduct.new_price ?? fallbackProduct.price ?? 0,
          old_price: fallbackProduct.old_price ?? fallbackProduct.new_price ?? fallbackProduct.price ?? 0,
        };
      }
      if (!idStr) return null;
      return {
        _id: idStr,
        id: idStr,
        name: 'Selected product',
        image: '',
        new_price: 0,
        old_price: 0,
      };
    };

    const normalize = (entry) => {
      if (!entry) return null;
      const productId = entry?.product?._id || entry?.product?.id || entry?.id;
      const product = resolveProduct(productId, entry.product || entry);
      if (!product) return null;
      return {
        size: entry.size || '',
        qty: entry.qty || 1,
        product,
      };
    };

    if (stateItems && stateItems.length) {
      return stateItems.map(normalize).filter(Boolean);
    }

    if (stateItem && stateItem.id != null) {
      const product = resolveProduct(stateItem.id, stateItem);
      if (!product) return [];
      return [{
        size: stateItem.size || '',
        qty: stateItem.qty || 1,
        product,
      }];
    }

    return [];
  }, [all_product, stateItems, stateItem]);

  const [form, setForm] = useState(() => normalizeAddressForForm(address));
  const [isEditing, setEditing] = useState(() => !address);

  useEffect(() => {
    setForm(normalizeAddressForForm(address));
    setEditing(!address);
  }, [address]);

  const [payment, setPayment] = useState('cod');

  const summary = useMemo(() => {
    let subtotal = 0;
    for (const i of (items || [])) {
      const price = i?.product?.new_price || 0;
      subtotal += price * (i.qty || 0);
    }
    const shipping = subtotal > 0 ? 5 : 0;
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  }, [items]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const saveAddress = async () => {
    const saved = await setAddress(form);
    if (saved) {
      const normalized = normalizeAddressForForm(saved);
      setForm(normalized);
      setEditing(false);
    }
  };

  const cancelEdit = () => {
    setForm(normalizeAddressForForm(address));
    if (address) {
      setEditing(false);
    }
  };

  const placeOrder = () => {
    if (!items.length) {
      alert('No items selected. Please pick a product before checking out.');
      navigate('/');
      return;
    }
    if (!form.fullName || !form.phone || !form.postalCode || !form.line1 || !form.city || !form.state) {
      alert('Please complete the delivery address.');
      return;
    }

    // For card and UPI, navigate to payment page
    if (payment === 'card' || payment === 'upi') {
      navigate('/payment', {
        state: {
          paymentMethod: payment,
          total: summary.total,
          subtotal: summary.subtotal,
          shipping: summary.shipping,
          items,
          address: form,
          email: address?.email || userEmail,
        }
      });
      return;
    }

    // For COD, navigate directly to order success
    const orderId = 'ORD' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 7).toUpperCase();
    navigate('/order-success', {
      state: {
        orderId,
        total: summary.total,
        subtotal: summary.subtotal,
        shipping: summary.shipping,
        paymentMethod: payment,
        items,
        address: form,
        email: address?.email || userEmail,
      }
    });
  };

  const styles = {
    shell: { maxWidth: 1100, margin: '24px auto', padding: '0 8px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 },
    card: { border: '1px solid rgba(148,163,184,0.25)', borderRadius: 16, padding: 16, background: 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(99,102,241,0.05))', boxShadow: '0 24px 48px -28px rgba(15,23,42,0.45)' },
    input: { padding: '10px 12px', border: '1px solid rgba(148,163,184,0.35)', borderRadius: 10, background: 'rgba(255,255,255,0.9)', boxShadow: 'inset 0 1px 2px rgba(148,163,184,0.25)' },
    button: { padding: '10px 16px', borderRadius: 999, border: 'none', color: '#fff', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 14px 28px -18px rgba(99,102,241,0.6)', cursor: 'pointer' },
    secondaryButton: { padding: '10px 16px', borderRadius: 999, border: '1px solid rgba(148,163,184,0.35)', background: 'rgba(255,255,255,0.85)', color: '#1f2937', cursor: 'pointer', marginLeft: 10 },
    summaryCard: { borderRadius: 14, border: '1px solid rgba(148,163,184,0.2)', padding: 18, background: 'rgba(255,255,255,0.85)', boxShadow: '0 18px 36px -26px rgba(15,23,42,0.4)' },
    summaryRow: { display: 'grid', gap: 6, color: '#374151', lineHeight: 1.5 },
    editButton: { marginTop: 16, padding: '10px 18px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #ec4899, #6366f1)', color: '#fff', cursor: 'pointer', boxShadow: '0 14px 28px -18px rgba(236,72,153,0.55)' },
    orderButton: { width: '100%', marginTop: 12, padding: '10px 14px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #22d3ee, #3b82f6)', color: '#fff', fontWeight: 600, cursor: 'pointer', boxShadow: '0 16px 32px -20px rgba(59,130,246,0.6)' }
  };

  if (!items.length) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: '40px 16px' }}>
        <h2 style={{ margin: 0 }}>No items selected</h2>
        <p style={{ maxWidth: 480, color: '#475569' }}>Select a product and choose “Buy Now” to start the checkout process.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{ padding: '12px 18px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', cursor: 'pointer', boxShadow: '0 10px 24px -18px rgba(99,102,241,0.6)' }}
        >
          Browse products
        </button>
      </div>
    );
  }

  return (
    <div style={styles.shell}>
      <div>
        <h2 style={{ marginTop: 0 }}>Delivery Address</h2>
        {isEditing ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <input name="fullName" value={form.fullName} onChange={onChange} placeholder="Full name" style={styles.input} />
            <input name="phone" value={form.phone} onChange={onChange} placeholder="Phone" style={styles.input} />
            <input name="postalCode" value={form.postalCode} onChange={onChange} placeholder="Pincode" style={styles.input} />
            <input name="line1" value={form.line1} onChange={onChange} placeholder="Address line 1" style={styles.input} />
            <input name="line2" value={form.line2} onChange={onChange} placeholder="Address line 2 (optional)" style={styles.input} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input name="city" value={form.city} onChange={onChange} placeholder="City" style={styles.input} />
              <input name="state" value={form.state} onChange={onChange} placeholder="State" style={styles.input} />
            </div>
            <input name="country" value={form.country} onChange={onChange} placeholder="Country" style={styles.input} />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={saveAddress} style={styles.button}>Save Address</button>
              {address ? <button onClick={cancelEdit} style={styles.secondaryButton}>Cancel</button> : null}
            </div>
          </div>
        ) : (
          <div style={styles.summaryCard}>
            <div style={styles.summaryRow}>
              <strong>{address?.fullName}</strong>
              <span>{address?.phone}</span>
              <span>{address?.line1}</span>
              {address?.line2 ? <span>{address?.line2}</span> : null}
              <span>{[address?.city, address?.state].filter(Boolean).join(', ')}</span>
              <span>{address?.postalCode}</span>
              <span>{address?.country}</span>
            </div>
            <button onClick={() => setEditing(true)} style={styles.editButton}>Edit Address</button>
          </div>
        )}

        <h2 style={{ marginTop: 24 }}>Payment Method</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: payment === 'card' ? '2px solid #6366f1' : '1px solid rgba(148,163,184,0.3)', borderRadius: 12, cursor: 'pointer', background: payment === 'card' ? 'rgba(99,102,241,0.05)' : 'white', transition: 'all 0.2s' }}>
            <input type="radio" name="payment" checked={payment === 'card'} onChange={() => setPayment('card')} style={{ accentColor: '#6366f1' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>💳</span>
              <div>
                <strong>Credit/Debit Card</strong>
                <div style={{ fontSize: 12, color: '#64748b' }}>Visa, Mastercard, Amex</div>
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: payment === 'upi' ? '2px solid #6366f1' : '1px solid rgba(148,163,184,0.3)', borderRadius: 12, cursor: 'pointer', background: payment === 'upi' ? 'rgba(99,102,241,0.05)' : 'white', transition: 'all 0.2s' }}>
            <input type="radio" name="payment" checked={payment === 'upi'} onChange={() => setPayment('upi')} style={{ accentColor: '#6366f1' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>📱</span>
              <div>
                <strong>UPI</strong>
                <div style={{ fontSize: 12, color: '#64748b' }}>GPay, PhonePe, Paytm</div>
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: payment === 'cod' ? '2px solid #6366f1' : '1px solid rgba(148,163,184,0.3)', borderRadius: 12, cursor: 'pointer', background: payment === 'cod' ? 'rgba(99,102,241,0.05)' : 'white', transition: 'all 0.2s' }}>
            <input type="radio" name="payment" checked={payment === 'cod'} onChange={() => setPayment('cod')} style={{ accentColor: '#6366f1' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>💵</span>
              <div>
                <strong>Cash on Delivery</strong>
                <div style={{ fontSize: 12, color: '#64748b' }}>Pay when you receive</div>
              </div>
            </div>
          </label>
        </div>
      </div>

      <div style={{ ...styles.card, height: 'fit-content' }}>
        <h3 style={{ marginTop: 0 }}>Order Summary</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {(items || []).map((i, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <img src={i.product?.image} alt={i.product?.name || ''} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                <div>
                  <div style={{ fontWeight: 600, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.product?.name}</div>
                  <div style={{ color: '#666', fontSize: 12 }}>Size: {i.size}</div>
                </div>
              </div>
              <div>x{i.qty}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <span>Subtotal</span>
          <strong>${summary.subtotal.toFixed(2)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span>Shipping</span>
          <strong>${summary.shipping.toFixed(2)}</strong>
        </div>
        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
          <span>Total</span>
          <strong>${summary.total.toFixed(2)}</strong>
        </div>
        <button style={styles.orderButton} onClick={placeOrder}>Place Order</button>
      </div>
    </div>
  )
}

export default Checkout
