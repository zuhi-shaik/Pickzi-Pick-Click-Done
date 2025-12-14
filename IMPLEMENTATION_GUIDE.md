# Cart and Wishlist - Complete Implementation Guide

## ✅ What Has Been Fixed

### Backend Changes (Database Schema & API)

1. **User Model Schema Update** (`backend/models/User.js`)
   - Wishlist now stores objects with `product`, `size`, and `addedAt` fields
   - Matches the cart structure for consistency
   - Supports size-specific wishlist items

2. **Wishlist API Endpoints** (`backend/routes/userRoutes.js`)
   - **GET /api/users/me/wishlist**: Returns wishlist with populated product details
   - **POST /api/users/me/wishlist**: Accepts `productId` and `size`, prevents duplicates
   - **DELETE /api/users/me/wishlist/:productId**: Supports `size` query parameter

### Frontend Changes (User Interface & State Management)

3. **ShopContext.jsx** (`frontend/src/Context/ShopContext.jsx`)
   - Updated wishlist normalization to handle new backend structure
   - Added success toast notifications for all operations:
     - ✅ "Item added to cart successfully!"
     - ✅ "Item added to wishlist!"
     - ✅ "Item removed from cart"
     - ✅ "Item removed from wishlist"
     - ✅ "Cart updated"
   - Added validation with error messages:
     - ❌ "Please select a size before adding to cart"
     - ❌ "Please select a size before adding to wishlist"
     - ❌ "Invalid product"

## 🎯 How It Works Now

### Adding to Cart
1. User selects a product and size
2. Clicks "Add to Cart" button
3. **Frontend**: Validates size is selected
4. **Backend**: 
   - Checks if product exists in database
   - Checks if same product-size combination exists in user's cart
   - If exists: Updates quantity
   - If new: Adds new cart item
5. **Database**: Saves to MongoDB in user's cart array
6. **Frontend**: Shows success toast and updates cart count
7. **Persistence**: Saved in both localStorage and MongoDB

### Adding to Wishlist
1. User selects a product and size
2. Clicks "Add to Wishlist" button
3. **Frontend**: Validates size is selected
4. **Backend**:
   - Checks if product exists in database
   - Checks if same product-size combination exists in user's wishlist
   - If exists: Ignores (no duplicates)
   - If new: Adds to wishlist
5. **Database**: Saves to MongoDB in user's wishlist array
6. **Frontend**: Shows success toast and updates wishlist UI
7. **Persistence**: Saved in both localStorage and MongoDB

### Removing from Cart
1. User clicks remove/decrease button on cart item
2. **Frontend**: Calls removeFromCart with product ID and size
3. **Backend**:
   - Finds matching cart item by product ID and size
   - Decreases quantity or removes completely
4. **Database**: Updates MongoDB
5. **Frontend**: Shows success toast and updates cart
6. **Persistence**: Synced to both localStorage and MongoDB

### Removing from Wishlist
1. User clicks remove button on wishlist item
2. **Frontend**: Calls removeFromWishlist with product ID and size
3. **Backend**:
   - Finds matching wishlist item by product ID and size
   - Removes from array
4. **Database**: Updates MongoDB
5. **Frontend**: Shows success toast and updates wishlist
6. **Persistence**: Synced to both localStorage and MongoDB

## 🗄️ Database Structure

### Cart Schema (in User model)
```javascript
cart: [
  {
    product: ObjectId (ref: 'Product'),  // Reference to Product
    quantity: Number,                     // Quantity in cart
    size: String,                         // Selected size (e.g., "M", "L")
    addedAt: Date                         // Timestamp
  }
]
```

### Wishlist Schema (in User model)
```javascript
wishlist: [
  {
    product: ObjectId (ref: 'Product'),  // Reference to Product
    size: String,                         // Selected size (e.g., "M", "L")
    addedAt: Date                         // Timestamp
  }
]
```

## 🔄 Data Flow

### Authenticated Users
```
User Action → Frontend Validation → API Call → Backend Validation → 
MongoDB Update → Response → Frontend State Update → localStorage Update → 
Toast Notification → UI Update
```

### Guest Users (Not Logged In)
```
User Action → Frontend Validation → localStorage Update → 
Frontend State Update → Toast Notification → UI Update
```

**Note**: When guest users log in, their localStorage data is automatically synced to MongoDB.

## 🧪 Testing Checklist

### Test Cart Functionality

