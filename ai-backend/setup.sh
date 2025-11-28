#!/bin/bash

# Setup Script for AI Backend
# Run with: bash setup.sh

echo "🚀 Setting up GweAI Trade Agent Backend..."

# Check Python version
echo "📋 Checking Python version..."
python3 --version || python --version

# Create virtual environment
echo "🔨 Creating virtual environment..."
python3 -m venv venv || python -m venv venv

# Activate virtual environment
echo "⚡ Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Download spaCy model
echo "🧠 Downloading spaCy English model..."
python -m spacy download en_core_web_sm

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Test installation
echo "🧪 Testing installation..."
python -c "from app.nlp_engine import NLPEngine; print('✅ NLP Engine imported successfully')"

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the server:"
echo "  Windows: venv\\Scripts\\activate && uvicorn app.main:app --reload"
echo "  Linux/Mac: source venv/bin/activate && uvicorn app.main:app --reload"
echo ""
echo "API will be available at: http://localhost:8000"
echo "Documentation: http://localhost:8000/docs"
