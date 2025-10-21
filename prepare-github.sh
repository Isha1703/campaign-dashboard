#!/bin/bash

# GitHub Preparation Script
echo "📦 Preparing project for GitHub upload..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    echo "Visit: https://git-scm.com/downloads"
    exit 1
fi

# Initialize git repository if not already initialized
if [ ! -d .git ]; then
    echo "🔧 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    echo "⚠️  .gitignore not found. Please create it first."
    exit 1
fi

# Check for sensitive files
echo "🔍 Checking for sensitive files..."
if [ -f .env ]; then
    echo "⚠️  WARNING: .env file found. Make sure it's in .gitignore!"
    if grep -q "^\.env$" .gitignore; then
        echo "✅ .env is in .gitignore"
    else
        echo "❌ .env is NOT in .gitignore! Adding it now..."
        echo ".env" >> .gitignore
    fi
fi

# Remove sensitive data from session files
echo "🧹 Cleaning up session data..."
if [ -d "public/agent_outputs" ]; then
    echo "  Removing agent outputs (will be regenerated)..."
    # Keep directory structure but remove content
    find public/agent_outputs -type f -delete
fi

if [ -d "public/downloads" ]; then
    echo "  Removing downloaded media (will be regenerated)..."
    find public/downloads -type f -delete
fi

# Stage all files
echo "📝 Staging files for commit..."
git add .

# Show status
echo ""
echo "📊 Git Status:"
git status

echo ""
echo "✅ Project prepared for GitHub!"
echo ""
echo "📋 Next steps:"
echo "1. Review the staged files above"
echo "2. Commit your changes:"
echo "   git commit -m 'Initial commit: Campaign Dashboard'"
echo ""
echo "3. Create a new repository on GitHub:"
echo "   https://github.com/new"
echo ""
echo "4. Add remote and push:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/campaign-dashboard.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "🎉 Your project will be live on GitHub!"
