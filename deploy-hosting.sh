#!/bin/bash

# Deploy Hosting Only
# This script deploys just the hosting (skips functions)

echo "🚀 Deploying Hosting to Firebase..."
echo ""

# Check if service account exists
if [ ! -f "service-account.json" ]; then
    echo "❌ Error: service-account.json not found!"
    exit 1
fi

# Set environment variable for authentication
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/service-account.json"

# Build the client
echo "📦 Building client..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Deploy only hosting
echo "🌐 Deploying hosting..."
npx firebase deploy --only hosting --project uno-games-b20ed

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Hosting deployed successfully!"
    echo ""
    echo "🌐 Your UNO game is now live at:"
    echo "   https://uno-games-b20ed.web.app"
    echo "   https://uno-games-b20ed.firebaseapp.com"
    echo ""
else
    echo "❌ Hosting deployment failed!"
    exit 1
fi
