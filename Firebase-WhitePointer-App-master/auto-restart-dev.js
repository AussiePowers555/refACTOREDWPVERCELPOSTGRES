#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔄 Auto-restart development server for testing...');

let devProcess = null;
let lastHash = null;

function getFileHash(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileContent).digest('hex');
  } catch (error) {
    console.warn('⚠️ Could not read file for hashing:', error.message);
    return null;
  }
}

function startDevServer() {
  console.log('🚀 Starting development server...');
  
  devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  devProcess.on('close', (code) => {
    if (code !== 0) {
      console.log(`Dev server exited with code ${code}`);
    }
  });
}

function restartDevServer() {
  console.log('🔄 Restarting development server...');
  
  if (devProcess) {
    devProcess.kill('SIGTERM');
    
    setTimeout(() => {
      startDevServer();
    }, 2000);
  } else {
    startDevServer();
  }
}

// Watch .env.local for changes
const envPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envPath)) {
  console.log('👀 Watching .env.local for changes...');
  
  // Initialize the hash
  lastHash = getFileHash(envPath);
  console.log('🔍 Initial .env.local hash:', lastHash?.substring(0, 8) + '...');
  
  fs.watchFile(envPath, (curr, prev) => {
    const newHash = getFileHash(envPath);
    
    if (newHash && newHash !== lastHash) {
      console.log('📝 .env.local content changed (hash: ' + newHash.substring(0, 8) + '...), restarting server...');
      lastHash = newHash;
      restartDevServer();
    } else {
      console.log('📄 .env.local file touched but content unchanged, ignoring...');
    }
  });
}

// Start initial server
startDevServer();

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (devProcess) {
    devProcess.kill('SIGTERM');
  }
  process.exit();
});

console.log('📧 Email signature testing with auto-restart enabled!');
console.log('💡 Change .env.local to automatically restart the server');
console.log('🛑 Press Ctrl+C to stop');