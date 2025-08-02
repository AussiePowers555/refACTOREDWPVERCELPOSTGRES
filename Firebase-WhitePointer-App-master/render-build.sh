#!/bin/bash
# Render build script

echo "🎨 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building application..."
npm run build

# Create data directory for SQLite
echo "📁 Creating data directory..."
mkdir -p data

echo "✅ Render build complete!"