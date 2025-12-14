const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const Product = require('./models/Product');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(express.json()); // parse JSON

// Serve uploaded files statically
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Routes
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.get('/', (req, res) => {
  res.send('Hello from Backend! 🚀');
});
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Auto-seed helper (dev only)
async function seedCatalogOverwriteDev() {
  if (process.env.NODE_ENV === 'production') return; // never seed in production
  try {
    const forceSeed = (process.env.DEV_FORCE_SEED || '').toLowerCase() === 'true';
    const existingCount = await Product.countDocuments();
    if (!forceSeed && existingCount > 0) {
      console.log('ℹ️ Dev seed skipped: catalog already populated');
      return;
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
    if (forceSeed) {
      await Product.deleteMany({});
    }
    const inserted = await Product.insertMany(catalog, { ordered: true });
    console.log(`🔁 Dev seed complete: ${inserted.length} products inserted${forceSeed ? ' (forced)' : ''}`);
  } catch (err) {
    console.log('⚠️ Dev seed failed:', err.message);
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('✅ MongoDB connected!');
  // Always overwrite with the canonical catalog in development
  await seedCatalogOverwriteDev();
  // Bootstrap admin user
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const adminName = process.env.ADMIN_NAME || 'Administrator';
    if (adminEmail && adminPassword) {
      let admin = await User.findOne({ email: adminEmail.toLowerCase() });
      if (!admin) {
        admin = new User({
          name: adminName,
          username: adminUsername,
          email: adminEmail.toLowerCase(),
          mobile: '9999999999',
          password: adminPassword,
          emailVerified: true,
          isAdmin: true
        });
        await admin.save();
        console.log('👑 Admin user created from env');
      } else if (!admin.isAdmin) {
        admin.isAdmin = true;
        await admin.save();
        console.log('👑 Existing user promoted to admin');
      }
    } else {
      console.log('ℹ️ Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to auto-create an admin user');
    }
  } catch (e) {
    console.log('⚠️ Admin bootstrap failed:', e.message);
  }
})
.catch(err => console.log('❌ MongoDB connection error:', err));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
