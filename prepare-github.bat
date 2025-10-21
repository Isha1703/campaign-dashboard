@echo off
REM GitHub Preparation Script for Windows

echo 📦 Preparing project for GitHub upload...

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed. Please install Git first.
    echo Visit: https://git-scm.com/downloads
    exit /b 1
)

REM Initialize git repository if not already initialized
if not exist .git (
    echo 🔧 Initializing Git repository...
    git init
    echo ✅ Git repository initialized
) else (
    echo ✅ Git repository already exists
)

REM Check for .gitignore
if not exist .gitignore (
    echo ⚠️  .gitignore not found. Please create it first.
    exit /b 1
)

REM Check for sensitive files
echo 🔍 Checking for sensitive files...
if exist .env (
    echo ⚠️  WARNING: .env file found. Make sure it's in .gitignore!
    findstr /C:".env" .gitignore >nul
    if errorlevel 1 (
        echo ❌ .env is NOT in .gitignore! Adding it now...
        echo .env >> .gitignore
    ) else (
        echo ✅ .env is in .gitignore
    )
)

REM Clean up session data
echo 🧹 Cleaning up session data...
if exist "public\agent_outputs" (
    echo   Removing agent outputs...
    del /s /q "public\agent_outputs\*.*" >nul 2>&1
)

if exist "public\downloads" (
    echo   Removing downloaded media...
    del /s /q "public\downloads\*.*" >nul 2>&1
)

REM Stage all files
echo 📝 Staging files for commit...
git add .

REM Show status
echo.
echo 📊 Git Status:
git status

echo.
echo ✅ Project prepared for GitHub!
echo.
echo 📋 Next steps:
echo 1. Review the staged files above
echo 2. Commit your changes:
echo    git commit -m "Initial commit: Campaign Dashboard"
echo.
echo 3. Create a new repository on GitHub:
echo    https://github.com/new
echo.
echo 4. Add remote and push:
echo    git remote add origin https://github.com/YOUR_USERNAME/campaign-dashboard.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 🎉 Your project will be live on GitHub!

pause
