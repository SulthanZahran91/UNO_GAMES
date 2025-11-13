#!/bin/bash

# UNO Game Deployment Script
# This script deploys your UNO game to Firebase

echo "🚀 Deploying UNO Game to Firebase..."
echo ""

# Check if service account exists
if [ ! -f "service-account.json" ]; then
    echo "❌ Error: service-account.json not found!"
    echo "Please make sure the service account file is in the project root."
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

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
npx firebase deploy --project uno-games-b20ed --non-interactive

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Your UNO game is now live at:"
    echo "   https://uno-games-b20ed.web.app"
    echo "   https://uno-games-b20ed.firebaseapp.com"
    echo ""
else
    echo "❌ Deployment failed!"
    echo "Try running: firebase login"
    echo "Then run this script again."
fi
