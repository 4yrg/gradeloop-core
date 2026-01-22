# Quick Start Guide

Get the Identity Service up and running in 5 minutes!

## Prerequisites

- Go 1.21+ installed
- Git

## Steps

### 1. Navigate to the Project
```bash
cd /home/dasunwickr/Projects/4YRG/gradeloop-core/services/go/identity
```

### 2. Install Dependencies
```bash
go mod download
```

### 3. Set Up Environment
```bash
cp .env.example .env
```

The default configuration uses SQLite, perfect for getting started!

### 4. Run the Server
```bash
go run cmd/server/main.go
```

You should see:
```
Connected to sqlite database successfully
Running database migrations...
Database migrations completed successfully
Server starting on 0.0.0.0:8080
```

### 5. Test the API

**Check health:**
```bash
curl http://localhost:8080/health
```

**Create a student:**
```bash
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "name": "John Doe",
    "user_type": "student",
    "student": {
      "student_id": "S12345"
    }
  }'
```

**Get all users:**
```bash
curl http://localhost:8080/api/v1/users
```

**Create an instructor:**
```bash
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@example.com",
    "name": "Dr. Jane Smith",
    "user_type": "instructor",
    "instructor": {
      "employee_id": "E67890"
    }
  }'
```

### 6. Run Tests
```bash
# All tests
go test ./... -v

# Just unit tests
go test ./tests/unit/... -v

# Just integration tests
go test ./tests/integration/... -v
```

## Using Make Commands

If you prefer using Make:

```bash
# Install dependencies
make deps

# Run the server
make run

# Run tests
make test

# Build binary
make build

# Run the built binary
./bin/identity-service
```

## Using Docker

```bash
# Start with PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f identity-service

# Stop
docker-compose down
```

## Next Steps

1. **Read the full README.md** for detailed API documentation
2. **Check IMPLEMENTATION_PLAN.md** to understand the architecture
3. **Add more user types** following the extension guide
4. **Implement authentication** using JWT
5. **Deploy to production** using Docker or binary

## Common Issues

### Port Already in Use
Change `SERVER_PORT` in `.env`:
```env
SERVER_PORT=8081
```

### SQLite Permission Issues
Ensure you have write permissions in the project directory, or change `SQLITE_PATH`:
```env
SQLITE_PATH=/tmp/identity.db
```

### Module Download Issues
```bash
go clean -modcache
go mod download
```

## API Examples

See `docs/api_examples.md` (if available) or use the curl commands above.

## Support

- Check the README.md for detailed documentation
- Review the code comments
- Check test files for usage examples

Happy coding! 🚀
