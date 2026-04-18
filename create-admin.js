require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/al-hadid-welding');
    
    // Check if exists
    let admin = await Admin.findOne({ username: ADMIN_USERNAME });
    if (admin) {
      console.log('👤 Admin exists:', admin.username);
      console.log('🔑 Change password in .env and re-run');
      process.exit(0);
    }

    // Create new
    admin = new Admin({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
    await admin.save();
    
    console.log('✅ Admin created!');
    console.log('👤 Username:', admin.username);
    console.log('🔐 Password:', ADMIN_PASSWORD);
    console.log('🌐 Login: http://localhost:3000/admin/login');
    console.log('⚠️  Change ADMIN_PASSWORD in .env after first login!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

createAdmin();

