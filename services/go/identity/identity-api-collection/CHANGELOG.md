# Changelog

All notable changes to the Identity Service Bruno API Collection will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-22

### Added
- Initial release of the Identity Service Bruno API Collection
- Complete CRUD operations for all major resources:
  - **Health Check** (1 endpoint)
  - **Users** (9 endpoints)
    - Get All Users (with pagination)
    - Get User by ID
    - Create Student
    - Create Instructor
    - Create System Admin
    - Create Institute Admin
    - Update User
    - Delete User
    - Assign Roles to User
  - **Institutes** (5 endpoints)
    - Get All Institutes
    - Get Institute by ID
    - Create Institute
    - Update Institute
    - Delete Institute
  - **Faculties** (5 endpoints)
    - Get Faculties by Institute
    - Get Faculty by ID
    - Create Faculty
    - Update Faculty
    - Delete Faculty
  - **Departments** (5 endpoints)
    - Get Departments by Faculty
    - Get Department by ID
    - Create Department
    - Update Department
    - Delete Department
  - **Classes** (5 endpoints)
    - Get Classes by Department
    - Get Class by ID
    - Create Class
    - Update Class
    - Delete Class
  - **Memberships** (4 endpoints)
    - Create Membership
    - Get Memberships by Student
    - Get Current Membership
    - Transfer Student
  - **Roles** (5 endpoints)
    - Get All Roles
    - Get Role by ID
    - Create Role
    - Update Role
    - Delete Role
- Local environment configuration with variables:
  - `base_url`: http://localhost:8080
  - `api_version`: v1
- Comprehensive documentation:
  - README.md with full collection overview
  - SETUP.md with installation and quick start guide
  - Inline documentation for each endpoint
  - Collection-level documentation in collection.bru
- Organized folder structure by resource type
- Example request bodies for all POST/PUT operations
- Path and query parameter documentation
- Pagination support documentation
- Error handling examples
- Soft delete behavior documentation

### Documentation Highlights
- 41 total API endpoints
- 8 organized folders
- Complete workflow examples
- Keyboard shortcuts guide
- Troubleshooting section
- Environment variable usage
- Tips and best practices

### Features
- Git-friendly collection format (plain text files)
- Environment variable support for different deployment targets
- Reusable request templates
- Detailed inline documentation
- Follows RESTful API conventions
- Supports all HTTP methods (GET, POST, PUT, DELETE)

## [Unreleased]

### Planned
- Additional environment files (Production, Staging, Development)
- Pre-request scripts for authentication
- Post-request test scripts
- Collection-level variables for commonly used IDs
- Example responses for all endpoints
- Performance testing examples
- Advanced query parameter examples (filtering, sorting)

---

## Notes

### Version Numbering
- **MAJOR** version: Incompatible API changes
- **MINOR** version: New functionality in a backwards compatible manner
- **PATCH** version: Backwards compatible bug fixes or documentation updates

### How to Update
When updating the collection:
1. Update the version in this CHANGELOG
2. Document all changes under the appropriate section
3. Add the date of release
4. Update README.md if there are structural changes
5. Commit all changes together

### Contributing
When adding new endpoints or features:
- Follow the existing naming conventions
- Include comprehensive documentation in the `docs` section
- Add examples in request bodies
- Update this CHANGELOG with your additions
- Update the README.md if adding new folders or significant functionality

### Contact
For questions, issues, or contributions related to this collection, please refer to the main GradeLoop Identity Service repository.