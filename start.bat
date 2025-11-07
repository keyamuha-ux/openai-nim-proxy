@echo off
title YaezoCloud API Server
echo ========================================
echo    YaezoCloud API Gateway Starting...
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

echo Starting YaezoCloud API Server...
echo Server will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

node server.js

pause
