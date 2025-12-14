import React, { useContext } from 'react'
import './CSS/Cart.css'
import { ShopContext } from '../Context/ShopContext'
import { useNavigate } from 'react-router-dom'

const Cart = () => {
  const { getCartItems, getCartTotal, updateCartQuantity, removeFromCart } = useContext(ShopContext)
  const items = getCartItems()
  const navigate = useNavigate()

  const total = getCartTotal()

  if (!items.length) {
    return (
      <div className="cart-page">
        <h2 className="cart-title">Your cart is empty</h2>
        <p style={{ marginBottom: 16 }}>Browse products and tap “Add to Cart” to build your order.</p>
        <button className="checkout" style={{ maxWidth: 220 }} onClick={() => navigate('/')}>Start shopping</button>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <h2 className="cart-title">Your Cart</h2>
      <div className="cart-grid">
        <div className="cart-items">
          {items.map((item, idx) => (
            <div className="cart-card" key={`${item.product._id || item.product.id}-${item.size}-${idx}`}>
              <img src={item.product.image} alt={item.product.name} />
              <div>
                <div className="cart-name">{item.product.name}</div>
                <div className="cart-meta">{item.size ? <>Size: {item.size}</> : 'Size not specified'}</div>
                <div className="cart-price">₹{Number(item.product.new_price || 0).toLocaleString('en-IN')} × {item.quantity}</div>
                <div className="qty-wrap">
                  <div className="qty-box">
                    <button type="button" onClick={() => updateCartQuantity(item.product._id || item.product.id, item.size, item.quantity - 1)}>-</button>
                    <div>{item.quantity}</div>
                    <button type="button" onClick={() => updateCartQuantity(item.product._id || item.product.id, item.size, item.quantity + 1)}>+</button>
                  </div>
                  <button type="button" className="remove-btn" onClick={() => removeFromCart(item.product._id || item.product.id, item.size)}>Remove</button>
                </div>
              </div>
              <div style={{ fontWeight: 600 }}>₹{Number(item.product.new_price * item.quantity || 0).toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>

        <div className="summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Items</span>
            <span>{items.length}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>₹{Number(total || 0).toLocaleString('en-IN')}</span>
          </div>
          <button className="checkout" onClick={() => navigate('/checkout', { state: { items } })}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
