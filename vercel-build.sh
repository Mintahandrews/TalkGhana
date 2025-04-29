#!/bin/bash

# TalkGhana Vercel Build Script
# This script ensures all dependencies are installed and fixes are applied before building

echo "🚀 Starting TalkGhana Vercel Build"

# Make sure critical dependencies are installed
echo "📦 Checking dependencies..."
npm install i18next-http-backend --save

# Apply fixes if needed
echo "🔧 Applying build fixes..."
node fix-build-errors.cjs

# Run the actual build
echo "🏗️ Building TalkGhana..."
npm run build

echo "✅ Build completed successfully!" 