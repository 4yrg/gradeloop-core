# Identity Service API Collection (Bruno)

This is a [Bruno](https://www.usebruno.com/) API collection for the GradeLoop Identity Service. It contains all the API endpoints for managing users, institutes, faculties, departments, classes, memberships, and roles.

## What is Bruno?

Bruno is a fast, git-friendly, offline-first, and open-source API client. Unlike Postman or Insomnia, Bruno stores collections directly in your filesystem, making it perfect for version control.

## Installation

1. Download and install Bruno from [https://www.usebruno.com/downloads](https://www.usebruno.com/downloads)
2. Open Bruno
3. Click on "Open Collection"
4. Navigate to this directory (`identity-api-collection`)
5. The collection will be loaded with all endpoints organized by folders

## Collection Structure

```
identity-api-collection/
├── bruno.json                      # Collection metadata
├── environments/
│   └── Local.bru                   # Local development environment variables
├── Health/
│   └── Health Check.bru            # Service health check
├── Users/
│   ├── Get All Users.bru
│   ├── Get User by ID.bru
│   ├── Create Student.bru
│   ├── Create Instructor.bru
│   ├── Create System Admin.bru
│   ├── Create Institute Admin.bru
│   ├── Update User.bru
│   ├── Delete User.bru
│   └── Assign Roles to User.bru
├── Institutes/
│   ├── Get All Institutes.bru
│   ├── Get Institute by ID.bru
│   ├── Create Institute.bru
│   ├── Update Institute.bru
│   └── Delete Institute.bru
├── Faculties/
│   ├── Get Faculties by Institute.bru
│   ├── Get Faculty by ID.bru
│   ├── Create Faculty.bru
│   ├── Update Faculty.bru
│   └── Delete Faculty.bru
├── Departments/
│   ├── Get Departments by Faculty.bru
│   ├── Get Department by ID.bru
│   ├── Create Department.bru
│   ├── Update Department.bru
│   └── Delete Department.bru
├── Classes/
│   ├── Get Classes by Department.bru
│   ├── Get Class by ID.bru
│   ├── Create Class.bru
│   ├── Update Class.bru
│   └── Delete Class.bru
├── Memberships/
│   ├── Create Membership.bru
│   ├── Get Memberships by Student.bru
│   ├── Get Current Membership.bru
│   └── Transfer Student.bru
└── Roles/
    ├── Get All Roles.bru
    ├── Get Role by ID.bru
    ├── Create Role.bru
    ├── Update Role.bru
    └── Delete Role.bru
```

## Environment Variables

The collection uses environment variables defined in `environments/Local.bru`:

- `base_url`: Base URL of the API (default: `http://localhost:8080`)
- `api_version`: API version (default: `v1`)

You can create additional environment files for different deployment environments (e.g., `Production.bru`, `Staging.bru`).

## Quick Start

### 1. Start the Identity Service

Make sure the Identity Service is running:

```bash
cd identity
make run
```

Or using Docker:

```bash
cd identity
docker-compose up
```

### 2. Select Environment

In Bruno, select the "Local" environment from the environment dropdown in the top-right corner.

### 3. Test the Service

Start by running the **Health Check** request to verify the service is running.

### 4. Complete Workflow Example

Follow this sequence to create a complete organizational structure:

1. **Create an Institute** (Institutes → Create Institute)
2. **Create a Faculty** (Faculties → Create Faculty) - use the institute ID from step 1
3. **Create a Department** (Departments → Create Department) - use the faculty ID from step 2
4. **Create a Class** (Classes → Create Class) - use the department ID from step 3
5. **Create a Student** (Users → Create Student)
6. **Create a Membership** (Memberships → Create Membership) - link the student to the class
7. **Create a Role** (Roles → Create Role)
8. **Assign Role to User** (Users → Assign Roles to User)

## API Endpoints Overview

### Health
- **GET** `/health` - Check service health

### Users
- **GET** `/api/v1/users` - Get all users (paginated)
- **GET** `/api/v1/users/{id}` - Get user by ID
- **POST** `/api/v1/users` - Create user (student, instructor, system_admin, or institute_admin)
- **PUT** `/api/v1/users/{id}` - Update user
- **DELETE** `/api/v1/users/{id}` - Delete user (soft delete)
- **POST** `/api/v1/users/{id}/roles` - Assign roles to user

### Institutes
- **GET** `/api/v1/institutes` - Get all institutes (paginated)
- **GET** `/api/v1/institutes/{id}` - Get institute by ID
- **POST** `/api/v1/institutes` - Create institute
- **PUT** `/api/v1/institutes/{id}` - Update institute
- **DELETE** `/api/v1/institutes/{id}` - Delete institute (soft delete)

### Faculties
- **GET** `/api/v1/institutes/{instituteId}/faculties` - Get faculties by institute
- **GET** `/api/v1/faculties/{id}` - Get faculty by ID
- **POST** `/api/v1/faculties` - Create faculty
- **PUT** `/api/v1/faculties/{id}` - Update faculty
- **DELETE** `/api/v1/faculties/{id}` - Delete faculty (soft delete)

### Departments
- **GET** `/api/v1/faculties/{facultyId}/departments` - Get departments by faculty
- **GET** `/api/v1/departments/{id}` - Get department by ID
- **POST** `/api/v1/departments` - Create department
- **PUT** `/api/v1/departments/{id}` - Update department
- **DELETE** `/api/v1/departments/{id}` - Delete department (soft delete)

### Classes
- **GET** `/api/v1/departments/{departmentId}/classes` - Get classes by department
- **GET** `/api/v1/classes/{id}` - Get class by ID
- **POST** `/api/v1/classes` - Create class
- **PUT** `/api/v1/classes/{id}` - Update class
- **DELETE** `/api/v1/classes/{id}` - Delete class (soft delete)

### Memberships
- **POST** `/api/v1/memberships` - Create membership (enroll student in class)
- **GET** `/api/v1/students/{studentId}/memberships` - Get all memberships for a student
- **GET** `/api/v1/students/{studentId}/memberships/current` - Get student's current active membership
- **POST** `/api/v1/students/{studentId}/memberships/transfer` - Transfer student to a different class

### Roles
- **GET** `/api/v1/roles` - Get all roles (paginated)
- **GET** `/api/v1/roles/{id}` - Get role by ID
- **POST** `/api/v1/roles` - Create role
- **PUT** `/api/v1/roles/{id}` - Update role
- **DELETE** `/api/v1/roles/{id}` - Delete role (soft delete)

## User Types

The Identity Service supports four user types:

1. **Student** - Requires `student_id` in the student object
2. **Instructor** - Requires `employee_id` in the instructor object
3. **Institute Admin** - Requires `institute_id` in the institute_admin object
4. **System Admin** - No additional fields required

## Pagination

All list endpoints support pagination through query parameters:
- `limit`: Number of results to return (default: 10)
- `offset`: Number of results to skip (default: 0)

Example: `/api/v1/users?limit=20&offset=40`

## Soft Deletes

All DELETE operations are soft deletes. Records remain in the database with a `DeletedAt` timestamp and won't appear in normal queries.

## Tips

1. **Use Variables**: The collection uses `{{base_url}}` and `{{api_version}}` variables. You can add more variables in the environment file.

2. **Documentation**: Each request includes inline documentation. Click on the "Docs" tab in Bruno to view detailed information about the endpoint.

3. **Sequential IDs**: After creating resources, note their IDs to use in subsequent requests. You can manually update the path parameters in dependent requests.

4. **Error Handling**: The API returns standard error responses with:
   - `success`: false
   - `message`: Human-readable error message
   - `error`: Technical error details

5. **Git-Friendly**: Since Bruno stores collections as plain text files, you can commit this collection to version control and share it with your team.

## Troubleshooting

### Connection Refused
If you get connection errors:
- Make sure the service is running (`make run` or `docker-compose up`)
- Verify the service is listening on port 8080
- Check the `base_url` in the environment matches your service URL

### 404 Not Found
- Verify the resource ID exists
- Check that you've created the parent resources (e.g., institute before faculty)

### Validation Errors
- Review the request body in the "Docs" tab
- Ensure all required fields are provided
- Check that field types match expectations (e.g., integers for IDs)

## Additional Resources

- [Bruno Documentation](https://docs.usebruno.com/)
- [Identity Service README](../README.md)
- [API Examples](../API_EXAMPLES.md)
- [Quick Start Guide](../QUICKSTART.md)

## Contributing

When adding new endpoints to the Identity Service:
1. Create a new `.bru` file in the appropriate folder
2. Follow the existing naming convention
3. Include comprehensive documentation in the `docs` section
4. Update this README if adding new folders or significant functionality

## License

This collection is part of the GradeLoop project.