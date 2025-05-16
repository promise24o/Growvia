// This script creates or updates the admin user
// It's designed to be run directly for debugging authentication issues

import mongoose from 'mongoose';
import crypto from 'crypto';
import { config } from 'dotenv';

// Load environment variables
config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MongoDB URI not found in environment variables');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define a simple User schema just for this script
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  status: String,
  organizationId: mongoose.Schema.Types.ObjectId,
  avatar: String,
  createdAt: Date,
  updatedAt: Date
});

// Use mongoose model
const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: 'admin@admin.com' });
    
    // The admin password (will be hashed)
    const password = 'password123';
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    if (existingAdmin) {
      console.log('Admin user exists, updating password and role');
      
      // Update the admin user
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'management';
      existingAdmin.status = 'active';
      await existingAdmin.save();
      
      console.log('Admin user updated successfully');
    } else {
      console.log('Creating new admin user');
      
      // Create a new admin user
      const adminUser = new User({
        name: 'System Administrator',
        email: 'admin@admin.com',
        password: hashedPassword,
        role: 'management',
        status: 'active',
        organizationId: null,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await adminUser.save();
      console.log('Admin user created successfully');
    }
    
    // Log all users for verification
    const allUsers = await User.find();
    console.log('All users in the database:');
    allUsers.forEach(user => {
      console.log(`Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
  }
}

// Run the function
createAdminUser();