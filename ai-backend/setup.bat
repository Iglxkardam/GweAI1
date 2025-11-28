@echo off
REM Setup Script for AI Backend (Windows)
REM Run with: setup.bat

echo 🚀 Setting up GweAI Trade Agent Backend...

REM Check Python version
echo 📋 Checking Python version...
python --version

REM Create virtual environment
echo 🔨 Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo ⚡ Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo 📦 Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt

REM Download spaCy model
echo 🧠 Downloading spaCy English model...
python -m spacy download en_core_web_sm

REM Create logs directory
echo 📁 Creating logs directory...
if not exist logs mkdir logs

REM Test installation
echo 🧪 Testing installation...
python -c "from app.nlp_engine import NLPEngine; print('✅ NLP Engine imported successfully')"

echo.
echo ✅ Setup complete!
echo.
echo To start the server:
echo   venv\Scripts\activate
echo   uvicorn app.main:app --reload
echo.
echo API will be available at: http://localhost:8000
echo Documentation: http://localhost:8000/docs

pause
