#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏥 Emergency Healthcare System Setup');
console.log('=====================================\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 14) {
  console.error('❌ Node.js version 14 or higher is required');
  console.error(`Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Check if MongoDB is available
try {
  execSync('mongod --version', { stdio: 'ignore' });
  console.log('✅ MongoDB is installed');
} catch (error) {
  console.log('⚠️  MongoDB not found. Please install MongoDB:');
  console.log('   - Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/');
  console.log('   - macOS: brew install mongodb-community');
  console.log('   - Linux: https://docs.mongodb.com/manual/administration/install-on-linux/');
}

console.log('\n📦 Installing dependencies...');

try {
  // Install root dependencies
  console.log('Installing server dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Install client dependencies
  console.log('Installing client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });
  
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  console.error(error.message);
  process.exit(1);
}

// Create .env file if it doesn't exist
if (!fs.existsSync('.env')) {
  console.log('\n📝 Creating environment configuration...');
  
  const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/emergency_healthcare

# JWT Configuration
JWT_SECRET=emergency_healthcare_super_secret_key_2024
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=emergency_healthcare_refresh_secret_key_2024

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# File Upload
MAX_FILE_SIZE=10mb
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ Environment file created');
} else {
  console.log('✅ Environment file already exists');
}

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
}

console.log('\n🌱 Setting up database with sample data...');

try {
  execSync('node server/seeds/seedData.js', { stdio: 'inherit' });
  console.log('✅ Database seeded successfully');
} catch (error) {
  console.log('⚠️  Database seeding failed. You can run it manually later with: npm run seed');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Make sure MongoDB is running:');
console.log('   - Windows: net start MongoDB');
console.log('   - macOS/Linux: sudo systemctl start mongod');
console.log('');
console.log('2. Start the development server:');
console.log('   npm run dev');
console.log('');
console.log('3. Open your browser and navigate to:');
console.log('   http://localhost:3000');
console.log('');
console.log('🔐 Demo Account Credentials:');
console.log('   Patient: patient@demo.com / password123');
console.log('   Doctor: doctor@demo.com / password123');
console.log('   Admin: admin@demo.com / password123');
console.log('');
console.log('🆘 Emergency Hotline: 911');
console.log('');
console.log('📚 For more information, check the README.md file');
console.log('');
console.log('Happy coding! 🚀');