import React, { useContext, useMemo } from 'react'
import './Item.css'
import { Link } from 'react-router-dom'
import { ShopContext } from '../../Context/ShopContext'

const Item = (props) => {
  const { addToWishlist, removeFromWishlist, isWishlisted } = useContext(ShopContext)
  const productId = useMemo(() => (props.id != null ? props.id : props._id), [props.id, props._id])
  const wishlisted = isWishlisted ? isWishlisted(productId) : false

  const toggleWishlist = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!productId) return
    if (wishlisted) {
      removeFromWishlist(productId)
    } else {
      addToWishlist(productId)
    }
  }

  return (
    <div className='item'>
      <Link to={`/product/${productId}`} className='item-image-link'>
        <button
          type="button"
          className={`item-wishlist ${wishlisted ? 'is-active' : ''}`}
          onClick={toggleWishlist}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <span className="item-wishlist-icon" aria-hidden="true" />
        </button>
        <img onClick={() => window.scrollTo(0,0)} src={props.image} alt={props.name}/>
      </Link>
      <p>{props.name}</p>
      <div className="item-prices">
        <div className="item-price-new">
            ₹{Number(props.new_price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </div>
        <div className="item-price-old">
            ₹{Number(props.old_price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </div>
      </div>
    </div>
  )
}

export default Item