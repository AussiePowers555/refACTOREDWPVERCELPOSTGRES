# 🌐 Cloudflare Tunnel Setup Guide

## 📋 Overview

This guide helps you set up Cloudflare tunnels for testing email signatures, PDF generation, and external form access in your motorcycle rental management system.

## 🚀 Quick Start (Recommended)

### Step 1: Install cloudflared
```bash
# Option 1: Download from Cloudflare
# Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Option 2: Using Chocolatey (Windows)
choco install cloudflared

# Option 3: Using Homebrew (macOS)
brew install cloudflared
```

### Step 2: Start Tunnel (Automated)
```bash
# Use our automated script
npm run tunnel
```

### Step 3: Restart Development Server
```bash
# Stop current server: Ctrl+C
npm run dev
```

## 🔧 Manual Setup

### Option 1: Manual Cloudflare Tunnel
```bash
# Start tunnel manually
cloudflared tunnel --url http://localhost:9015

# Copy the tunnel URL (e.g., https://abc123.trycloudflare.com)
# Update environment
node setup-cloudflare-url.js https://abc123.trycloudflare.com

# Restart dev server
npm run dev
```

### Option 2: Network IP (Local Testing)
```bash
# Find your IP address
ipconfig

# Update environment with your local IP
echo NEXT_PUBLIC_BASE_URL=http://192.168.1.100:9015 >> .env.local

# Restart dev server
npm run dev
```

## 🎯 Testing Capabilities

### Email Signature Testing ✉️
- Send emails with secure signature links
- Links work from any device with internet access
- Test signature capture and PDF generation
- Verify cross-device functionality

### PDF Generation Testing 📄
- Test PDF generation from customer forms
- Verify document templates and layouts
- Test signature embedding in PDFs
- Validate file storage and retrieval

### External Form Access 📱
- Allow customers to access forms from mobile devices
- Test form prefilling and validation
- Verify data submission workflows
- Cross-browser compatibility testing

### JotForm Integration 🔗
- Test webhook endpoints with external URLs
- Verify form data synchronization
- Test automated workflows
- Integration testing with third-party services

## 📋 Complete Testing Workflow

### 1. Environment Setup
```bash
# Install cloudflared (one-time setup)
choco install cloudflared

# Start development server
npm run dev
```

### 2. Tunnel Creation
```bash
# Start Cloudflare tunnel (new terminal)
npm run tunnel

# Wait for tunnel URL to appear
# Example: https://abc123.trycloudflare.com
```

### 3. Environment Update
```bash
# Automatic: The tunnel script updates .env.local automatically
# Or manual: node setup-cloudflare-url.js https://your-url.trycloudflare.com
```

### 4. Server Restart
```bash
# Stop current dev server: Ctrl+C
npm run dev
```

### 5. Testing Phase
- Send test emails with signature links
- Access forms from mobile devices
- Test PDF generation workflows
- Verify signature capture functionality

## ⚠️  Important Notes

### Keep Tunnel Active
- Keep the cloudflared terminal window open during testing
- Tunnel URL changes each restart (free tier limitation)
- All email links will use the tunnel URL for external access

### Environment Variables
- Next.js only reads environment variables at startup
- **ALWAYS restart dev server** after changing `NEXT_PUBLIC_BASE_URL`
- Changes to `.env.local` require server restart

### Security Considerations
- Tunnel URLs are temporary and public
- Don't use production data with temporary tunnels
- Tunnel automatically expires after inactivity

## 🛠️ Available Scripts

```bash
# Start Cloudflare tunnel with auto-setup
npm run tunnel

# Update environment with tunnel URL
npm run tunnel:setup https://your-url.trycloudflare.com

# Start development server
npm run dev

# Auto-restart development server (for env changes)
npm run dev:auto-restart
```

## 🔍 Troubleshooting

### Tunnel Won't Start
```bash
# Check if cloudflared is installed
cloudflared version

# If not installed:
choco install cloudflared

# Or download from:
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

### URL Not Updating
```bash
# Manually update environment
node setup-cloudflare-url.js https://your-tunnel-url.trycloudflare.com

# Restart dev server
npm run dev
```

### Forms Not Loading
```bash
# Check current environment variable
cat .env.local | grep NEXT_PUBLIC_BASE_URL

# Verify tunnel is active
curl https://your-tunnel-url.trycloudflare.com/api/health
```

### Email Links Not Working
1. Verify tunnel URL is accessible from external devices
2. Check that dev server restarted after environment update
3. Verify email templates are using `NEXT_PUBLIC_BASE_URL`
4. Test tunnel URL directly in browser

## 📚 Additional Resources

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Email Signature Testing Guide](./IMMEDIATE_EMAIL_SIGNATURE_TESTING.md)
- [Local Development Alternatives](./LOCAL_EMAIL_TESTING_ALTERNATIVES.md)

## 🆘 Need Help?

1. Check that cloudflared is installed and working
2. Verify development server is running on port 9015
3. Ensure tunnel URL is accessible from external devices
4. Confirm environment variables are updated and server restarted
5. Test with simple HTTP requests before testing full workflows

**Your email signature testing will work perfectly with Cloudflare tunnel!** 🎉