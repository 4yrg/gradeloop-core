#!/bin/bash

# Script to regenerate protobuf files for auth service
# This uses Docker to run protoc since it may not be installed locally

set -e

echo "Regenerating protobuf files for auth service..."

cd "$(dirname "$0")/../services/go/shared/proto/auth"

# Using Docker with golang image that has protoc
docker run --rm \
  -v "$(pwd):/workspace" \
  -w /workspace \
  golang:1.24 \
  sh -c "
    echo 'Installing protoc and Go plugins...'
    apt-get update -qq && apt-get install -y -qq protobuf-compiler > /dev/null 2>&1
    go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
    export PATH=\"\$PATH:\$(go env GOPATH)/bin\"
    
    echo 'Generating Go code from proto files...'
    protoc --go_out=. --go_opt=paths=source_relative \
           --go-grpc_out=. --go-grpc_opt=paths=source_relative \
           auth.proto
    
    echo 'Done!'
  "

echo "Protobuf files regenerated successfully!"
echo "Generated files:"
ls -lh auth.pb.go auth_grpc.pb.go
