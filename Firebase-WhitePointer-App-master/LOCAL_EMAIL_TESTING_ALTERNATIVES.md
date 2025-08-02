# 🔧 Alternative Ways to Test Email Secure Links Locally

## 🎯 **Problem**: Need to test email signature links locally

## ✅ **Solution Options**:

### **Option 1: Network IP Address (RECOMMENDED)**
Use your local network IP to access from other devices:

1. **Find your IP address:**
   ```bash
   # Windows
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   ```

2. **Update .env.local:**
   ```bash
   NEXT_PUBLIC_BASE_URL=http://192.168.1.100:9003
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

4. **Test from mobile devices on same WiFi:**
   - Access: `http://192.168.1.100:9003`
   - Email links will work from phones/tablets on same network

### **Option 2: Cloudflare Tunnel (RECOMMENDED for External Access)**
```bash
# Install cloudflared (download from cloudflare.com)
# Or use chocolatey: choco install cloudflared

# Start tunnel
cloudflared tunnel --url http://localhost:9015

# Update environment with the provided URL
node setup-cloudflare-url.js https://abc123.trycloudflare.com
```

### **Option 3: Serveo.net (No Installation)**
```bash
# SSH tunnel (no registration needed)
ssh -R 80:localhost:9003 serveo.net

# Copy the provided URL and update environment
```

### **Option 4: Development Email Testing**
Create a mock email testing environment:

```javascript
// In your email service, add development mode
const isDevelopment = process.env.NODE_ENV === 'development';
const baseUrl = isDevelopment 
  ? 'http://localhost:9003' 
  : process.env.NEXT_PUBLIC_BASE_URL;

// Log email content instead of sending
if (isDevelopment) {
  console.log('📧 Email would be sent:', {
    to: recipient,
    subject: subject,
    links: extractLinks(emailContent)
  });
}
```

### **Option 5: QR Code Testing**
Generate QR codes for quick mobile testing:

```bash
# Install qrcode generator
npm install qrcode-terminal

# Add to your test script
const qrcode = require('qrcode-terminal');
qrcode.generate('http://192.168.1.100:9003/forms/authority/test-token', {small: true});
```

## 🚀 **Recommended Setup:**

1. **Use Network IP** (Option 1) for basic testing
2. **Add Cloudflare Tunnel** for external testing and production-like environment
3. **Create development email logging** for debugging

## 📱 **Testing Workflow:**
1. Update NEXT_PUBLIC_BASE_URL with your choice
2. Restart development server
3. Send test emails
4. Access links from mobile devices
5. Verify signature capture and PDF generation

## 🔧 **Quick Implementation:**
```bash
# 1. Get your IP
ipconfig

# 2. Update environment
echo "NEXT_PUBLIC_BASE_URL=http://YOUR_IP:9003" >> .env.local

# 3. Restart server
npm run dev
```

**Your email signature testing will work perfectly with any of these methods!**