@echo off
REM Cleanup script - Remove unnecessary files before GitHub upload

echo 🧹 Cleaning up unnecessary files for GitHub...
echo.

REM Remove test Python files
echo Removing test Python files...
del /q test_*.py 2>nul
del /q debug_*.py 2>nul
del /q verify_*.py 2>nul

REM Remove demo files
echo Removing demo files...
del /q demo_*.py 2>nul
del /q demo_*.html 2>nul
del /q create_demo*.py 2>nul

REM Remove utility scripts (keep only essential ones)
echo Removing temporary utility scripts...
del /q clear_*.py 2>nul
del /q copy_*.py 2>nul
del /q download_*.py 2>nul
del /q inject_*.py 2>nul
del /q update_*.py 2>nul
del /q auto_copy_sessions.js 2>nul
del /q copy_latest_session.js 2>nul
del /q browser_console_test.js 2>nul

REM Remove test HTML files
echo Removing test HTML files...
del /q test_*.html 2>nul
del /q debug_*.html 2>nul
del /q fixed_*.html 2>nul
del /q real_time_*.html 2>nul
del /q vite_*.html 2>nul
del /q campaign_dashboard.html 2>nul
del /q marketing_campaign_dashboard.html 2>nul
del /q professional_dashboard.html 2>nul

REM Remove old documentation
echo Removing old documentation files...
del /q ANALYTICS_WORKFLOW_GUIDE.md 2>nul
del /q AUTO_UPDATE_README.md 2>nul
del /q COMPLETE_WORKFLOW_SUMMARY.md 2>nul
del /q DASHBOARD_FIX_SUMMARY.md 2>nul
del /q FINAL_SETUP_GUIDE.md 2>nul
del /q FRONTEND_LOOP_FIX.md 2>nul
del /q manual_tab_testing_guide.md 2>nul
del /q MCP_INTEGRATION_GUIDE.md 2>nul
del /q S3_AUTO_DOWNLOAD_GUIDE.md 2>nul
del /q S3_URI_NORMALIZATION_GUIDE.md 2>nul
del /q SESSION_MISMATCH_FIX_SUMMARY.md 2>nul
del /q TASK_*.md 2>nul
del /q WEBSITE_TESTING_GUIDE.md 2>nul
del /q DEMO_RECORDING_GUIDE.md 2>nul

REM Remove setup scripts (keep only deployment scripts)
echo Removing setup scripts...
del /q setup_*.py 2>nul
del /q setup-check.ps1 2>nul
del /q start_*.py 2>nul
del /q startup_cleanup.py 2>nul
del /q file_watcher.py 2>nul

REM Remove old config files
echo Removing old config files...
del /q mcp_gateway_config.json 2>nul
del /q real_mcp_gateway_config.json 2>nul

REM Remove test media
echo Removing test media...
del /q ad_001.png 2>nul
del /q test_video.mp4 2>nul

REM Remove Jupyter notebooks
echo Removing Jupyter notebooks...
del /q *.ipynb 2>nul

REM Remove old Python scripts
echo Removing old Python scripts...
del /q approval_persistence_server_code.py 2>nul
del /q marketing_campaign_with_gateway.py 2>nul
del /q mcp_agent_wrapper.py 2>nul
del /q mcp_direct_tools.py 2>nul

echo.
echo ✅ Cleanup complete!
echo.
echo 📊 Removed:
echo   - Test files (test_*.py, test_*.html)
echo   - Debug files (debug_*.py, debug_*.html)
echo   - Demo files (demo_*.py, demo_*.html)
echo   - Old documentation (summaries, guides)
echo   - Utility scripts (setup, copy, download)
echo   - Test media files
echo.
echo 📦 Kept essential files:
echo   - Source code (src/, *.py)
echo   - Deployment files (Dockerfile, docker-compose.yml)
echo   - Main documentation (README.md, guides)
echo   - Configuration (package.json, requirements.txt)
echo.
pause
