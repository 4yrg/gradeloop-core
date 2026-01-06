#!/bin/bash
# Quick start script for IVAS

echo "🚀 IVAS Quick Start Script"
echo "=========================="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed!"
    echo "Install it with: brew install ollama (macOS)"
    echo "Or visit: https://ollama.com"
    exit 1
fi

echo "✓ Ollama is installed"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama is not running. Starting it..."
    ollama serve > /dev/null 2>&1 &
    sleep 3
fi

echo "✓ Ollama is running"

# Check if model is available
if ! ollama list | grep -q "llama3.1:8b"; then
    echo "📥 Downloading llama3.1:8b model (this will take a few minutes)..."
    ollama pull llama3.1:8b
fi

echo "✓ Model is available"

# Navigate to IVAS directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

echo "✓ Virtual environment ready"

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
echo "📦 Installing/updating dependencies..."
pip install -q -r requirements.txt

echo "✓ Dependencies installed"

echo ""
echo "=========================="
echo "🎉 Starting IVAS Server"
echo "=========================="
echo ""

# Start the server
python main.py
