#!/bin/bash

echo "🚀 Setting up Growvia Worker and CLI features..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install worker dependencies
echo "🔧 Installing worker dependencies..."
cd apps/worker
npm install
cd ../..

# Install CLI dependencies
echo "⚡ Installing CLI dependencies..."
cd packages/cli
npm install
cd ../..

# Build all packages
echo "🏗️ Building packages..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the API server: npm run api:dev"
echo "2. Start the worker service: npm run worker:dev"
echo "3. Use CLI tools: npx @growvia/cli --help"
