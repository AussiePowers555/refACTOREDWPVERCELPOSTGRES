#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🌐 Setting up local IP for email signature testing...');

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip loopback and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost';
}

const localIP = getLocalIP();
const baseUrl = `http://${localIP}:9003`;

console.log(`✅ Found local IP: ${localIP}`);

// Update .env.local
const envPath = path.join(__dirname, '.env.local');
let envContent = '';

try {
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
} catch (err) {
  console.log('Creating new .env.local file...');
}

// Replace or add NEXT_PUBLIC_BASE_URL
if (envContent.includes('NEXT_PUBLIC_BASE_URL=')) {
  envContent = envContent.replace(/NEXT_PUBLIC_BASE_URL=.*/, `NEXT_PUBLIC_BASE_URL=${baseUrl}`);
} else {
  envContent += `\nNEXT_PUBLIC_BASE_URL=${baseUrl}\n`;
}

fs.writeFileSync(envPath, envContent);

console.log(`✅ Updated .env.local with: ${baseUrl}`);
console.log('\n📱 Testing Instructions:');
console.log('1. Restart your development server: npm run dev');
console.log(`2. Access your app from mobile devices: ${baseUrl}`);
console.log('3. Test email signature forms from phones/tablets on same WiFi');
console.log('4. Verify PDF generation and signature capture');
console.log('\n⚠️  Make sure mobile devices are on the same WiFi network!');