# Scripts

Development, CI/CD, and operational scripts for the GradeLoop platform.

## Available Scripts

### Development

- `build-all.sh` - Build all services
- `test-all.sh` - Run tests for all services
- `lint-all.sh` - Lint all code
- `dev-setup.sh` - Set up local development environment

### Database

- `migrate.sh` - Run database migrations
- `seed.sh` - Seed database with test data
- `backup-db.sh` - Backup databases
- `restore-db.sh` - Restore databases from backup

### Deployment

- `deploy-all.sh` - Deploy all services
- `deploy-service.sh` - Deploy a specific service
- `rollback.sh` - Rollback to previous version

### Utilities

- `generate-certs.sh` - Generate SSL certificates for local development
- `health-check.sh` - Check health of all services
- `logs.sh` - Tail logs from all services

## Usage Examples

### Build All Services

```bash
./scripts/build-all.sh
```

### Run All Tests

```bash
./scripts/test-all.sh
```

### Run Migrations

```bash
./scripts/migrate.sh up
./scripts/migrate.sh down
```

### Deploy to Staging

```bash
./scripts/deploy-all.sh staging
```

## Creating New Scripts

1. Create the script file in this directory
2. Make it executable: `chmod +x scripts/your-script.sh`
3. Add a shebang: `#!/bin/bash`
4. Add error handling: `set -e`
5. Add usage documentation
6. Update this README

## Script Template

```bash
#!/bin/bash
set -e

# Script: script-name.sh
# Description: What this script does
# Usage: ./script-name.sh [arguments]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
function info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Main script logic
info "Starting script..."

# Your code here

info "Script completed successfully!"
```

## Best Practices

1. **Error Handling**: Use `set -e` to exit on errors
2. **Documentation**: Add clear comments and usage instructions
3. **Validation**: Validate inputs and prerequisites
4. **Idempotency**: Scripts should be safe to run multiple times
5. **Logging**: Provide clear, colored output
6. **Exit Codes**: Return appropriate exit codes
7. **Cleanup**: Clean up temporary files and resources

## CI/CD Integration

These scripts are used in GitHub Actions workflows:
- `.github/workflows/build.yml` uses `build-all.sh`
- `.github/workflows/test.yml` uses `test-all.sh`
- `.github/workflows/deploy.yml` uses `deploy-all.sh`
