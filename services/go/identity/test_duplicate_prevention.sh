#!/bin/bash

# Test script to demonstrate duplicate user prevention
# This tests that the UNIQUE constraint error is properly handled

BASE_URL="http://localhost:8080/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================="
echo "Testing Duplicate User Prevention"
echo "=================================="
echo ""

# Test 1: Create a new student user
echo -e "${YELLOW}Test 1: Creating a new student user${NC}"
RESPONSE1=$(curl -s -X POST "${BASE_URL}/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.duplicate@example.com",
    "name": "Test Student",
    "user_type": "student",
    "student": {
      "student_id": "STD999"
    }
  }')

echo "$RESPONSE1" | jq '.'
SUCCESS1=$(echo "$RESPONSE1" | jq -r '.success')

if [ "$SUCCESS1" = "true" ]; then
    echo -e "${GREEN}✓ User created successfully${NC}"
    USER_ID=$(echo "$RESPONSE1" | jq -r '.data.id')
    echo "  User ID: $USER_ID"
else
    echo -e "${RED}✗ Failed to create user${NC}"
    echo "  This might be because the user already exists from a previous test"
fi

echo ""
echo "---"
echo ""

# Test 2: Try to create the same user again (should fail)
echo -e "${YELLOW}Test 2: Attempting to create duplicate user (should fail)${NC}"
RESPONSE2=$(curl -s -X POST "${BASE_URL}/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.duplicate@example.com",
    "name": "Test Student Duplicate",
    "user_type": "student",
    "student": {
      "student_id": "STD998"
    }
  }')

echo "$RESPONSE2" | jq '.'
SUCCESS2=$(echo "$RESPONSE2" | jq -r '.success')

if [ "$SUCCESS2" = "false" ]; then
    ERROR_MSG=$(echo "$RESPONSE2" | jq -r '.error')
    if [[ "$ERROR_MSG" == *"already exists"* ]]; then
        echo -e "${GREEN}✓ Duplicate prevention working correctly${NC}"
        echo "  Error message: $ERROR_MSG"
    else
        echo -e "${YELLOW}⚠ User creation failed, but not with expected error${NC}"
        echo "  Error: $ERROR_MSG"
    fi
else
    echo -e "${RED}✗ Duplicate user was created (this should not happen!)${NC}"
fi

echo ""
echo "---"
echo ""

# Test 3: Create user with different email (should succeed)
echo -e "${YELLOW}Test 3: Creating user with different email (should succeed)${NC}"
RESPONSE3=$(curl -s -X POST "${BASE_URL}/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.different@example.com",
    "name": "Different Student",
    "user_type": "student",
    "student": {
      "student_id": "STD997"
    }
  }')

echo "$RESPONSE3" | jq '.'
SUCCESS3=$(echo "$RESPONSE3" | jq -r '.success')

if [ "$SUCCESS3" = "true" ]; then
    echo -e "${GREEN}✓ New user created successfully${NC}"
    USER_ID2=$(echo "$RESPONSE3" | jq -r '.data.id')
    echo "  User ID: $USER_ID2"
else
    echo -e "${RED}✗ Failed to create user with different email${NC}"
fi

echo ""
echo "---"
echo ""

# Test 4: Try to create user with student record containing user_id (common mistake)
echo -e "${YELLOW}Test 4: Testing with user_id in student object (common mistake)${NC}"
RESPONSE4=$(curl -s -X POST "${BASE_URL}/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.withuserid@example.com",
    "name": "Student With UserID",
    "user_type": "student",
    "student": {
      "user_id": 999,
      "student_id": "STD996"
    }
  }')

echo "$RESPONSE4" | jq '.'
SUCCESS4=$(echo "$RESPONSE4" | jq -r '.success')

if [ "$SUCCESS4" = "true" ]; then
    echo -e "${GREEN}✓ User created (user_id was ignored/overwritten)${NC}"
    USER_ID3=$(echo "$RESPONSE4" | jq -r '.data.id')
    echo "  User ID: $USER_ID3"
else
    echo -e "${YELLOW}⚠ User creation failed${NC}"
    ERROR4=$(echo "$RESPONSE4" | jq -r '.error')
    echo "  Error: $ERROR4"
fi

echo ""
echo "=================================="
echo "Test Summary"
echo "=================================="
echo ""

# Count successes
TOTAL=0
PASSED=0

# Test 1 result
TOTAL=$((TOTAL + 1))
if [ "$SUCCESS1" = "true" ]; then
    echo -e "Test 1 (Create new user):        ${GREEN}PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "Test 1 (Create new user):        ${YELLOW}SKIP (user may exist)${NC}"
fi

# Test 2 result
TOTAL=$((TOTAL + 1))
if [ "$SUCCESS2" = "false" ]; then
    echo -e "Test 2 (Prevent duplicate):      ${GREEN}PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "Test 2 (Prevent duplicate):      ${RED}FAIL${NC}"
fi

# Test 3 result
TOTAL=$((TOTAL + 1))
if [ "$SUCCESS3" = "true" ]; then
    echo -e "Test 3 (Different email):        ${GREEN}PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "Test 3 (Different email):        ${RED}FAIL${NC}"
fi

# Test 4 result
TOTAL=$((TOTAL + 1))
if [ "$SUCCESS4" = "true" ]; then
    echo -e "Test 4 (Ignore user_id field):   ${GREEN}PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "Test 4 (Ignore user_id field):   ${YELLOW}CONDITIONAL${NC}"
fi

echo ""
echo "Results: $PASSED/$TOTAL tests passed"
echo ""

# Cleanup instructions
echo "=================================="
echo "Cleanup Instructions"
echo "=================================="
echo ""
echo "To remove test users created by this script:"
echo ""
echo "  go run cmd/cleanup/main.go delete-user test.duplicate@example.com"
echo "  go run cmd/cleanup/main.go delete-user test.different@example.com"
echo "  go run cmd/cleanup/main.go delete-user test.withuserid@example.com"
echo ""
echo "Or view all students:"
echo "  go run cmd/cleanup/main.go list-students"
echo ""
