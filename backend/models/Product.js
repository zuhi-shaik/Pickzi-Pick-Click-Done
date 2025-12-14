const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    // Pricing
    new_price: { type: Number, required: true },
    old_price: { type: Number },
    // Category and media
    category: { type: String, enum: ['men', 'women', 'kids'], required: true },
    image: { type: String },
    // Optional attributes used by filters
    sizes: [{ type: String }],
    colors: [{ type: String }],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    stock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
