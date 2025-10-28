#!/bin/bash

# Growvia Tracking System - Setup Script

set -e

echo "🚀 Setting up Growvia Tracking System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "\n${YELLOW}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18 or higher is required${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version OK${NC}"

# Check MongoDB
echo -e "\n${YELLOW}Checking MongoDB...${NC}"
if command -v mongod &> /dev/null; then
    echo -e "${GREEN}✓ MongoDB installed${NC}"
else
    echo -e "${YELLOW}⚠ MongoDB not found. Please install MongoDB 6.0+${NC}"
fi

# Check Redis
echo -e "\n${YELLOW}Checking Redis...${NC}"
if command -v redis-server &> /dev/null; then
    echo -e "${GREEN}✓ Redis installed${NC}"
else
    echo -e "${YELLOW}⚠ Redis not found. Please install Redis 6.0+${NC}"
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build packages
echo -e "\n${YELLOW}Building packages...${NC}"
npm run build
echo -e "${GREEN}✓ Packages built${NC}"

# Setup environment file
echo -e "\n${YELLOW}Setting up environment...${NC}"
if [ ! -f "apps/api/.env" ]; then
    cp apps/api/.env.example apps/api/.env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠ Please edit apps/api/.env with your configuration${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Create logs directory
mkdir -p logs
echo -e "${GREEN}✓ Created logs directory${NC}"

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Edit apps/api/.env with your MongoDB and Redis settings"
echo "2. Start MongoDB: mongod"
echo "3. Start Redis: redis-server"
echo "4. Start API: npm run api:dev"
echo ""
echo -e "${GREEN}Happy tracking! 🎉${NC}"
