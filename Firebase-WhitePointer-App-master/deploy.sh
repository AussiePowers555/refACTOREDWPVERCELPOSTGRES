#!/bin/bash

# Deployment script for Node.js + SQLite app
set -e

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or later is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v) ✓"

# Install dependencies
print_status "Installing dependencies..."
npm ci --only=production

# Build the application
print_status "Building application..."
npm run build

# Create necessary directories
print_status "Creating directories..."
mkdir -p logs data

# Set proper permissions for SQLite database
print_status "Setting up database permissions..."
touch data/pbike-rescue.db
chmod 666 data/pbike-rescue.db 2>/dev/null || true
chmod 755 data

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
fi

# Stop existing application if running
print_status "Stopping existing application..."
pm2 stop whitepointer-app 2>/dev/null || true
pm2 delete whitepointer-app 2>/dev/null || true

# Start the application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot (run once)
if ! pm2 list | grep -q "whitepointer-app"; then
    print_warning "Setting up PM2 startup script..."
    pm2 startup
fi

print_status "Deployment completed successfully! 🎉"
print_status "Application is running at: http://localhost:3000"
print_status "Check logs with: pm2 logs whitepointer-app"
print_status "Monitor with: pm2 monit"

# Display application status
echo ""
pm2 list