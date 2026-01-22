# Identity Service

A comprehensive Identity Management Service built with Go, Chi router, and GORM ORM. This service manages multiple user types (System Admin, Institute Admin, Student, and Instructor) with support for organizational hierarchies (Institutes, Faculties, Departments, and Classes).

## Features

- **Multiple User Types**: System Admin, Institute Admin, Student, and Instructor
- **Polymorphic User Model**: Common fields with user-type-specific extensions
- **Organizational Hierarchy**: Institute → Faculty → Department → Class
- **Student Membership Tracking**: Historical tracking of student class/department changes
- **Role-Based Access Control (RBAC)**: Flexible role assignment system
- **Database Support**: SQLite for development, PostgreSQL for production
- **RESTful API**: Clean API design with Chi router
- **Comprehensive Testing**: Unit and integration tests included
- **Extensible Design**: Easy to add new user types in the future

## Project Structure

```
identity/
├── cmd/
│   └── server/
│       └── main.go                 # Application entry point
├── internal/
│   ├── config/
│   │   └── config.go              # Configuration management
│   ├── database/
│   │   └── database.go            # Database connection and migrations
│   ├── models/
│   │   ├── user.go                # User models
│   │   ├── organization.go        # Organization models
│   │   ├── membership.go          # Student membership models
│   │   └── role.go                # Role models
│   ├── repository/
│   │   ├── user_repository.go     # User data access layer
│   │   ├── organization_repository.go
│   │   ├── membership_repository.go
│   │   └── role_repository.go
│   ├── service/
│   │   └── user_service.go        # Business logic layer
│   ├── handlers/
│   │   └── user_handler.go        # HTTP handlers
│   └── routes/
│       └── routes.go              # Route definitions
├── pkg/
│   └── utils/
│       └── response.go            # HTTP response utilities
├── tests/
│   ├── unit/
│   │   └── user_service_test.go   # Unit tests
│   └── integration/
│       └── api_test.go            # Integration tests
├── .env.example                    # Environment variables template
├── go.mod                          # Go module definition
└── README.md                       # This file
```

## Database Schema

### User Types
- **User**: Base table with common fields (id, email, name, user_type)
- **Student**: Student-specific data (student_id)
- **Instructor**: Instructor-specific data (employee_id)
- **SystemAdmin**: System administrator data
- **InstituteAdmin**: Institute administrator data (institute_id)

### Organization
- **Institute**: Top-level organization
- **Faculty**: Belongs to Institute
- **Department**: Belongs to Faculty
- **Class**: Belongs to Department

### Membership
- **StudentMembership**: Tracks current and historical student associations with Faculty/Department/Class

### RBAC
- **Role**: Role definitions
- **UserRole**: Many-to-many relationship between Users and Roles

## Getting Started

### Prerequisites

- Go 1.21 or higher
- SQLite (for development)
- PostgreSQL (for production, optional)

### Installation

1. Clone the repository:
```bash
cd /path/to/identity
```

2. Install dependencies:
```bash
go mod download
```

3. Copy the environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`

### Running with SQLite (Development)

The default configuration uses SQLite for easy development:

```bash
# Using default .env settings
go run cmd/server/main.go
```

The server will start on `http://localhost:8080`

### Running with PostgreSQL (Production)

1. Update `.env` file:
```env
DB_DRIVER=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=identity_production
DB_SSLMODE=require
```

2. Ensure PostgreSQL is running and create the database:
```bash
createdb identity_production
```

3. Run the application:
```bash
go run cmd/server/main.go
```

### Database Migrations

Migrations run automatically when the application starts using GORM's AutoMigrate feature. All tables are created based on the model definitions.

## API Endpoints

### Health Check
```
GET /health
```

### Users

#### Create User
```http
POST /api/v1/users
Content-Type: application/json

{
  "email": "student@example.com",
  "name": "John Doe",
  "user_type": "student",
  "student": {
    "student_id": "S12345"
  }
}
```

