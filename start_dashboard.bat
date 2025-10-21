@echo off
echo 🚀 Starting Marketing Campaign Dashboard
echo =====================================

echo.
echo 📁 Starting File Watcher...
start "File Watcher" cmd /k "python file_watcher.py"

echo.
echo ⏳ Waiting 3 seconds for file watcher to initialize...
timeout /t 3 /nobreak > nul

echo.
echo 🌐 Starting Frontend Server...
start "Frontend" cmd /k "npm run dev"

echo.
echo ✅ Dashboard started successfully!
echo.
echo 📋 What's running:
echo   • File Watcher: Monitors agent_outputs/ and copies to public/
echo   • Frontend: http://localhost:3000
echo.
echo 💡 Usage:
echo   1. Run your Python agents (they will create files in agent_outputs/)
echo   2. Go to http://localhost:3000
echo   3. Click "Auto-Update" button to see live updates
echo.
echo Press any key to exit...
pause > nul