- [ ] **Add to Cart without size selected**
  - Expected: Error toast "Please select a size before adding to cart"
  
- [ ] **Add to Cart with size selected**
  - Expected: Success toast "Item added to cart successfully!"
  - Cart count increases
  - Item appears in cart page
  
- [ ] **Add same product with same size twice**
  - Expected: Quantity increases (not duplicate entry)
  
- [ ] **Add same product with different sizes**
  - Expected: Two separate cart items
  
- [ ] **Increase quantity in cart**
  - Expected: Success toast "Cart updated"
  - Quantity increases
  
- [ ] **Decrease quantity in cart**
  - Expected: Success toast "Cart updated"
  - Quantity decreases
  
- [ ] **Remove item from cart**
  - Expected: Success toast "Item removed from cart"
  - Item disappears from cart
  - Cart count decreases

### Test Wishlist Functionality

- [ ] **Add to Wishlist without size selected**
  - Expected: Error toast "Please select a size before adding to wishlist"
  
- [ ] **Add to Wishlist with size selected**
  - Expected: Success toast "Item added to wishlist!"
  - Wishlist button changes to "Wishlisted"
  - Item appears in wishlist page
  
- [ ] **Add same product with same size twice**
  - Expected: No duplicate (already in wishlist)
  
- [ ] **Add same product with different sizes**
  - Expected: Two separate wishlist items
  
- [ ] **Remove item from wishlist**
  - Expected: Success toast "Item removed from wishlist"
  - Item disappears from wishlist
  - Wishlist button changes back to "Add to Wishlist"

### Test Database Persistence

- [ ] **Add items to cart, refresh page**
  - Expected: Cart items persist
  
- [ ] **Add items to wishlist, refresh page**
  - Expected: Wishlist items persist
  
- [ ] **Login after adding items as guest**
  - Expected: Items sync to database
  
- [ ] **Logout and login again**
  - Expected: Cart and wishlist load from database
  
- [ ] **Check MongoDB database directly**
  - Expected: User document contains cart and wishlist arrays with correct structure

### Test Cross-Device Sync (Authenticated Users)

- [ ] **Add item on Device A**
  - Expected: Item appears on Device B after refresh
  
- [ ] **Remove item on Device B**
  - Expected: Item removed on Device A after refresh

## 🔍 Debugging

### Check Browser Console
Open browser DevTools (F12) and check Console tab for:
- `addToCart called:` - Shows cart operations
- `addToWishlist called:` - Shows wishlist operations
- API errors (if any)

### Check Network Tab
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Perform cart/wishlist operations
4. Check requests to:
   - `/api/users/me/cart`
   - `/api/users/me/wishlist`
5. Verify response status (200 = success)

### Check localStorage
1. Open DevTools → Application tab
2. Expand "Local Storage"
3. Check for keys:
   - `cart` - Contains cart items
   - `wishlist` - Contains wishlist items
   - `auth_token` - Contains JWT token (if logged in)

### Check MongoDB Database
Connect to MongoDB and check the `users` collection:
```javascript
// Example user document
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john@example.com",
  cart: [
    {
      product: ObjectId("..."),
      quantity: 2,
      size: "M",
      addedAt: ISODate("2025-12-09T...")
    }
  ],
  wishlist: [
    {
      product: ObjectId("..."),
      size: "L",
      addedAt: ISODate("2025-12-09T...")
    }
  ]
}
```

## 🚀 Running the Application

### Backend (Port 5000)
```bash
cd backend
npm run dev
```

### Frontend (Port 3000)
```bash
cd frontend
npm start
```

### Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## ✨ Key Features

1. **Real-time Feedback**: Toast notifications for every action
2. **Data Persistence**: Saved in both localStorage and MongoDB
3. **Size Support**: Both cart and wishlist support size variants
4. **Duplicate Prevention**: Same product-size combo won't be added twice
5. **Guest Support**: Works without login, syncs on login
6. **Error Handling**: Graceful fallback to local storage if API fails
7. **Validation**: Prevents adding items without selecting size
8. **Cross-device Sync**: Changes sync across devices for logged-in users

## 📝 Notes

- Cart and wishlist are automatically synced when user logs in
- Guest users' data is stored in localStorage only
- Authenticated users' data is stored in both localStorage and MongoDB
- If backend is down, operations continue with localStorage
- Toast notifications are rate-limited to prevent spam (8-15 seconds)
