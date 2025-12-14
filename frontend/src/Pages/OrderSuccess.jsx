import React, { useEffect, useContext, useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './CSS/OrderSuccess.css';
import { OrderAPI, loadUser } from '../api/client';
import { ShopContext } from '../Context/ShopContext';

const OrderSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { clearCart } = useContext(ShopContext);
    const [emailStatus, setEmailStatus] = useState(null);

    const orderDetails = location.state || {};
    const { orderId, total, subtotal = total, shipping = 0, paymentMethod, items, address, email } = orderDetails;

    const userProfile = useMemo(() => loadUser?.() || null, []);
    const userId = userProfile?._id || userProfile?.id || null;

    // Redirect if no order details
    useEffect(() => {
        if (!orderId) {
            navigate('/');
        }
    }, [orderId, navigate]);

    // Clear cart after successful order (you can implement this in context)
    useEffect(() => {
        clearCart?.();
    }, [clearCart]);

    useEffect(() => {
        const persistOrder = async () => {
            if (!orderId || !items?.length) return;
            try {
                await OrderAPI.create({
                    userId,
                    email,
                    orderId,
                    items: items.map((entry) => ({
                        productId: entry.product?._id || entry.product?.id || entry.productId || entry.id,
                        name: entry.product?.name || entry.name,
                        image: entry.product?.image || entry.image,
                        price: entry.product?.new_price ?? entry.price ?? 0,
                        quantity: entry.qty ?? entry.quantity ?? 1,
                        size: entry.size || '',
                    })),
                    address,
                    paymentMethod,
                    subtotal,
                    shipping,
                    total,
                });
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('admin:orders:refresh'));
                }
            } catch (err) {
                console.warn('Order persistence failed:', err);
            }
        };

        persistOrder();
    }, [orderId, items, address, paymentMethod, subtotal, shipping, total, email, userId]);

    useEffect(() => {
        const sendConfirmation = async () => {
            if (!email) {
                setEmailStatus({ type: 'warning', message: 'No email associated with this order, so the confirmation was skipped.' });
                return;
            }
            try {
                setEmailStatus({ type: 'info', message: 'Sending confirmation email…' });
                const response = await OrderAPI.sendConfirmation({
                    email,
                    orderId,
                    total,
                    paymentMethod,
                    items,
                    address,
                });
                if (response?.sent) {
                    setEmailStatus({ type: 'success', message: 'Confirmation email sent successfully.' });
                } else if (response?.message) {
                    setEmailStatus({ type: 'warning', message: response.message });
                } else {
                    setEmailStatus({ type: 'warning', message: 'Confirmation email could not be verified. Please check your SMTP settings.' });
                }
            } catch (error) {
                setEmailStatus({ type: 'error', message: error?.message || 'Failed to send confirmation email.' });
            }
        };
        sendConfirmation();
    }, [email, orderId, total, paymentMethod, items, address]);

    const getPaymentMethodLabel = (method) => {
        const labels = {
            card: 'Credit/Debit Card',
            upi: 'UPI',
            cod: 'Cash on Delivery'
        };
        return labels[method] || method;
    };

    if (!orderId) {
        return null;
    }

    return (
        <div className="order-success-page">
            <div className="order-success-container">
                <div className="success-animation">
                    <div className="checkmark-circle">
                        <div className="checkmark"></div>
                    </div>
                </div>

                <h1>Order Placed Successfully!</h1>
                <p className="thank-you">Thank you for shopping with Pickzi</p>

                <div className="order-info-card">
                    <div className="order-id">
                        <span className="label">Order ID</span>
                        <span className="value">{orderId}</span>
                    </div>

                    {emailStatus ? (
                        <div className={`order-email-alert order-email-alert--${emailStatus.type}`}>
                            {emailStatus.message}
                        </div>
                    ) : null}

                    <div className="order-details-grid">
                        <div className="detail-item">
                            <span className="label">Amount Paid</span>
                            <span className="value">${total?.toFixed(2)}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Payment Method</span>
                            <span className="value">{getPaymentMethodLabel(paymentMethod)}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Items</span>
                            <span className="value">{items?.length || 0} item(s)</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Status</span>
                            <span className="value status-confirmed">Confirmed</span>
                        </div>
                    </div>
                </div>

                {address && (
                    <div className="delivery-info">
                        <h3>Delivery Address</h3>
                        <div className="address-card">
                            <strong>{address.fullName}</strong>
                            <p>{address.line1}</p>
                            {address.line2 && <p>{address.line2}</p>}
                            <p>{address.city}, {address.state} - {address.postalCode}</p>
                            <p>{address.country}</p>
                            <p className="phone">📞 {address.phone}</p>
                        </div>
                    </div>
                )}

                <div className="order-items-summary">
                    <h3>Order Items</h3>
                    <div className="items-list">
                        {items?.map((item, idx) => (
                            <div key={idx} className="order-item">
                                <img src={item.product?.image} alt={item.product?.name} />
                                <div className="item-details">
                                    <span className="item-name">{item.product?.name}</span>
                                    <span className="item-meta">Size: {item.size} | Qty: {item.qty}</span>
                                </div>
                                <span className="item-price">${(item.product?.new_price * item.qty).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="delivery-estimate">
                    <div className="truck-icon">🚚</div>
                    <div>
                        <strong>Estimated Delivery</strong>
                        <p>Within 5-7 business days</p>
                    </div>
                </div>

                <div className="action-buttons">
                    <Link to="/" className="continue-btn">
                        Continue Shopping
                    </Link>
                    <button
                        className="track-btn"
                        onClick={() => alert('Order tracking will be available soon!')}
                    >
                        Track Order
                    </button>
                </div>

                <div className="support-info">
                    <p>Need help? <a href="mailto:support@pickzi.com">Contact Support</a></p>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
