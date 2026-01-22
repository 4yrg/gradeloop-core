# Identity Service API Overview

## API Structure

```
Identity Service API (Base: http://localhost:8080)
│
├── /health
│   └── GET - Health Check
│
└── /api/v1
    │
    ├── /users
    │   ├── GET    /                    → Get All Users (paginated)
    │   ├── GET    /{id}                → Get User by ID
    │   ├── POST   /                    → Create User (Student/Instructor/Admin)
    │   ├── PUT    /{id}                → Update User
    │   ├── DELETE /{id}                → Delete User (soft delete)
    │   └── POST   /{id}/roles          → Assign Roles to User
    │
    ├── /institutes
    │   ├── GET    /                    → Get All Institutes (paginated)
    │   ├── GET    /{id}                → Get Institute by ID
    │   ├── POST   /                    → Create Institute
    │   ├── PUT    /{id}                → Update Institute
    │   ├── DELETE /{id}                → Delete Institute (soft delete)
    │   └── GET    /{instituteId}/faculties → Get Faculties by Institute
    │
    ├── /faculties
    │   ├── GET    /{id}                → Get Faculty by ID
    │   ├── POST   /                    → Create Faculty
    │   ├── PUT    /{id}                → Update Faculty
    │   ├── DELETE /{id}                → Delete Faculty (soft delete)
    │   └── GET    /{facultyId}/departments → Get Departments by Faculty
    │
    ├── /departments
    │   ├── GET    /{id}                → Get Department by ID
    │   ├── POST   /                    → Create Department
    │   ├── PUT    /{id}                → Update Department
    │   ├── DELETE /{id}                → Delete Department (soft delete)
    │   └── GET    /{departmentId}/classes → Get Classes by Department
    │
    ├── /classes
    │   ├── GET    /{id}                → Get Class by ID
    │   ├── POST   /                    → Create Class
    │   ├── PUT    /{id}                → Update Class
    │   └── DELETE /{id}                → Delete Class (soft delete)
    │
    ├── /memberships
    │   └── POST   /                    → Create Membership (Enroll Student)
    │
    ├── /students/{studentId}/memberships
    │   ├── GET    /                    → Get All Memberships for Student
    │   ├── GET    /current             → Get Current Active Membership
    │   └── POST   /transfer            → Transfer Student to New Class
    │
    └── /roles
        ├── GET    /                    → Get All Roles (paginated)
        ├── GET    /{id}                → Get Role by ID
        ├── POST   /                    → Create Role
        ├── PUT    /{id}                → Update Role
        └── DELETE /{id}                → Delete Role (soft delete)
```

## Resource Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         Institute                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ id, name, code, description, is_active                    │   │
│  │ created_at, updated_at, deleted_at                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                     │
│                             ▼                                     │
│                  ┌───────────────────┐                            │
│                  │     Faculty       │                            │
│                  │ (institute_id)    │                            │
│                  └───────────────────┘                            │
│                             │                                     │
│                             ▼                                     │
│                  ┌───────────────────┐                            │
│                  │   Department      │                            │
│                  │  (faculty_id)     │                            │
│                  └───────────────────┘                            │
│                             │                                     │
│                             ▼                                     │
│                  ┌───────────────────┐                            │
│                  │      Class        │                            │
│                  │ (department_id)   │                            │
│                  └───────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                            User                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ id, email, name, user_type, is_active                     │   │
│  │ created_at, updated_at, deleted_at                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                     │
│        ┌────────────────────┼────────────────────┐               │
│        ▼                    ▼                    ▼               │
│  ┌──────────┐        ┌──────────┐         ┌──────────┐          │
│  │ Student  │        │Instructor│         │  Admin   │          │
│  │student_id│        │employee_id        │institute_id│         │
│  └──────────┘        └──────────┘         └──────────┘          │
│        │                                                          │
│        └──────────────────┐                                      │
│                           ▼                                       │
│                  ┌─────────────────┐                             │
│                  │  Membership     │                             │
│                  │ (student + class)│                            │
│                  │ enrollment_date │                             │
│                  │ status, end_date│                             │
│                  └─────────────────┘                             │
│                                                                   │
│                           ▼                                       │
│                  ┌─────────────────┐                             │
│                  │   User Roles    │                             │
│                  │ (user_id, role_id)│                           │
│                  └─────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

## User Types

```
User
 ├─ student
 │   └─ Attributes: student_id
 │
 ├─ instructor
 │   └─ Attributes: employee_id
 │
 ├─ institute_admin
 │   └─ Attributes: institute_id
 │
 └─ system_admin
     └─ Attributes: (none - full system access)
```

## Request/Response Flow

### Creating a Complete Organization Structure

```
Step 1: Create Institute
POST /api/v1/institutes
{
  "name": "Tech University",
  "code": "TECH",
  "is_active": true
}
Response: { "id": 1, ... }
                │
                ▼
Step 2: Create Faculty
POST /api/v1/faculties
{
  "name": "Engineering",
  "institute_id": 1,
  "is_active": true
}
Response: { "id": 1, ... }
                │
                ▼
Step 3: Create Department
POST /api/v1/departments
{
  "name": "Computer Science",
  "faculty_id": 1,
  "is_active": true
}
Response: { "id": 1, ... }
                │
                ▼
Step 4: Create Class
POST /api/v1/classes
{
  "name": "CS 101",
  "department_id": 1,
  "academic_year": "2024",
  "semester": "Fall"
}
Response: { "id": 1, ... }
```

