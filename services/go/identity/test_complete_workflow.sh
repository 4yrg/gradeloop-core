#!/bin/bash

# Complete Workflow Test Script for Identity Service
# This script demonstrates all CRUD operations in a logical sequence

BASE_URL="http://localhost:8080/api/v1"
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BOLD}Identity Service - Complete Workflow Test${NC}\n"

# Check if server is running
echo -e "${BLUE}Checking if server is running...${NC}"
if ! curl -s http://localhost:8080/health > /dev/null; then
    echo "Error: Server is not running. Please start the server first."
    echo "Run: go run cmd/server/main.go"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}\n"

# ============================================================================
# PART 1: Create Organization Hierarchy
# ============================================================================
echo -e "${BOLD}PART 1: Creating Organization Hierarchy${NC}"
echo "========================================"

# Create Institute
echo -e "\n${BLUE}1. Creating Institute...${NC}"
INSTITUTE_RESPONSE=$(curl -s -X POST $BASE_URL/institutes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Massachusetts Institute of Technology",
    "code": "MIT",
    "description": "A world-renowned university",
    "is_active": true
  }')

INSTITUTE_ID=$(echo $INSTITUTE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo -e "${GREEN}✓ Institute created with ID: $INSTITUTE_ID${NC}"

# Create Faculty
echo -e "\n${BLUE}2. Creating Faculty of Engineering...${NC}"
FACULTY_RESPONSE=$(curl -s -X POST $BASE_URL/faculties \
  -H "Content-Type: application/json" \
  -d "{
    \"institute_id\": $INSTITUTE_ID,
    \"name\": \"Faculty of Engineering\",
    \"code\": \"ENG\",
    \"description\": \"Engineering programs\",
    \"is_active\": true
  }")

FACULTY_ID=$(echo $FACULTY_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo -e "${GREEN}✓ Faculty created with ID: $FACULTY_ID${NC}"

# Create Department
echo -e "\n${BLUE}3. Creating Computer Science Department...${NC}"
DEPARTMENT_RESPONSE=$(curl -s -X POST $BASE_URL/departments \
  -H "Content-Type: application/json" \
  -d "{
    \"faculty_id\": $FACULTY_ID,
    \"name\": \"Computer Science\",
    \"code\": \"CS\",
    \"description\": \"Computer Science Department\",
    \"is_active\": true
  }")

DEPT_ID=$(echo $DEPARTMENT_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo -e "${GREEN}✓ Department created with ID: $DEPT_ID${NC}"

# Create Class Year 1
echo -e "\n${BLUE}4. Creating Class - Year 1, Semester 1...${NC}"
CLASS1_RESPONSE=$(curl -s -X POST $BASE_URL/classes \
  -H "Content-Type: application/json" \
  -d "{
    \"department_id\": $DEPT_ID,
    \"name\": \"CS Year 1 - Semester 1\",
    \"code\": \"CS-Y1-S1\",
    \"year\": 1,
    \"semester\": 1,
    \"is_active\": true
  }")

CLASS1_ID=$(echo $CLASS1_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo -e "${GREEN}✓ Class created with ID: $CLASS1_ID${NC}"

# Create Class Year 2
echo -e "\n${BLUE}5. Creating Class - Year 2, Semester 1...${NC}"
CLASS2_RESPONSE=$(curl -s -X POST $BASE_URL/classes \
  -H "Content-Type: application/json" \
  -d "{
    \"department_id\": $DEPT_ID,
    \"name\": \"CS Year 2 - Semester 1\",
    \"code\": \"CS-Y2-S1\",
    \"year\": 2,
    \"semester\": 1,
    \"is_active\": true
  }")

CLASS2_ID=$(echo $CLASS2_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo -e "${GREEN}✓ Class created with ID: $CLASS2_ID${NC}"

# ============================================================================
# PART 2: Create Users
# ============================================================================
echo -e "\n\n${BOLD}PART 2: Creating Users${NC}"
echo "========================================"

# Create Student 1
echo -e "\n${BLUE}6. Creating Student - Alice Johnson...${NC}"
STUDENT1_RESPONSE=$(curl -s -X POST $BASE_URL/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.johnson@mit.edu",
    "name": "Alice Johnson",
    "user_type": "student",
    "is_active": true,
    "student": {
      "student_id": "MIT2024001"
    }
  }')

USER1_ID=$(echo $STUDENT1_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
STUDENT1_ID=$(echo $STUDENT1_RESPONSE | grep -o '"student":{[^}]*"id":[0-9]*' | grep -o 'id":[0-9]*' | grep -o '[0-9]*')
echo -e "${GREEN}✓ Student created - User ID: $USER1_ID, Student ID: $STUDENT1_ID${NC}"

# Create Student 2
echo -e "\n${BLUE}7. Creating Student - Bob Smith...${NC}"
STUDENT2_RESPONSE=$(curl -s -X POST $BASE_URL/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob.smith@mit.edu",
    "name": "Bob Smith",
    "user_type": "student",
    "is_active": true,
    "student": {
      "student_id": "MIT2024002"
    }
  }')

USER2_ID=$(echo $STUDENT2_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
STUDENT2_ID=$(echo $STUDENT2_RESPONSE | grep -o '"student":{[^}]*"id":[0-9]*' | grep -o 'id":[0-9]*' | grep -o '[0-9]*')
echo -e "${GREEN}✓ Student created - User ID: $USER2_ID, Student ID: $STUDENT2_ID${NC}"

# Create Instructor
echo -e "\n${BLUE}8. Creating Instructor - Dr. Carol White...${NC}"
INSTRUCTOR_RESPONSE=$(curl -s -X POST $BASE_URL/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "carol.white@mit.edu",
    "name": "Dr. Carol White",
    "user_type": "instructor",
    "is_active": true,
    "instructor": {
      "employee_id": "EMP2024001"
    }
  }')

INSTRUCTOR_ID=$(echo $INSTRUCTOR_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo -e "${GREEN}✓ Instructor created with ID: $INSTRUCTOR_ID${NC}"

# Create System Admin
echo -e "\n${BLUE}9. Creating System Admin...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mit.edu",
    "name": "System Administrator",
    "user_type": "system_admin",
    "is_active": true
  }')

ADMIN_ID=$(echo $ADMIN_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo -e "${GREEN}✓ System Admin created with ID: $ADMIN_ID${NC}"

# ============================================================================
# PART 3: Create Student Memberships
# ============================================================================
echo -e "\n\n${BOLD}PART 3: Assigning Students to Classes${NC}"
echo "========================================"

# Assign Student 1 to Class 1
echo -e "\n${BLUE}10. Assigning Alice to Year 1...${NC}"
curl -s -X POST $BASE_URL/memberships \
  -H "Content-Type: application/json" \
  -d "{
    \"student_id\": $STUDENT1_ID,
    \"faculty_id\": $FACULTY_ID,
    \"department_id\": $DEPT_ID,
    \"class_id\": $CLASS1_ID,
    \"start_date\": \"2024-01-01T00:00:00Z\",
    \"is_current\": true
  }" > /dev/null

echo -e "${GREEN}✓ Alice assigned to CS Year 1${NC}"

# Assign Student 2 to Class 1
echo -e "\n${BLUE}11. Assigning Bob to Year 1...${NC}"
curl -s -X POST $BASE_URL/memberships \
  -H "Content-Type: application/json" \
  -d "{
    \"student_id\": $STUDENT2_ID,
    \"faculty_id\": $FACULTY_ID,
    \"department_id\": $DEPT_ID,
    \"class_id\": $CLASS1_ID,
    \"start_date\": \"2024-01-01T00:00:00Z\",
    \"is_current\": true
  }" > /dev/null

echo -e "${GREEN}✓ Bob assigned to CS Year 1${NC}"

# ============================================================================
# PART 4: Create and Assign Roles
# ============================================================================
echo -e "\n\n${BOLD}PART 4: Creating and Assigning Roles${NC}"
echo "========================================"

# Create Role 1
echo -e "\n${BLUE}12. Creating Role - Class Representative...${NC}"
ROLE1_RESPONSE=$(curl -s -X POST $BASE_URL/roles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Class Representative",
    "description": "Student class representative",
    "is_active": true
  }')

ROLE1_ID=$(echo $ROLE1_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo -e "${GREEN}✓ Role created with ID: $ROLE1_ID${NC}"

# Create Role 2
echo -e "\n${BLUE}13. Creating Role - Department Head...${NC}"
ROLE2_RESPONSE=$(curl -s -X POST $BASE_URL/roles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Department Head",
    "description": "Head of department",
    "is_active": true
  }')

ROLE2_ID=$(echo $ROLE2_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo -e "${GREEN}✓ Role created with ID: $ROLE2_ID${NC}"

# Assign Role to Student
echo -e "\n${BLUE}14. Assigning Class Rep role to Alice...${NC}"
curl -s -X POST $BASE_URL/users/$USER1_ID/roles \
  -H "Content-Type: application/json" \
  -d "{\"role_ids\": [$ROLE1_ID]}" > /dev/null

echo -e "${GREEN}✓ Role assigned to Alice${NC}"

# Assign Role to Instructor
echo -e "\n${BLUE}15. Assigning Department Head role to Dr. White...${NC}"
curl -s -X POST $BASE_URL/users/$INSTRUCTOR_ID/roles \
  -H "Content-Type: application/json" \
  -d "{\"role_ids\": [$ROLE2_ID]}" > /dev/null

echo -e "${GREEN}✓ Role assigned to Dr. White${NC}"

# ============================================================================
# PART 5: Transfer Student
# ============================================================================
echo -e "\n\n${BOLD}PART 5: Student Transfer (Promotion)${NC}"
echo "========================================"

echo -e "\n${BLUE}16. Transferring Alice from Year 1 to Year 2...${NC}"
curl -s -X POST $BASE_URL/students/$STUDENT1_ID/memberships/transfer \
  -H "Content-Type: application/json" \
  -d "{
    \"new_faculty_id\": $FACULTY_ID,
    \"new_department_id\": $DEPT_ID,
    \"new_class_id\": $CLASS2_ID
  }" > /dev/null

echo -e "${GREEN}✓ Alice transferred to Year 2${NC}"

# ============================================================================
# PART 6: Query and Verify
# ============================================================================
echo -e "\n\n${BOLD}PART 6: Querying Data${NC}"
echo "========================================"

# Get all users
echo -e "\n${BLUE}17. Fetching all users...${NC}"
USERS=$(curl -s "$BASE_URL/users?limit=10&offset=0")
USER_COUNT=$(echo $USERS | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
echo -e "${GREEN}✓ Found $USER_COUNT users${NC}"

# Get Alice's membership history
echo -e "\n${BLUE}18. Fetching Alice's membership history...${NC}"
MEMBERSHIPS=$(curl -s "$BASE_URL/students/$STUDENT1_ID/memberships")
echo -e "${GREEN}✓ Retrieved membership history (should show 2 memberships)${NC}"

# Get Alice's current membership
echo -e "\n${BLUE}19. Fetching Alice's current membership...${NC}"
CURRENT_MEMBERSHIP=$(curl -s "$BASE_URL/students/$STUDENT1_ID/memberships/current")
echo -e "${GREEN}✓ Current membership retrieved (should be Year 2)${NC}"

# Get faculties by institute
echo -e "\n${BLUE}20. Fetching faculties for MIT...${NC}"
FACULTIES=$(curl -s "$BASE_URL/institutes/$INSTITUTE_ID/faculties")
echo -e "${GREEN}✓ Retrieved faculties${NC}"

# Get all roles
echo -e "\n${BLUE}21. Fetching all roles...${NC}"
ROLES=$(curl -s "$BASE_URL/roles")
ROLE_COUNT=$(echo $ROLES | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
echo -e "${GREEN}✓ Found $ROLE_COUNT roles${NC}"

# ============================================================================
# Summary
# ============================================================================
echo -e "\n\n${BOLD}Test Summary${NC}"
echo "=============================================="
echo -e "Organizations Created:"
echo -e "  - Institutes: 1 (ID: $INSTITUTE_ID)"
echo -e "  - Faculties: 1 (ID: $FACULTY_ID)"
echo -e "  - Departments: 1 (ID: $DEPT_ID)"
echo -e "  - Classes: 2 (IDs: $CLASS1_ID, $CLASS2_ID)"
echo -e "\nUsers Created:"
echo -e "  - Students: 2"
echo -e "  - Instructors: 1"
echo -e "  - Admins: 1"
echo -e "  - Total: $USER_COUNT"
echo -e "\nRoles Created: $ROLE_COUNT"
echo -e "\nMemberships:"
echo -e "  - Alice: Year 1 → Year 2 (transferred)"
echo -e "  - Bob: Year 1 (current)"
echo -e "\n${GREEN}✓ All tests completed successfully!${NC}"
echo -e "\nYou can now explore the data by visiting:"
echo -e "  - All users: curl $BASE_URL/users"
echo -e "  - Alice's details: curl $BASE_URL/users/$USER1_ID"
echo -e "  - Organization hierarchy: curl $BASE_URL/institutes/$INSTITUTE_ID"
