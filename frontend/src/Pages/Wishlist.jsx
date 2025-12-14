import React, { useContext } from 'react';
import './CSS/Wishlist.css';
import { ShopContext } from '../Context/ShopContext';
import Item from '../Components/Item/Item';
import emptyIllustration from '../Components/Assets/exclusive_image.png';

const Wishlist = () => {
  const { getWishlistItems, removeFromWishlist, moveWishlistItemToCart } = useContext(ShopContext);
  const items = getWishlistItems();

  if (!items.length) {
    return (
      <div className="wishlist-empty">
        <div className="wishlist-empty-card">
          <img src={emptyIllustration} alt="Empty wishlist" />
          <h2>Your wishlist is waiting to be filled</h2>
          <p>Save products you love and revisit them whenever you like.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <header className="wishlist-header">
        <div>
          <h1>My Wishlist</h1>
          <p>Items you have saved for later.</p>
        </div>
        <div className="wishlist-count">{items.length} saved item{items.length !== 1 ? 's' : ''}</div>
      </header>
      <div className="wishlist-grid">
        {items.map((wishlistItem) => {
          const { id, product, size } = wishlistItem;
          const uniqueKey = `${id}-${size}`;
          return (
            <div key={uniqueKey} className="wishlist-card">
              <Item
                id={product._id || product.id}
                name={product.name}
                image={product.image}
                new_price={product.new_price}
                old_price={product.old_price}
              />
              {size && (
                <div className="wishlist-size-info">
                  Size: {size}
                </div>
              )}
              <div className="wishlist-actions">
                <button
                  type="button"
                  className="wishlist-move"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await moveWishlistItemToCart(product._id || product.id, size || '', 1);
                  }}
                >
                  Move to Cart
                </button>
                <button
                  type="button"
                  className="wishlist-remove"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await removeFromWishlist(product._id || product.id, size || '');
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;
