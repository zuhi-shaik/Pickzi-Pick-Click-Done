const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const User = require('./models/User');

// Simple test to verify the fix
async function testFix() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pickzi');
    console.log('Connected to MongoDB');

    // Clean up test data
    await User.deleteMany({ email: /test.*@example\.com/ });

    const app = express();
    app.use(express.json());
    
    // Import the routes
    const userRoutes = require('./routes/userRoutes');
    app.use('/api/users', userRoutes);

    console.log('\n=== Testing Registration Fix ===');

    // Test 1: Register with new email
    console.log('\n1. Testing new registration...');
    const response1 = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Test User',
        username: 'testuser123',
        email: 'test@example.com',
        mobile: '1234567890',
        password: 'TestPass123',
        confirmPassword: 'TestPass123'
      });

    console.log('Response 1:', response1.status, response1.body.message);

    // Test 2: Try to register again with same email (should update existing)
    console.log('\n2. Testing duplicate registration with same email...');
    const response2 = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Updated User',
        username: 'updateduser',
        email: 'test@example.com',
        mobile: '0987654321',
        password: 'NewPass123',
        confirmPassword: 'NewPass123'
      });

    console.log('Response 2:', response2.status, response2.body.message);

    // Test 3: Check if user was updated
    console.log('\n3. Checking user data...');
    const user = await User.findOne({ email: 'test@example.com' });
    if (user) {
      console.log('User found:', {
        name: user.name,
        username: user.username,
        mobile: user.mobile,
        emailVerified: user.emailVerified
      });
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testFix();
}
