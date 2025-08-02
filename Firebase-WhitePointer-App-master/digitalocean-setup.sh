#!/bin/bash

# DigitalOcean Droplet Setup Script
# Run this on a fresh Ubuntu 22.04 droplet

set -e

echo "🌊 Setting up DigitalOcean Droplet for WhitePointer App..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_blue() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2
print_status "Installing PM2..."
npm install -g pm2

# Install Nginx
print_status "Installing Nginx..."
apt install nginx -y

# Install UFW firewall
print_status "Setting up firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Create app user
print_status "Creating app user..."
useradd -m -s /bin/bash whitepointer
usermod -aG sudo whitepointer

# Create app directory
print_status "Setting up application directory..."
mkdir -p /var/www/whitepointer
chown whitepointer:whitepointer /var/www/whitepointer

# Setup Nginx configuration
print_blue "Setting up Nginx configuration..."
cat > /etc/nginx/sites-available/whitepointer << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for large file uploads
        proxy_read_timeout 86400;
        client_max_body_size 50M;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/whitepointer /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Install Certbot for SSL (optional)
print_status "Installing Certbot for SSL..."
apt install certbot python3-certbot-nginx -y

print_status "✅ DigitalOcean Droplet setup complete!"
echo ""
print_blue "Next steps:"
echo "1. Upload your app to /var/www/whitepointer"
echo "2. Run: sudo -u whitepointer ./deploy.sh"
echo "3. Set up SSL: sudo certbot --nginx -d yourdomain.com"
echo "4. Your app will be available at http://your-droplet-ip"
echo ""
print_blue "Useful commands:"
echo "- Check app status: sudo -u whitepointer pm2 list"
echo "- View logs: sudo -u whitepointer pm2 logs"
echo "- Restart app: sudo -u whitepointer pm2 restart whitepointer-app"