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

### Local Development with Docker Compose

For local development of the `model-orchestrator` service, you can use `docker-compose.example.yml`. This setup allows the FastAPI application to run in a Docker container, while still reflecting code changes from your host machine immediately (via volume mounts) and connecting to containerized database/storage services.

1.  **Start Dependent Services:**
    First, ensure your `ccd-postgres` and `ccd-minio` services are running.
    ```bash
    docker compose -f docker-compose.example.yml up -d ccd-postgres ccd-minio redis
    ```

2.  **Run the Inference Microservice in Dev Mode:**
    ```bash
    docker compose -f docker-compose.example.yml up model-orchestrator-dev
    ```
    The `model-orchestrator-dev` service will build the Docker image (if not already built), start the FastAPI application, and expose it on `http://localhost:8001`. Changes to the Python code in `apps/model-orchestrator` on your host will trigger an automatic reload of the service inside the container.

3.  **Access FastAPI Docs:**
    Once running, open your browser to `http://localhost:8001/docs` to see the API documentation.

4.  **Running Scripts (e.g., `data_ingest.py`, `train_encoder.py`):**
    You can run scripts either directly on your host machine (if you have all Python dependencies installed) or inside a running `model-orchestrator-dev` container.

    *   **On Host (Recommended for heavy tasks like training):**
        Ensure you have all `requirements.txt` dependencies installed in your Python environment.
        Set environment variables like `CODE_CLONE_DATABASE_URL`, `CODE_CLONE_S3_ENDPOINT_URL`, etc., to point to the `localhost` ports exposed by `docker-compose` (e.g., `CODE_CLONE_DATABASE_URL=postgresql+asyncpg://user:password@localhost:5433/ccd_db`).
        ```bash
        # Example: Ingest data
        cd apps/model-orchestrator
        python -m app.models.cipas.code_clone_detection.scripts.data_ingest store --root-dir D:/Projects/SLIIT/Research/Datasets/Project_CodeNet --limit 100
        ```
        (Remember to adjust `LOCAL_CODENET_ROOT` in the script or use CLI flag)

    *   **Inside the `model-orchestrator-dev` container:**
        This is useful for debugging script interactions within the Docker environment.
        ```bash
        docker compose -f docker-compose.example.yml exec model-orchestrator-dev bash
        # Now inside the container, you can run:
        python -m app.models.cipas.code_clone_detection.scripts.data_ingest store --root-dir /data/Project_CodeNet --limit 100
        # (Note: You'll need to uncomment the CodeNet volume mount in docker-compose.example.yml)
        ```
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
