#!/bin/bash

# ============================================================================
# GradeLoop API Gateway - Stop Script
# ============================================================================

set -e

echo "=========================================="
echo "Stopping GradeLoop API Gateway"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Stop Traefik
echo -e "${YELLOW}Stopping Traefik container...${NC}"

# Detect compose file location
if [ -f "../compose.yaml" ]; then
    COMPOSE_FILE="../compose.yaml"
elif [ -f "compose.yaml" ]; then
    COMPOSE_FILE="compose.yaml"
else
    echo -e "${RED}Error: compose.yaml not found${NC}"
    exit 1
fi

docker-compose -f "$COMPOSE_FILE" stop traefik

echo -e "${GREEN}✓ API Gateway stopped${NC}"
echo ""

# Optional cleanup
read -p "Remove logs? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf logs/*.log
    echo -e "${GREEN}✓ Logs removed${NC}"
fi

echo ""
echo "Gateway stopped successfully!"
echo ""
echo "To restart: ./start.sh or docker-compose -f compose.yaml up -d traefik"
echo "To start all services: docker-compose -f compose.yaml up -d"
