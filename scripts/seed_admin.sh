#!/bin/bash

# Configuration
IDENTITY_SERVICE_URL=${IDENTITY_SERVICE_URL:-"http://localhost:8001"}
INTERNAL_SECRET=${INTERNAL_SECRET:-"insecure-secret-for-dev"}

# Admin User Data
EMAIL="dasun.wickr@gmail.com"
PASSWORD="admin@123"
FULL_NAME="System Administrator"
USER_TYPE="SYSTEM_ADMIN"

echo "Seeding Admin User: $EMAIL"

# Call Identity Service to create the user
# Using /internal/identity/users endpoint
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$IDENTITY_SERVICE_URL/internal/identity/users" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: $INTERNAL_SECRET" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"full_name\": \"$FULL_NAME\",
    \"user_type\": \"$USER_TYPE\"
  }")

if [ "$RESPONSE" == "201" ] || [ "$RESPONSE" == "200" ]; then
  echo "Successfully seeded admin user: $EMAIL"
else
  echo "Failed to seed admin user (HTTP Status: $RESPONSE)"
  # Try to get error message if failed
  curl -s -X POST "$IDENTITY_SERVICE_URL/internal/identity/users" \
    -H "Content-Type: application/json" \
    -H "X-Internal-Token: $INTERNAL_SECRET" \
    -d "{
      \"email\": \"$EMAIL\",
      \"password\": \"$PASSWORD\",
      \"full_name\": \"$FULL_NAME\",
      \"user_type\": \"$USER_TYPE\"
    }"
  exit 1
fi
