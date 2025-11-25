# GradeLoop Core
## Description
This platform addresses these challenges by creating a unified, AI-driven system that analyzes not just the final code, but also the process, integrity, quality, and the student's conceptual understanding behind it.
---
## Project Structure
- Add later
---
## Development Environment

This project uses Docker Compose to manage development services, including a PostgreSQL database and a MinIO S3-compatible object store.

### Running Services

To start all services, run the following command from the project root:
```bash
docker compose up -d
```

### MinIO Artifact Storage

The project is configured to use a MinIO container for storing artifacts, such as code submissions for clone detection.

- **MinIO Console:** [http://localhost:9001](http://localhost:9001)
- **Username:** `minioadmin`
- **Password:** `minioadmin`

The application connects to MinIO via its internal service name (`http://ccd-minio:9000`). For external access (e.g., using an S3 client like `s3cmd` or Cyberduck), use `http://localhost:9000`.

The `code_clone_detection` module automatically creates a bucket named `code-clone-submissions` on startup.

### PostgreSQL Database

A PostgreSQL database is provided for the `model-orchestrator` service.

- **Host:** `localhost`
- **Port:** `5433` (maps to `5432` in the container)
- **Username:** `user`
- **Password:** `password`
- **Database Name:** `ccd_db`

You can connect to this database using any standard PostgreSQL client. The application connects internally via the service name `ccd-postgres:5432`.
---
## Installation
- Add later
---
## Usage
- Add later
---
## Contributing
- Add later
---
## License
- Add later
