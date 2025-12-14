# Cart and Wishlist Fix Summary

## Issues Identified

### 1. **Wishlist Schema Mismatch**
- **Problem**: The backend User model stored wishlist as a simple array of Product ObjectIds, but the frontend was trying to send and store wishlist items with both `productId` and `size` fields.
- **Impact**: Users couldn't add items to wishlist with specific sizes, causing the feature to fail.

### 2. **Wishlist API Incompatibility**
- **Problem**: The frontend `addToWishlist` function was sending `{ productId, size }` but the backend only expected and stored `productId`.
- **Impact**: The size information was being lost, and wishlist operations were failing.

## Changes Made

### Backend Changes

#### 1. **User Model (models/User.js)**
Updated the wishlist schema from a simple array of ObjectIds to an array of objects containing:
- `product`: ObjectId reference to Product
- `size`: String field for product size
- `addedAt`: Timestamp for when item was added

**Before:**
```javascript
wishlist: {
  type: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }
  ],
  default: []
}
```

**After:**
```javascript
wishlist: {
  type: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      size: {
        type: String,
        trim: true,
        default: ''
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  default: []
}
```

#### 2. **Wishlist Routes (routes/userRoutes.js)**

**GET /api/users/me/wishlist**
- Updated to populate `wishlist.product` instead of `wishlist`
- Now returns wishlist items with product details and size

**POST /api/users/me/wishlist**
- Added support for `size` parameter in request body
- Updated duplicate check to consider both product and size
- Now stores `{ product: productObjectId, size: size || '' }` instead of just `productObjectId`

**DELETE /api/users/me/wishlist/:productId**
- Added support for `size` query parameter
- Updated filter logic to match both product and size when size is provided
- If no size provided, removes all entries for that product

### Frontend Changes

#### 1. **ShopContext.jsx**

**Initial Wishlist Load (useEffect)**
- Updated normalization to extract `product._id` from the new structure
- Changed from `entry._id` to `entry.product?._id || entry.product`

**refreshWishlist Function**
- Updated to properly normalize wishlist items with the new structure
- Extracts product ID from nested product object

## How It Works Now

### Adding to Wishlist
1. User selects a product and size on the product page
2. Frontend calls `addToWishlist(productId, size)`
3. Backend validates the product exists
4. Backend checks if the same product-size combination already exists
5. If not, adds `{ product: productId, size: size }` to user's wishlist
6. Returns populated wishlist with full product details

### Removing from Wishlist
1. User clicks remove on a wishlist item
2. Frontend calls `removeFromWishlist(productId, size)`
3. Backend filters out the matching product-size combination
4. Returns updated wishlist

### Adding to Cart
The cart functionality was already working correctly with the product-size structure, so no changes were needed for cart operations.

## Testing Recommendations

1. **Test Add to Wishlist**
   - Select different sizes for the same product
   - Verify each size is stored separately
   - Check that duplicate product-size combinations are prevented

2. **Test Remove from Wishlist**
   - Remove specific product-size combinations
   - Verify only the matching item is removed

3. **Test Add to Cart**
   - Add items with different sizes
   - Verify quantities update correctly
   - Check that cart persists across page refreshes

4. **Test Authentication Flow**
   - Test wishlist/cart sync when logging in
   - Verify local storage merges with server data
   - Test logout clears synced state

## Notes

- All changes are backward compatible for users without existing wishlist data
- The cart functionality was already correctly implemented and didn't require changes
- Both cart and wishlist now support size-specific items consistently
- Error handling and toast notifications remain unchanged
