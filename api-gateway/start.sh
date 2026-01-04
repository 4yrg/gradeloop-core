#!/bin/bash

# ============================================================================
# GradeLoop API Gateway - Quick Start Script
# ============================================================================
# This script sets up and starts the Traefik API Gateway
# ============================================================================

set -e

echo "=========================================="
echo "GradeLoop API Gateway Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check Docker
echo -e "${YELLOW}[1/6]${NC} Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"
echo ""

# Step 2: Check if running from project root or api-gateway folder
echo -e "${YELLOW}[2/6]${NC} Checking location..."
if [ -f "../compose.yaml" ]; then
    COMPOSE_FILE="../compose.yaml"
    echo -e "${GREEN}✓ Found root compose.yaml${NC}"
elif [ -f "compose.yaml" ]; then
    COMPOSE_FILE="compose.yaml"
    echo -e "${GREEN}✓ Running from project root${NC}"
else
    echo -e "${RED}Error: compose.yaml not found. Run from project root or api-gateway/ folder${NC}"
    exit 1
fi
echo ""

# Step 3: Create directories
echo -e "${YELLOW}[3/6]${NC} Creating required directories..."
mkdir -p logs certs
chmod 755 logs
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Step 4: Setup certificates
echo -e "${YELLOW}[4/6]${NC} Setting up TLS certificates..."
if [ ! -f "certs/acme.json" ]; then
    touch certs/acme.json
    chmod 600 certs/acme.json
    echo -e "${GREEN}✓ Created acme.json for Let's Encrypt${NC}"
else
    echo -e "${GREEN}✓ acme.json already exists${NC}"
fi

# Optional: Generate self-signed cert for development
read -p "Generate self-signed certificate for development? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ ! -f "certs/gradeloop.crt" ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout certs/gradeloop.key \
            -out certs/gradeloop.crt \
            -subj "/CN=gradeloop.local" \
            2>/dev/null
        echo -e "${GREEN}✓ Self-signed certificate generated${NC}"
    else
        echo -e "${GREEN}✓ Certificate already exists${NC}"
    fi
fi
echo ""

# Step 5: Validate configuration
echo -e "${YELLOW}[5/6]${NC} Validating Traefik configuration..."
if [ ! -f "traefik.yml" ]; then
    echo -e "${RED}Error: traefik.yml not found${NC}"
    exit 1
fi
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found${NC}"
    exit 1
fi
if [ ! -d "dynamic" ]; then
    echo -e "${RED}Error: dynamic/ directory not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Configuration files validated${NC}"
echo ""

# Step 6: Start Traefik
echo -e "${YELLOW}[6/6]${NC} Starting Traefik API Gateway..."
docker-compose -f "$COMPOSE_FILE" up -d traefik

# Wait for Traefik to be healthy
echo -e "${YELLOW}Waiting for Traefik to be healthy...${NC}"
sleep 5

if docker ps | grep -q gradeloop-api-gateway; then
    echo -e "${GREEN}✓ Traefik is running${NC}"
    echo ""
    echo "=========================================="
    echo -e "${GREEN}API Gateway Started Successfully!${NC}"
    echo "=========================================="
    echo ""
    echo "Gateway is listening on:"
    echo "  - HTTP:  http://localhost:80  (redirects to HTTPS)"
    echo "  - HTTPS: https://localhost:443"
    echo ""
    echo "Metrics available at:"
    echo "  - http://localhost:8082/metrics"
    echo ""
    echo "Logs:"
    echo "  - docker-compose logs -f traefik"
    echo "  - tail -f logs/access.log"
    echo ""
    echo "Health check:"
    echo "  - docker exec gradeloop-api-gateway traefik healthcheck --ping"
    echo ""
    echo "Next steps:"
    echo "  1. Start your backend services"
    echo "  2. Ensure they connect to 'gradeloop-network'"
    echo "  3. Test routing: curl https://localhost/health"
    echo ""
else
    echo -e "${RED}Error: Traefik failed to start${NC}"
    echo "Check logs with: docker-compose logs traefik"
    exit 1
fi
