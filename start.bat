@echo off
title AI Chatbot Interface
echo Starting AI Chatbot Interface...
echo Please wait while we start the local server...

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed! Please install Python from https://python.org
    pause
    exit /b 1
)

:: Start local server
echo Starting local server on http://localhost:8000
python -m http.server 8000

pause