#### Get All Users
```http
GET /api/v1/users?limit=10&offset=0
```

#### Get User by ID
```http
GET /api/v1/users/{id}
```

#### Update User
```http
PUT /api/v1/users/{id}
Content-Type: application/json

{
  "email": "updated@example.com",
  "name": "Updated Name",
  "user_type": "student"
}
```

#### Delete User
```http
DELETE /api/v1/users/{id}
```

#### Assign Roles to User
```http
POST /api/v1/users/{id}/roles
Content-Type: application/json

{
  "role_ids": [1, 2, 3]
}
```

## User Type Examples

### Creating a Student
```json
{
  "email": "student@university.edu",
  "name": "Jane Smith",
  "user_type": "student",
  "student": {
    "student_id": "STU2024001"
  }
}
```

### Creating an Instructor
```json
{
  "email": "instructor@university.edu",
  "name": "Dr. John Professor",
  "user_type": "instructor",
  "instructor": {
    "employee_id": "EMP2024001"
  }
}
```

### Creating a System Admin
```json
{
  "email": "admin@university.edu",
  "name": "System Administrator",
  "user_type": "system_admin"
}
```

### Creating an Institute Admin
```json
{
  "email": "dean@university.edu",
  "name": "Dean of Institute",
  "user_type": "institute_admin",
  "institute_admin": {
    "institute_id": 1
  }
}
```

## Running Tests

### Unit Tests
```bash
go test ./tests/unit/... -v
```

### Integration Tests
```bash
go test ./tests/integration/... -v
```

### All Tests
```bash
go test ./... -v
```

### Test Coverage
```bash
go test ./... -cover
```

## Adding New User Types

The system is designed to be extensible. To add a new user type:

1. **Add a new constant** in `internal/models/user.go`:
```go
const (
    UserTypeNewType UserType = "new_type"
)
```

2. **Create a new model**:
```go
type NewType struct {
    ID        uint      `gorm:"primarykey" json:"id"`
    UserID    uint      `gorm:"uniqueIndex;not null" json:"user_id"`
    CustomField string  `json:"custom_field"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

3. **Update User model** to include the new relationship:
```go
type User struct {
    // ... existing fields
    NewType *NewType `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"new_type,omitempty"`
}
```

4. **Update repository** to handle the new type in `Create`, `loadUserTypeData`, etc.

5. **Update validation** in the service layer

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| ENVIRONMENT | Running environment | development |
| SERVER_PORT | Server port | 8080 |
| SERVER_HOST | Server host | 0.0.0.0 |
| DB_DRIVER | Database driver (sqlite/postgres) | sqlite |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | postgres |
| DB_NAME | Database name | identity_db |
| DB_SSLMODE | PostgreSQL SSL mode | disable |
| SQLITE_PATH | SQLite database file path | ./identity.db |
| LOG_LEVEL | Logging level | info |

## Architecture Decisions

### Single Table Inheritance
We use a discriminator column (`user_type`) in the base `User` table with separate tables for user-type-specific fields. This provides:
- Clean separation of concerns
- Easy querying for all users
- Type-specific data isolation
- Flexibility for future extensions

### Repository Pattern
The repository pattern provides:
- Abstraction of data access logic
- Easy testing with mock repositories
- Separation of business logic from data access

### Service Layer
Business logic is centralized in the service layer:
- Validation logic
- Complex operations
- Transaction management

## Production Considerations

### Switching to PostgreSQL

1. Install PostgreSQL
2. Create database and user
3. Update `.env` with PostgreSQL credentials
4. The application will automatically use PostgreSQL

### Performance Optimization

- Add database indexes for frequently queried fields
- Implement caching for frequently accessed data
- Use connection pooling
- Consider read replicas for scaling

### Security

- Add authentication middleware (JWT, OAuth2, etc.)
- Implement authorization checks
- Use HTTPS in production
- Sanitize user input
- Use prepared statements (GORM does this by default)

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]
