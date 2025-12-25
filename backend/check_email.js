const mongoose = require('mongoose');
const User = require('./models/User');

async function checkEmail() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pickzi', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('Connected to MongoDB');
    
    // Check for existing users with the problematic email
    const email = 'thisisfineee20@gmail.com';
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('\n=== Checking for email:', normalizedEmail, '===');
    
    // Method 1: Exact match
    const exactUsers = await User.find({ email: normalizedEmail });
    console.log('Exact match users found:', exactUsers.length);
    
    // Method 2: Case-insensitive search
    const caseInsensitiveUsers = await User.find({ 
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } 
    });
    console.log('Case-insensitive users found:', caseInsensitiveUsers.length);
    
    // Method 3: Contains search
    const containsUsers = await User.find({ 
      email: { $regex: normalizedEmail, $options: 'i' } 
    });
    console.log('Contains users found:', containsUsers.length);
    
    // Check all users in database
    console.log('\n=== All users in database ===');
    const allUsers = await User.find({}, 'email username emailVerified');
    console.log('Total users in database:', allUsers.length);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: "${user.email}", Username: ${user.username}, Verified: ${user.emailVerified}`);
    });
    
    // Test the exact query from the registration route
    console.log('\n=== Testing exact registration query ===');
    const existingEmailUser = await User.findOne({ email: normalizedEmail })
      .select('+password +emailVerifyHash +emailVerifyExpiresAt +emailVerifyAttempts');
    
    console.log('Registration query result:', existingEmailUser ? 'FOUND' : 'NOT FOUND');
    if (existingEmailUser) {
      console.log('Found user details:', {
        id: existingEmailUser._id,
        email: existingEmailUser.email,
        username: existingEmailUser.username,
        emailVerified: existingEmailUser.emailVerified,
        hasPassword: !!existingEmailUser.password,
        hasEmailVerifyHash: !!existingEmailUser.emailVerifyHash
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkEmail();
