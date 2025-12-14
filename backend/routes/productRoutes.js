const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/products - list all products (optional filter by category)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = {};
    if (category) query.category = category;
    const products = await Product.find(query).sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/products/:id - get one product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/products - create product (protected)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, new_price, old_price, category, image, sizes, colors, rating, stock } = req.body;
    if (!name || new_price === undefined || !category) {
      return res.status(400).json({ message: 'Please provide name, new_price, and category' });
    }
    const product = await Product.create({ name, description, new_price, old_price, category, image, sizes, colors, rating, stock });
    return res.status(201).json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/products/:id - update product (protected)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, new_price, old_price, category, image, sizes, colors, rating, stock } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, new_price, old_price, category, image, sizes, colors, rating, stock },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/products/:id - delete product (protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json({ message: 'Product deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DEV-ONLY: seed some sample products
router.get('/seed/dev', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Seeding disabled in production' });
    }
    const samples = [
      { name: 'Classic Tee', description: 'Soft cotton tee', new_price: 999, old_price: 1299, category: 'men', image: '', sizes: ['S','M','L'], colors: ['black','white'], rating: 4.3, stock: 100 },
      { name: 'Summer Dress', description: 'Floral print', new_price: 1999, old_price: 2499, category: 'women', image: '', sizes: ['S','M','L'], colors: ['red','blue'], rating: 4.6, stock: 80 },
      { name: 'Kids Hoodie', description: 'Comfy hoodie', new_price: 1499, old_price: 1799, category: 'kids', image: '', sizes: ['XS','S','M'], colors: ['green','yellow'], rating: 4.2, stock: 60 },
    ];
    await Product.deleteMany({});
    const created = await Product.insertMany(samples);
    return res.json({ count: created.length, products: created });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DEV-ONLY: seed full website catalog
router.get('/seed/all', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Seeding disabled in production' });
    }

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
    return res.json({ count: created.length, products: created });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
