#!/bin/bash

# Vercel Deployment Script
echo "🚀 Deploying Campaign Dashboard to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the application
echo "📦 Building application..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the deployment URL"
echo "2. Update your backend CORS settings with this URL"
echo "3. Set VITE_API_URL environment variable in Vercel dashboard"
echo ""
echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
