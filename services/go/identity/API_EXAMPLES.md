# API Examples

Complete API examples for the Identity Service.

## Base URL
```
http://localhost:8080/api/v1
```

## User Management

### Create a Student

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.student@university.edu",
    "name": "Alice Johnson",
    "user_type": "student",
    "is_active": true,
    "student": {
      "student_id": "STU2024001"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "email": "alice.student@university.edu",
    "name": "Alice Johnson",
    "user_type": "student",
    "is_active": true,
    "created_at": "2024-01-22T10:30:00Z",
    "updated_at": "2024-01-22T10:30:00Z",
    "student": {
      "id": 1,
      "user_id": 1,
      "student_id": "STU2024001",
      "created_at": "2024-01-22T10:30:00Z",
      "updated_at": "2024-01-22T10:30:00Z"
    }
  }
}
```

### Create an Instructor

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob.professor@university.edu",
    "name": "Dr. Bob Smith",
    "user_type": "instructor",
    "is_active": true,
    "instructor": {
      "employee_id": "EMP2024001"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 2,
    "email": "bob.professor@university.edu",
    "name": "Dr. Bob Smith",
    "user_type": "instructor",
    "is_active": true,
    "created_at": "2024-01-22T10:35:00Z",
    "updated_at": "2024-01-22T10:35:00Z",
    "instructor": {
      "id": 1,
      "user_id": 2,
      "employee_id": "EMP2024001",
      "created_at": "2024-01-22T10:35:00Z",
      "updated_at": "2024-01-22T10:35:00Z"
    }
  }
}
```

### Create a System Admin

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu",
    "name": "System Administrator",
    "user_type": "system_admin",
    "is_active": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 3,
    "email": "admin@university.edu",
    "name": "System Administrator",
    "user_type": "system_admin",
    "is_active": true,
    "created_at": "2024-01-22T10:40:00Z",
    "updated_at": "2024-01-22T10:40:00Z",
    "system_admin": {
      "id": 1,
      "user_id": 3,
      "created_at": "2024-01-22T10:40:00Z",
      "updated_at": "2024-01-22T10:40:00Z"
    }
  }
}
```

### Create an Institute Admin

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dean@university.edu",
    "name": "Dean Williams",
    "user_type": "institute_admin",
    "is_active": true,
    "institute_admin": {
      "institute_id": 1
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 4,
    "email": "dean@university.edu",
    "name": "Dean Williams",
    "user_type": "institute_admin",
    "is_active": true,
    "created_at": "2024-01-22T10:45:00Z",
    "updated_at": "2024-01-22T10:45:00Z",
    "institute_admin": {
      "id": 1,
      "user_id": 4,
      "institute_id": 1,
      "created_at": "2024-01-22T10:45:00Z",
      "updated_at": "2024-01-22T10:45:00Z"
    }
  }
}
```

### Get User by ID

**Request:**
```bash
curl http://localhost:8080/api/v1/users/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "alice.student@university.edu",
    "name": "Alice Johnson",
    "user_type": "student",
    "is_active": true,
    "created_at": "2024-01-22T10:30:00Z",
    "updated_at": "2024-01-22T10:30:00Z",
    "student": {
      "id": 1,
      "user_id": 1,
      "student_id": "STU2024001",
      "created_at": "2024-01-22T10:30:00Z",
      "updated_at": "2024-01-22T10:30:00Z"
    },
    "roles": []
  }
}
```

### Get All Users with Pagination

**Request:**
```bash
curl "http://localhost:8080/api/v1/users?limit=10&offset=0"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "alice.student@university.edu",
      "name": "Alice Johnson",
      "user_type": "student",
      "is_active": true,
      "student": {
        "student_id": "STU2024001"
      }
    },
    {
      "id": 2,
      "email": "bob.professor@university.edu",
      "name": "Dr. Bob Smith",
      "user_type": "instructor",
      "is_active": true,
      "instructor": {
        "employee_id": "EMP2024001"
      }
    }
  ],
  "total": 2,
  "limit": 10,
  "offset": 0
}
```

### Update User

**Request:**
```bash
curl -X PUT http://localhost:8080/api/v1/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.updated@university.edu",
    "name": "Alice Johnson Updated",
    "user_type": "student",
    "is_active": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "email": "alice.updated@university.edu",
    "name": "Alice Johnson Updated",
    "user_type": "student",
    "is_active": true,
    "updated_at": "2024-01-22T11:00:00Z"
  }
}
```

### Delete User

**Request:**
```bash
curl -X DELETE http://localhost:8080/api/v1/users/1
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Assign Roles to User

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/users/1/roles \
  -H "Content-Type: application/json" \
  -d '{
    "role_ids": [1, 2, 3]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Roles assigned successfully"
}
```

## Error Responses

### Validation Error

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "No Email User",
    "user_type": "student"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Invalid request body",
  "error": "validation error: Key: 'User.Email' Error:Field validation for 'Email' failed on the 'required' tag"
}
```

### Not Found Error

**Request:**
```bash
curl http://localhost:8080/api/v1/users/9999
```

**Response:**
```json
{
  "success": false,
  "message": "User not found",
  "error": "user not found"
}
```

### Duplicate Email Error

**Request:**
```bash
# Try to create user with existing email
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.student@university.edu",
    "name": "Another Alice",
    "user_type": "student",
    "student": {
      "student_id": "STU2024002"
    }
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Failed to create user",
  "error": "UNIQUE constraint failed: users.email"
}
```

## Health Check

**Request:**
```bash
curl http://localhost:8080/health
```

**Response:**
```
OK
```

## Using httpie (Alternative to curl)

If you have httpie installed:

```bash
# Create student
http POST localhost:8080/api/v1/users \
  email=student@example.com \
  name="John Doe" \
  user_type=student \
  student:='{"student_id": "S12345"}'

# Get user
http GET localhost:8080/api/v1/users/1

# Get all users
http GET localhost:8080/api/v1/users limit==10 offset==0

# Update user
http PUT localhost:8080/api/v1/users/1 \
  email=updated@example.com \
  name="John Updated" \
  user_type=student

# Delete user
http DELETE localhost:8080/api/v1/users/1
```

## Postman Collection

You can import these examples into Postman by creating a new collection and adding these requests.

### Environment Variables for Postman
```
BASE_URL: http://localhost:8080
API_VERSION: v1
```

## Testing Workflow

1. **Create an Institute** (when institute endpoints are added)
2. **Create a Faculty**
3. **Create a Department**
4. **Create a Class**
5. **Create a Student**
6. **Create a Student Membership** linking the student to class
7. **Create Roles**
8. **Assign Roles to Users**

## Notes

- All timestamps are in ISO 8601 format (UTC)
- IDs are auto-incrementing integers
- Soft deletes are supported (deleted users remain in DB with DeletedAt set)
- Pagination defaults: limit=10, offset=0
- All endpoints return JSON

## Future Endpoints (To Be Implemented)

- POST /api/v1/institutes
- GET /api/v1/institutes
- POST /api/v1/faculties
- GET /api/v1/faculties
- POST /api/v1/departments
- GET /api/v1/departments
- POST /api/v1/classes
- GET /api/v1/classes
- POST /api/v1/memberships
- GET /api/v1/memberships
- POST /api/v1/roles
- GET /api/v1/roles
