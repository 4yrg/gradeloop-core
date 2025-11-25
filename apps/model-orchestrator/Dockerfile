# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.11.9
FROM python:${PYTHON_VERSION}-slim as base

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1

# Keeps Python from buffering stdout and stderr to avoid situations where
# the application crashes without emitting any logs due to buffering.
ENV PYTHONUNBUFFERED=1

# --- GPU Acceleration Notes ---
# For GPU acceleration, you would typically use a NVIDIA CUDA base image.
# Example: FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04
# Then, ensure you install PyTorch with CUDA support (e.g., via pip, specifying CUDA version).
# This Dockerfile targets CPU by default for broader compatibility.
# ------------------------------

WORKDIR /app/apps/model-orchestrator

# Create a non-privileged user that the app will run under.
# See https://docs.docker.com/go/dockerfile-user-best-practices/
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leveraging a cache mount to /root/.cache/pip to speed up subsequent builds.
# Leveraging a bind mount to requirements.txt to avoid having to copy them into
# into this layer.
# Note: The requirements.txt is specific to this app.
RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=bind,source=./requirements.txt,target=requirements.txt \
    python -m pip install -r requirements.txt

# Switch to the non-privileged user to run the application.
USER appuser

# Copy the source code into the container.
# Copy only the model-orchestrator application
COPY . /app/apps/model-orchestrator

# Expose the port that the application listens on.
EXPOSE 8001

# Run the application.
CMD uvicorn 'main:app' --host=0.0.0.0 --port=8001