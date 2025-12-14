const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const Product = require('../models/Product');
const Order = require('../models/Order');
const upload = require('../middleware/upload');

const router = express.Router();

// Simple health for admin area
router.get('/health', auth, requireAdmin, async (_req, res) => {
  return res.json({ ok: true, time: new Date().toISOString(), env: process.env.NODE_ENV || 'development' });
});

// PRODUCTS: list with optional filters
router.get('/products', auth, requireAdmin, async (req, res) => {
  try {
    const { q, category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q) filter.name = { $regex: q, $options: 'i' };
    const items = await Product.find(filter).sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PRODUCTS: create
router.post('/products', auth, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const newPrice = req.body.new_price != null ? Number(req.body.new_price) : undefined;
    const oldPrice = req.body.old_price != null && req.body.old_price !== '' ? Number(req.body.old_price) : undefined;
    const rating = req.body.rating != null && req.body.rating !== '' ? Number(req.body.rating) : undefined;
    const stock = req.body.stock != null && req.body.stock !== '' ? Number(req.body.stock) : undefined;
    const sizes = Array.isArray(req.body.sizes) ? req.body.sizes : (req.body.sizes ? String(req.body.sizes).split(',').map(s => s.trim()).filter(Boolean) : undefined);
    const colors = Array.isArray(req.body.colors) ? req.body.colors : (req.body.colors ? String(req.body.colors).split(',').map(c => c.trim()).filter(Boolean) : undefined);
    if (!name || newPrice === undefined || !category) {
      return res.status(400).json({ message: 'name, new_price and category are required' });
    }

    // Handle image: use uploaded file path or fallback to provided image field
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/products/${req.file.filename}`;
    } else if (req.body.image) {
      imagePath = req.body.image;
    }
    
    const productData = {
      name,
      description,
      category,
      image: imagePath,
    };

    if (newPrice !== undefined) productData.new_price = newPrice;
    if (oldPrice !== undefined) productData.old_price = oldPrice;
    if (rating !== undefined) productData.rating = rating;
    if (stock !== undefined) productData.stock = stock;
    if (sizes !== undefined) productData.sizes = sizes;
    if (colors !== undefined) productData.colors = colors;

    const created = await Product.create(productData);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PRODUCTS: update
router.put('/products/:id', auth, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    
    const existingProduct = await Product.findById(id);
    if (!existingProduct) return res.status(404).json({ message: 'Product not found' });
    
    const { name, description, category } = req.body;
    const newPrice = req.body.new_price != null && req.body.new_price !== '' ? Number(req.body.new_price) : undefined;
    const oldPrice = req.body.old_price != null && req.body.old_price !== '' ? Number(req.body.old_price) : undefined;
    const rating = req.body.rating != null && req.body.rating !== '' ? Number(req.body.rating) : undefined;
    const stock = req.body.stock != null && req.body.stock !== '' ? Number(req.body.stock) : undefined;
    const sizes = Array.isArray(req.body.sizes) ? req.body.sizes : (req.body.sizes ? String(req.body.sizes).split(',').map(s => s.trim()).filter(Boolean) : undefined);
    const colors = Array.isArray(req.body.colors) ? req.body.colors : (req.body.colors ? String(req.body.colors).split(',').map(c => c.trim()).filter(Boolean) : undefined);

    // Handle image: use new uploaded file if provided, otherwise keep existing
    let imagePath = existingProduct.image;
    if (req.file) {
      imagePath = `/uploads/products/${req.file.filename}`;
    } else if (req.body.image && req.body.image !== existingProduct.image) {
      imagePath = req.body.image;
    }

    const updateData = {
      name: name ?? existingProduct.name,
      description: description ?? existingProduct.description,
      category: category ?? existingProduct.category,
      image: imagePath,
    };

    if (newPrice !== undefined) updateData.new_price = newPrice;
    if (oldPrice !== undefined) updateData.old_price = oldPrice;
    if (rating !== undefined) updateData.rating = rating;
    if (stock !== undefined) updateData.stock = stock;
    if (sizes !== undefined) updateData.sizes = sizes;
    if (colors !== undefined) updateData.colors = colors;

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PRODUCTS: delete
router.delete('/products/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    return res.json({ message: 'Product deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ORDERS: list
router.get('/orders', auth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load orders', error: err.message });
  }
});

// ORDERS: get by id
router.get('/orders/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const order = await Order.findById(id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load order', error: err.message });
  }
});

// ORDERS: update status/notes
router.put('/orders/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

    const update = {};
    const allowed = ['status', 'notes', 'metadata'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    const order = await Order.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update order', error: err.message });
  }
});

// UTIL: dev-only reseed (uses the same catalog as /seed/all)
router.post('/seed', auth, requireAdmin, async (_req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Seeding disabled in production' });
    }
    // Lazy import the route logic to reuse constants
    const productRoutes = require('./productRoutes');
    // Reconstruct the catalog by calling the function in productRoutes via a direct operation
    // Since productRoutes encapsulates the arrays, rebuild here (kept in sync with productRoutes)
    const women = [
      { image: 'product_1.png',  description: 'Dark blue puffer jacket for women', new_price: 899, old_price: 1000, category: 'women' },
      { image: 'product_2.png',  description: 'Striped light pink short sleeves top for women', new_price: 599, old_price: 699, category: 'women' },
      { image: 'product_3.png',  description: 'Short brown top for women', new_price: 399, old_price: 499, category: 'women' },
      { image: 'product_4.png',  description: 'V neck bell sleeves top for women', new_price: 599, old_price: 699, category: 'women' },
      { image: 'product_5.png',  description: 'V neck pink shimmer top for women', new_price: 499, old_price: 599, category: 'women' },
      { image: 'product_6.png',  description: 'Brown full sleeves top for women', new_price: 599, old_price: 699, category: 'women' },
      { image: 'product_7.png',  description: 'White halter neck full sleeve top for women', new_price: 699, old_price: 799, category: 'women' },
      { image: 'product_8.png',  description: 'V neck black floral top for women', new_price: 399, old_price: 499, category: 'women' },
      { image: 'product_9.png',  description: 'Floral printed full sleeves top for women', new_price: 499, old_price: 599, category: 'women' },
      { image: 'product_10.png', description: 'Brown sweater top for women', new_price: 599, old_price: 699, category: 'women' },
      { image: 'product_11.png', description: 'Black short top for women', new_price: 399, old_price: 499, category: 'women' },
      { image: 'product_12.png', description: 'Blue full sleeves top for women', new_price: 599, old_price: 699, category: 'women' },
    ].map((p) => ({ ...p, name: p.description }));

    const men = [
      { image: 'product_13.png', description: 'Sage green zipper jacket for men', new_price: 799, old_price: 899, category: 'men' },
      { image: 'product_14.png', description: 'White puffer jacket for men', new_price: 599, old_price: 699, category: 'men' },
      { image: 'product_15.png', description: 'Black and white jacket for men', new_price: 499, old_price: 599, category: 'men' },
      { image: 'product_16.png', description: 'Multicolor jacket for men', new_price: 499, old_price: 599, category: 'men' },
      { image: 'product_17.png', description: 'Denim jacket for men', new_price: 599, old_price: 699, category: 'men' },
      { image: 'product_18.png', description: 'Grey jacket for men', new_price: 499, old_price: 599, category: 'men' },
      { image: 'product_19.png', description: 'White jacket for men', new_price: 399, old_price: 499, category: 'men' },
      { image: 'product_20.png', description: 'Navy blue jacket for men', new_price: 499, old_price: 599, category: 'men' },
      { image: 'product_21.png', description: 'Multicolor jacket for men', new_price: 599, old_price: 699, category: 'men' },
      { image: 'product_22.png', description: 'White jacket for men', new_price: 599, old_price: 699, category: 'men' },
      { image: 'product_23.png', description: 'Yellow hoodie and blue jacket for men', new_price: 1599, old_price: 1999, category: 'men' },
      { image: 'product_24.png', description: 'Black leather jacket for men', new_price: 1999, old_price: 2999, category: 'men' },
    ].map((p) => ({ ...p, name: p.description }));

    const kids = [
      { image: 'product_25.png', description: 'Blue lemon back print for kids', new_price: 499, old_price: 599, category: 'kids' },
      { image: 'product_26.png', description: 'Black jacket for men', new_price: 499, old_price: 599, category: 'men' },
      { image: 'product_27.png', description: 'Multicolor striped jacket for kids', new_price: 599, old_price: 699, category: 'kids' },
      { image: 'product_28.png', description: 'Sage green sweatshirt for kids', new_price: 699, old_price: 799, category: 'kids' },
      { image: 'product_29.png', description: 'Green multicolor striped jacket for kids', new_price: 599, old_price: 699, category: 'kids' },
      { image: 'product_30.png', description: 'Green jacket for kids', new_price: 699, old_price: 799, category: 'kids' },
      { image: 'product_31.png', description: 'Denim jacket for kids', new_price: 699, old_price: 899, category: 'kids' },
      { image: 'product_32.png', description: 'Blue jacket for kids', new_price: 499, old_price: 599, category: 'kids' },
      { image: 'product_33.png', description: 'Dark blue T-shirt for kids', new_price: 499, old_price: 599, category: 'kids' },
      { image: 'product_34.png', description: 'Dark blue zipped jacket for kids', new_price: 499, old_price: 599, category: 'kids' },
      { image: 'product_35.png', description: 'Black zipped jacket for kids', new_price: 599, old_price: 699, category: 'kids' },
      { image: 'product_36.png', description: 'Black and white zipped jacket for kids', new_price: 599, old_price: 699, category: 'kids' },
    ].map((p) => ({ ...p, name: p.description }));

    const catalog = [...women, ...men, ...kids];
    await Product.deleteMany({});
    const created = await Product.insertMany(catalog);
    return res.json({ count: created.length });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
