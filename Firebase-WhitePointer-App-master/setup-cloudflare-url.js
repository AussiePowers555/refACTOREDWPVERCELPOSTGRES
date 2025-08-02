#!/usr/bin/env node

/*
  setup-cloudflare-url.js
  -------------------------------------------
  Usage:
    # Pass hostname directly
    node setup-cloudflare-url.js https://sign.whitepointer.com

    # OR, let the script read it from the Cloudflare config (default config path)
    node setup-cloudflare-url.js

  The script will:
    1. Determine the public Cloudflare Tunnel hostname.
    2. Update or append NEXT_PUBLIC_BASE_URL in .env.local.
    3. Log the result and optionally advise to restart the dev server.
*/

const fs = require('fs');
const path = require('path');
const os = require('os');
let yaml;
try {
  yaml = require('yaml');
} catch (e) {
  console.error('❌ Dependency "yaml" not installed. Run "npm install yaml --save-dev" first.');
  process.exit(1);
}

const CONFIG_PATH = path.join(os.homedir(), '.cloudflared', 'config.yml');

function getHostnameFromArgsOrConfig() {
  const arg = process.argv[2];
  if (arg && /^https?:\/\//.test(arg)) {
    return arg.replace(/\/$/, '');
  }

  // Fallback: parse cloudflared config
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const cfg = yaml.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      if (cfg.hostname) return `https://${cfg.hostname.replace(/\/$/, '')}`;
    } catch (err) {
      console.error('Could not parse cloudflared config:', err.message);
    }
  }

  console.error('❌ No hostname provided and none found in cloudflared config.');
  console.info('Usage: node setup-cloudflare-url.js https://sign.example.com');
  process.exit(1);
}

function updateEnv(baseUrl) {
  const envPath = path.join(__dirname, '.env.local');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const line = `NEXT_PUBLIC_BASE_URL=${baseUrl}`;
  if (/^NEXT_PUBLIC_BASE_URL=.*/m.test(envContent)) {
    envContent = envContent.replace(/^NEXT_PUBLIC_BASE_URL=.*/m, line);
  } else {
    envContent += `\n${line}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated .env.local with Cloudflare URL: ${baseUrl}`);
}

(function main() {
  const baseUrl = getHostnameFromArgsOrConfig();
  updateEnv(baseUrl);
  console.log('\nℹ️  Restart your dev server or run: npm run dev:auto-restart');
})();
