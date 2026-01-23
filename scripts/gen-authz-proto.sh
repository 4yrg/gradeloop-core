#!/bin/bash

# Script to generate protobuf files for authz service
# This uses Docker to run protoc since it may not be installed locally

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROTO_DIR="$REPO_ROOT/libs/proto/authz"

echo "Generating protobuf files for authz service..."

# Using Docker with golang image that has protoc
docker run --rm \
  -v "$PROTO_DIR:/workspace" \
  -w /workspace \
  golang:1.24 \
  sh -c "
    echo 'Installing build dependencies...'
    apt-get update -qq && apt-get install -y -qq protobuf-compiler
    go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
    export PATH=\"\$PATH:\$(go env GOPATH)/bin\"
    
    echo 'Versions:'
    protoc --version
    protoc-gen-go --version
    
    echo 'Generating Go code from proto files...'
    protoc --go_out=. --go_opt=paths=source_relative \
           --go-grpc_out=. --go-grpc_opt=paths=source_relative \
           authz.proto
    
    echo 'Done!'
  "

echo "Protobuf files generated successfully!"
echo "Generated files:"
ls -lh "$PROTO_DIR/authz.pb.go" "$PROTO_DIR/authz_grpc.pb.go"
