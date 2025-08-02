#!/usr/bin/env node

/*
  start-cloudflare-tunnel.js
  -------------------------------------------
  Usage:
    node start-cloudflare-tunnel.js

  This script will:
    1. Start a Cloudflare tunnel on port 9015
    2. Extract the tunnel URL from cloudflared output
    3. Update .env.local with the tunnel URL
    4. Display instructions for restarting the dev server
*/

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 9015;

// Function to update .env.local with the tunnel URL
function updateEnvWithTunnelUrl(tunnelUrl) {
  const envPath = path.join(__dirname, '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const newUrl = `NEXT_PUBLIC_BASE_URL=${tunnelUrl}`;
  
  if (/^NEXT_PUBLIC_BASE_URL=.*/m.test(envContent)) {
    // Replace existing URL
    envContent = envContent.replace(/^NEXT_PUBLIC_BASE_URL=.*/m, newUrl);
  } else {
    // Add new URL
    envContent += `\n${newUrl}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated .env.local with Cloudflare tunnel URL: ${tunnelUrl}`);
}

// Start cloudflared as a child process
console.log(`🚀 Starting Cloudflare tunnel on port ${PORT}...`);
console.log('📋 Make sure cloudflared is installed:');
console.log('   Download: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/');
console.log('   Or use chocolatey: choco install cloudflared');
console.log('');

const cloudflaredProcess = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${PORT}`], { 
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

let urlFound = false;

cloudflaredProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`cloudflared: ${output.trim()}`);
  
  // Extract the URL from cloudflared output
  if (!urlFound) {
    const matches = output.match(/(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/i);
    if (matches) {
      const tunnelUrl = matches[1];
      console.log('');
      console.log('🎉 Cloudflare tunnel is ready!');
      console.log(`🌐 Public URL: ${tunnelUrl}`);
      console.log('');
      
      // Update .env.local with the tunnel URL
      updateEnvWithTunnelUrl(tunnelUrl);
      
      console.log('📋 Next steps:');
      console.log('1. ⚠️  RESTART your development server to pick up the new URL:');
      console.log('   Ctrl+C (stop current server) then run: npm run dev');
      console.log('2. 📧 Test email signature links from external devices');
      console.log('3. 📱 Access forms from mobile devices using the tunnel URL');
      console.log('4. 🔗 All form links in emails will use the tunnel URL');
      console.log('');
      console.log('⚠️  Keep this terminal window open while testing!');
      
      urlFound = true;
    }
  }
});

cloudflaredProcess.stderr.on('data', (data) => {
  const output = data.toString();
  console.log(`cloudflared stderr: ${output.trim()}`);
  
  // Also check stderr for the URL (sometimes it appears there)
  if (!urlFound) {
    const matches = output.match(/(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/i);
    if (matches) {
      const tunnelUrl = matches[1];
      console.log('');
      console.log('🎉 Cloudflare tunnel is ready!');
      console.log(`🌐 Public URL: ${tunnelUrl}`);
      console.log('');
      
      // Update .env.local with the tunnel URL
      updateEnvWithTunnelUrl(tunnelUrl);
      
      console.log('📋 Next steps:');
      console.log('1. ⚠️  RESTART your development server to pick up the new URL:');
      console.log('   Ctrl+C (stop current server) then run: npm run dev');
      console.log('2. 📧 Test email signature links from external devices');
      console.log('3. 📱 Access forms from mobile devices using the tunnel URL');
      console.log('4. 🔗 All form links in emails will use the tunnel URL');
      console.log('');
      console.log('⚠️  Keep this terminal window open while testing!');
      
      urlFound = true;
    }
  }
});

cloudflaredProcess.on('close', (code) => {
  console.log(`\nCloudflare tunnel process exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Cloudflare tunnel...');
  cloudflaredProcess.kill();
  process.exit(0);
});

console.log('Waiting for Cloudflare tunnel to start...');
console.log('This may take a few seconds...');
console.log('');
console.log('After the tunnel URL appears:');
console.log('1. Copy the HTTPS tunnel URL from above');
console.log('2. Run: node setup-cloudflare-url.js https://your-tunnel-url.trycloudflare.com');
console.log('3. Restart your dev server: npm run dev');
console.log('4. Test email signature functionality');
console.log('5. Access forms from mobile devices using the tunnel URL');