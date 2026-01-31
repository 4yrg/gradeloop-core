#!/bin/bash
set -e

# Setup Env
export EMAIL_DB_NAME="test_email_service"
export SMTP_HOST="localhost"
export SMTP_PORT="1025" # Mock port
export SMTP_FROM="test@example.com"
# ... other vars if needed

# Clean up old DB
rm -f test_email_service.db

# Build
echo "Building..."
cd services/go/email
go mod tidy
go build -o email_service cmd/main.go
cd ../../..

# Start Service
echo "Starting Service..."
./services/go/email/email_service &
PID=$!
sleep 2

# Test 1: List Templates (Should be empty initially unless FS has some)
echo "Testing List Templates..."
curl -s http://localhost:50053/internal/email/templates | grep "\[\]" && echo "Templates list is empty (Correct)"

# Test 2: Send Email (Will fail if no template, but verify API component)
echo "Testing Send Email (Expected failure due to missing template)..."
curl -X POST -H "Content-Type: application/json" -d '{"template_name": "welcome", "recipient": "user@example.com", "data": {"username": "John"}}' http://localhost:50053/internal/email/send
echo ""

# Create a dummy template file for FS fallback testing
mkdir -p services/go/email/templates
echo "<h1>Welcome {{.username}}</h1>" > services/go/email/templates/welcome.html

# Test 3: Send Email with FS Template
echo "Testing Send Email with FS Template..."
# Note: TemplateService FS fallback looks in "templates/" relative to working dir.
# When running from root, it might look in root/templates.
# I should ensure the service runs inside services/go/email or configured path.
# My script ran it from root relative path.
# Let's fix the script to run service from its dir.

kill $PID
wait $PID 2>/dev/null

echo "Restarting Service from its directory..."
cd services/go/email
./email_service &
PID=$!
cd ../../..
sleep 2

echo "Retrying Send Email..."
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"template_name": "welcome", "recipient": "user@example.com", "data": {"username": "John"}}' http://localhost:50053/internal/email/send)
echo $RESPONSE

if [[ $RESPONSE == *"queued"* ]]; then
    echo "Email Queued Successfully!"
else
    echo "Email Send Failed!"
    exit 1
fi

# Cleanup
kill $PID
rm services/go/email/test_email_service.db
rm services/go/email/email_service
rm -rf services/go/email/templates
echo "Done!"