### Enrolling a Student

```
Step 1: Create Student User
POST /api/v1/users
{
  "email": "student@university.edu",
  "name": "John Doe",
  "user_type": "student",
  "student": {
    "student_id": "STU2024001"
  }
}
Response: { "id": 1, "student": { "id": 1, ... } }
                │
                ▼
Step 2: Create Membership
POST /api/v1/memberships
{
  "student_id": 1,
  "class_id": 1,
  "enrollment_date": "2024-01-15",
  "status": "active"
}
Response: { "id": 1, ... }
```

### Assigning Roles and Permissions

```
Step 1: Create Role
POST /api/v1/roles
{
  "name": "Teaching Assistant",
  "description": "Can grade and assist",
  "permissions": ["grade_assignments", "view_students"]
}
Response: { "id": 1, ... }
                │
                ▼
Step 2: Assign Role to User
POST /api/v1/users/1/roles
{
  "role_ids": [1]
}
Response: { "success": true }
```

## Common Operations

### Query Patterns

**Pagination:**
```
GET /api/v1/users?limit=20&offset=40
```

**Nested Resources:**
```
GET /api/v1/institutes/1/faculties
GET /api/v1/faculties/1/departments
GET /api/v1/departments/1/classes
GET /api/v1/students/1/memberships
```

**Single Resource:**
```
GET /api/v1/users/123
GET /api/v1/institutes/1
GET /api/v1/classes/42
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "total": 100,    // For paginated responses
  "limit": 10,     // For paginated responses
  "offset": 0      // For paginated responses
}
```

### Error Response
```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Technical error details"
}
```

## HTTP Status Codes

| Code | Meaning                  | Usage                                    |
|------|--------------------------|------------------------------------------|
| 200  | OK                       | Successful GET, PUT, DELETE              |
| 201  | Created                  | Successful POST (resource created)       |
| 400  | Bad Request              | Validation error, malformed request      |
| 404  | Not Found                | Resource doesn't exist                   |
| 500  | Internal Server Error    | Server-side error                        |

## Data Types

### Common Fields

All entities include:
- `id` (uint) - Auto-incrementing primary key
- `created_at` (timestamp) - ISO 8601 format
- `updated_at` (timestamp) - ISO 8601 format
- `deleted_at` (timestamp, nullable) - For soft deletes

### Entity-Specific Fields

**Institute:**
- `name` (string, required)
- `code` (string, optional)
- `description` (string, optional)
- `is_active` (boolean)

**Faculty:**
- `name` (string, required)
- `code` (string, optional)
- `description` (string, optional)
- `institute_id` (uint, required)
- `is_active` (boolean)

**Department:**
- `name` (string, required)
- `code` (string, optional)
- `description` (string, optional)
- `faculty_id` (uint, required)
- `is_active` (boolean)

**Class:**
- `name` (string, required)
- `code` (string, optional)
- `description` (string, optional)
- `department_id` (uint, required)
- `academic_year` (string, optional)
- `semester` (string, optional)
- `is_active` (boolean)

**User:**
- `email` (string, required, unique)
- `name` (string, required)
- `user_type` (enum: student|instructor|institute_admin|system_admin)
- `is_active` (boolean)
- Type-specific nested objects (student, instructor, etc.)

**Membership:**
- `student_id` (uint, required)
- `class_id` (uint, required)
- `enrollment_date` (date)
- `end_date` (date, nullable)
- `status` (string: active|inactive|transferred)

**Role:**
- `name` (string, required)
- `description` (string, optional)
- `permissions` (array of strings)

## Bruno Collection Statistics

- **Total Endpoints:** 41
- **Resource Categories:** 8
- **CRUD Operations:** Complete for all major resources
- **Pagination:** Supported on all list endpoints
- **Soft Deletes:** All DELETE operations
- **Nested Queries:** Institute→Faculty→Department→Class
- **Special Operations:** Transfer Student, Assign Roles

## Quick Reference

### Most Common Endpoints

1. `POST /api/v1/users` - Create user
2. `GET /api/v1/users` - List users
3. `POST /api/v1/institutes` - Create institute
4. `POST /api/v1/memberships` - Enroll student
5. `GET /api/v1/students/{id}/memberships/current` - Get current enrollment

### Testing Checklist

- [ ] Health check responds
- [ ] Can create institute
- [ ] Can create faculty with institute_id
- [ ] Can create department with faculty_id
- [ ] Can create class with department_id
- [ ] Can create student user
- [ ] Can create membership (student + class)
- [ ] Can retrieve user by ID
- [ ] Can list users with pagination
- [ ] Can create and assign roles

---

**Last Updated:** 2024-01-22  
**Collection Version:** 1.0.0  
**API Version:** v1