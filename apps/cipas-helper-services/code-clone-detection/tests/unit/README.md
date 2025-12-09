# Unit Tests

This directory contains unit tests for the code clone detection pipeline.

## Running Tests

Run all tests:

```bash
pytest tests/unit/ -v
```

Run with coverage:

```bash
pytest tests/unit/ --cov=src --cov-report=html
```

Run specific test file:

```bash
pytest tests/unit/test_models.py -v
```
