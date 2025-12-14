import React, { useContext, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShopContext } from '../Context/ShopContext'
import star from '../Components/Assets/star_icon.png'
import star_dull from '../Components/Assets/star_dull_icon.png'

const Product = () => {
  const { productId } = useParams();
  const { all_product, addToCart } = useContext(ShopContext);
  const [selectedSize, setSelectedSize] = useState('');
  const navigate = useNavigate();

  const product = useMemo(() => {
    const idStr = String(productId);
    return all_product?.find((p) => String(p._id || p.id) === idStr);
  }, [all_product, productId]);

  const canonicalId = product ? (product._id || product.id) : null;

  

  const reviews = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.reviews) && product.reviews.length) return product.reviews;
    const names = ['Aarav', 'Diya', 'Ishaan', 'Meera', 'Ravi', 'Sana', 'Karan', 'Anika'];
    const comments = [
      'Great quality and very comfortable.',
      'Looks exactly like the pictures!',
      'Worth the price. Sizing was perfect.',
      'Fabric feels nice and delivery was quick.',
      'Color is vibrant and fit is flattering.',
      'Would definitely recommend to friends.',
      'Packaging was neat and product is premium.',
      'After first wash, still looks great.'
    ];
    const count = 4 + (product.id % 2); // 4 or 5
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        name: names[(product.id + i) % names.length],
        rating: 4 + ((product.id + i) % 2),
        date: new Date(Date.now() - (i + 1) * 86400000 * 7).toLocaleDateString(),
        comment: comments[(product.id + i) % comments.length]
      });
    }
    return arr;
  }, [product]);

  if (!product) {
    return <div style={{ maxWidth: 900, margin: '40px auto' }}>Product not found.</div>;
  }

  const sizes = product.sizes || ['S', 'M', 'L'];

  return (
    <>
      <div style={{ maxWidth: 1000, margin: '40px auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <img src={product.image} alt={product.name} style={{ width: '100%', borderRadius: 8 }} />
        </div>
        <div>
          <h2 style={{ marginTop: 0 }}>{product.name}</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, margin: '8px 0 16px' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>₹{Number(product.new_price || 0).toLocaleString('en-IN')}</div>
            <div style={{ textDecoration: 'line-through', color: '#888' }}>₹{Number(product.old_price || 0).toLocaleString('en-IN')}</div>
          </div>
          {typeof product.rating === 'number' ? (
            <div style={{ marginBottom: 12 }}>Rating: {product.rating} / 5</div>
          ) : null}
          {typeof product.stock === 'number' ? (
            <div style={{ marginBottom: 12 }}>In stock: {product.stock}</div>
          ) : null}

          <div style={{ margin: '16px 0' }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Select Size</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: selectedSize === s ? '2px solid #111' : '1px solid #ccc',
                    background: selectedSize === s ? '#f3f3f3' : 'white',
                    cursor: 'pointer'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <p style={{ lineHeight: 1.5 }}>{product.description || 'No description available.'}</p>

          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <button
              type="button"
              style={{ padding: '10px 16px' }}
              onClick={() => {
                if (!selectedSize) {
                  alert('Please select a size before continuing.');
                  return;
                }
                if (!canonicalId) {
                  alert('Product information is unavailable right now. Please try again.');
                  return;
                }
                navigate('/checkout', { state: { item: { id: canonicalId, size: selectedSize, qty: 1 } } });
              }}
            >
              Buy Now
            </button>
            <button
              type="button"
              style={{ padding: '10px 16px', border: 'none', background: '#111', color: '#fff', cursor: 'pointer', borderRadius: 6 }}
              onClick={() => {
                if (!selectedSize) {
                  alert('Choose a size to add this product to your cart.');
                  return;
                }
                if (!canonicalId) {
                  alert('Product information is unavailable right now. Please try again later.');
                  return;
                }
                addToCart(canonicalId, selectedSize, 1);
              }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '24px auto', padding: '0 8px' }}>
        <h3 style={{ margin: '16px 0' }}>Customer Reviews</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {reviews.map((r, idx) => (
            <div key={idx} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{r.name}</strong>
                <span style={{ color: '#666', fontSize: 12 }}>{r.date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '6px 0' }}>
                {[1,2,3,4,5].map(n => (
                  <img key={n} src={n <= r.rating ? star : star_dull} alt="*" style={{ width: 16, height: 16 }} />
                ))}
              </div>
              <div style={{ color: '#333' }}>{r.comment}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Product
