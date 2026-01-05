#!/bin/bash
set -e

echo "Building proto-gen image..."
docker build -f services/go/shared/proto/Dockerfile.gen -t proto-gen services/go/shared/proto

echo "Generating Go code..."
docker run --rm -v $(pwd)/services/go:/workspace proto-gen --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative shared/proto/auth/auth.proto shared/proto/institute/institute.proto

echo "Done!"
