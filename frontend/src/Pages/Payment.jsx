import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CSS/Payment.css';

const Payment = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get order details from navigation state
    const orderDetails = location.state || {};
    const { paymentMethod, total, address, items: rawItems = [], email = null } = orderDetails;

    const items = useMemo(() => {
        if (!Array.isArray(rawItems)) return [];
        return rawItems
            .map((entry) => {
                if (!entry || typeof entry !== 'object') return null;
                if (!entry.product) return null;
                const qty = Number.isFinite(entry.qty) ? entry.qty : 1;
                if (qty <= 0) return null;
                return {
                    ...entry,
                    qty,
                    product: {
                        name: entry.product?.name || 'Product',
                        image: entry.product?.image || '',
                        new_price: entry.product?.new_price ?? 0,
                    },
                };
            })
            .filter(Boolean);
    }, [rawItems]);

    const summary = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + (item.product?.new_price || 0) * item.qty, 0);
        const shipping = subtotal > 0 ? 5 : 0;
        return {
            subtotal,
            shipping,
            total: subtotal + shipping,
        };
    }, [items]);

    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [upiId, setUpiId] = useState('');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [upiPending, setUpiPending] = useState(false);

    const normalizedTotal = typeof total === 'number' && total > 0 ? total : summary.total;
    const hasPaymentIntent = Boolean(paymentMethod && normalizedTotal && items.length);

    // Redirect if no payment details
    useEffect(() => {
        if (!hasPaymentIntent) {
            navigate('/checkout');
        }
    }, [hasPaymentIntent, navigate]);

    // Format card number with spaces
    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(' ') : v;
    };

    // Format expiry date
    const formatExpiry = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    const handleCardNumberChange = (e) => {
        const formatted = formatCardNumber(e.target.value);
        if (formatted.length <= 19) setCardNumber(formatted);
    };

    const handleExpiryChange = (e) => {
        const formatted = formatExpiry(e.target.value.replace('/', ''));
        if (formatted.length <= 5) setExpiry(formatted);
    };

    const handleCvvChange = (e) => {
        const v = e.target.value.replace(/[^0-9]/gi, '');
        if (v.length <= 4) setCvv(v);
    };

    // Dummy card validation (for presentation)
    const validateCard = () => {
        // For demo: accept any valid-looking card number

        if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
            return 'Please enter a valid card number';
        }
        if (!cardName.trim()) {
            return 'Please enter cardholder name';
        }
        if (!expiry || expiry.length < 5) {
            return 'Please enter valid expiry date (MM/YY)';
        }
        if (!cvv || cvv.length < 3) {
            return 'Please enter valid CVV';
        }

        // For demo: accept test cards or any 16-digit number
        const cleanCard = cardNumber.replace(/\s/g, '');
        if (cleanCard.length >= 13 && cleanCard.length <= 19) {
            return null; // Valid
        }
        return 'Invalid card number';
    };

    const validateUPI = () => {
        const upiPattern = /^[\w.-]+@[\w]+$/;
        if (!upiId || !upiPattern.test(upiId)) {
            return 'Please enter a valid UPI ID (e.g., name@upi)';
        }
        return null;
    };

    const processPayment = async () => {
        setError('');

        // Validate based on payment method
        if (paymentMethod === 'card') {
            const cardError = validateCard();
            if (cardError) {
                setError(cardError);
                return;
            }
        } else if (paymentMethod === 'upi') {
            const upiError = validateUPI();
            if (upiError) {
                setError(upiError);
                return;
            }
            setUpiPending(true);
        }

        // Simulate payment processing
        setProcessing(true);

        // Fake processing delay (2-4 seconds)
        const processingTime = 2000 + Math.random() * 2000;

        await new Promise(resolve => setTimeout(resolve, processingTime));

        // For demo: always succeed (you can add random failure for realism)
        // const shouldFail = Math.random() < 0.1; // 10% failure rate
        const shouldFail = false;

        if (shouldFail) {
            setProcessing(false);
            setError('Payment failed. Please try again or use a different payment method.');
            return;
        }

        // Payment successful
        setProcessing(false);
        setUpiPending(false);
        setSuccess(true);

        // Generate order ID
        const orderId = 'ORD' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 7).toUpperCase();

        // Redirect to success page after short delay
        setTimeout(() => {
            navigate('/order-success', {
                state: {
                    orderId,
                    total: normalizedTotal,
                    paymentMethod,
                    items,
                    address,
                    email,
                    subtotal: summary.subtotal,
                    shipping: summary.shipping,
                }
            });
        }, 2000);
    };

    if (success) {
        return (
            <div className="payment-page">
                <div className="payment-success">
                    <div className="success-icon">✓</div>
                    <h2>Payment Successful!</h2>
                    <p>Redirecting to order confirmation...</p>
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    if (!hasPaymentIntent) {
        return null;
    }

    return (
        <div className="payment-page">
            <div className="payment-container">
                <div className="payment-header">
                    <h1>Complete Your Payment</h1>
                    <p>Amount to pay: <strong>${normalizedTotal.toFixed(2)}</strong></p>
                </div>

                <div className="payment-summary-card">
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <strong>${summary.subtotal.toFixed(2)}</strong>
                    </div>
                    <div className="summary-row">
                        <span>Shipping</span>
                        <strong>${summary.shipping.toFixed(2)}</strong>
                    </div>
                    <div className="summary-divider" />
                    <div className="summary-row summary-total">
                        <span>Total</span>
                        <strong>${normalizedTotal.toFixed(2)}</strong>
                    </div>
                </div>

                {paymentMethod === 'card' && (
                    <div className="payment-form card-form">
                        <div className="card-preview">
                            <div className="card-preview-inner">
                                <div className="card-chip"></div>
                                <div className="card-number-preview">
                                    {cardNumber || '•••• •••• •••• ••••'}
                                </div>
                                <div className="card-details-preview">
                                    <div>
                                        <span className="label">Card Holder</span>
                                        <span className="value">{cardName || 'YOUR NAME'}</span>
                                    </div>
                                    <div>
                                        <span className="label">Expires</span>
                                        <span className="value">{expiry || 'MM/YY'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Card Number</label>
                            <input
                                type="text"
                                placeholder="4242 4242 4242 4242"
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                className="card-input"
                                disabled={processing}
                            />
                            <div className="card-icons">
                                <span className="card-icon visa">VISA</span>
                                <span className="card-icon mastercard">MC</span>
                                <span className="card-icon amex">AMEX</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Cardholder Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                disabled={processing}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Expiry Date</label>
                                <input
                                    type="text"
                                    placeholder="MM/YY"
                                    value={expiry}
                                    onChange={handleExpiryChange}
                                    disabled={processing}
                                />
                            </div>
                            <div className="form-group">
                                <label>CVV</label>
                                <input
                                    type="password"
                                    placeholder="•••"
                                    value={cvv}
                                    onChange={handleCvvChange}
                                    disabled={processing}
                                />
                            </div>
                        </div>

                        <div className="test-card-info">
                            <p><strong>Demo Mode:</strong> Use test card <code>4242 4242 4242 4242</code></p>
                            <p>Any future date and any 3-digit CVV</p>
                        </div>
                    </div>
                )}

                {paymentMethod === 'upi' && (
                    <div className="payment-form upi-form">
                        <div className="upi-apps">
                            <div className="upi-app">
                                <div className="upi-icon gpay">G</div>
                                <span>GPay</span>
                            </div>
                            <div className="upi-app">
                                <div className="upi-icon phonepe">P</div>
                                <span>PhonePe</span>
                            </div>
                            <div className="upi-app">
                                <div className="upi-icon paytm">₽</div>
                                <span>Paytm</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Enter UPI ID</label>
                            <input
                                type="text"
                                placeholder="yourname@upi"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                disabled={processing}
                            />
                        </div>

                        {upiPending && (
                            <div className="upi-pending">
                                <span className="pending-icon">⏳</span>
                                Approve the payment request in your UPI app…
                            </div>
                        )}

                        <div className="test-card-info">
                            <p><strong>Demo Mode:</strong> Use test UPI ID <code>demo@upi</code></p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="payment-error">
                        <span className="error-icon">⚠</span>
                        {error}
                    </div>
                )}

                <div className="payment-actions">
                    <button
                        className="cancel-btn"
                        onClick={() => navigate('/checkout')}
                        disabled={processing}
                    >
                        Cancel
                    </button>
                    <button
                        className="pay-btn"
                        onClick={processPayment}
                        disabled={processing}
                    >
                        {processing ? (
                            <>
                                <span className="btn-spinner"></span>
                                Processing...
                            </>
                        ) : (
                            `Pay $${normalizedTotal.toFixed(2)}`
                        )}
                    </button>
                </div>

                <div className="security-notice">
                    <span className="lock-icon">🔒</span>
                    <span>Your payment is secured with 256-bit SSL encryption</span>
                </div>

                <div className="payment-items">
                    <h2>Order Items</h2>
                    {items.map((item, index) => (
                        <div className="payment-item" key={index}>
                            <div className="payment-item-thumb">
                                {item.product.image ? (
                                    <img src={item.product.image} alt={item.product.name} />
                                ) : (
                                    <div className="payment-item-placeholder" aria-hidden="true">🛍️</div>
                                )}
                            </div>
                            <div className="payment-item-body">
                                <div className="payment-item-name">{item.product.name}</div>
                                <div className="payment-item-meta">
                                    Qty: {item.qty}
                                    {item.size ? <span> · Size: {item.size}</span> : null}
                                </div>
                            </div>
                            <div className="payment-item-price">${(item.product.new_price * item.qty).toFixed(2)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Payment;
