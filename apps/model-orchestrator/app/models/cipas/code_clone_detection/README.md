# Code Clone Detection Module

This module provides functionalities for detecting code clones within a set of submissions.

## Structure

- **`api/`**: Contains the FastAPI router and API endpoint definitions.
- **`config.py`**: Pydantic-based configuration management.
- **`db.py`**: SQLAlchemy setup for asynchronous database interaction.
- **`parsers/`**: Placeholder for source code parsers. Notebooks related to parser development should be stored in a corresponding `notebooks/parsers` directory at the project root.
- **`schemas.py`**: Pydantic models for data validation and serialization.
- **`scripts/`**: For CLI scripts. For example, database migrations or data backfills.
- **`services/`**: Houses business logic components.
- **`storage.py`**: Abstraction for storing and retrieving file artifacts.
- **`tests/`**: Pytest-based tests for the module.
- **`utils.py`**: Utility functions like logging.
- **`pyproject.toml`**: Configuration for black and isort.

## Running Tests

To run the tests for this module, you will need to install `pytest`, `pytest-anyio` and `httpx`.

Then, execute `pytest` from the `apps/model-orchestrator` directory:

```bash
# From D:/Projects/SLIIT/Research/gradeloop-core/apps/model-orchestrator/
pytest app/models/cipas/code_clone_detection/tests/
```
You may need to adjust your `PYTHONPATH` to ensure the application modules can be found. The provided `conftest.py` attempts to handle this, but it might require review based on your specific setup.
