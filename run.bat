@echo off
echo ========================================================
echo Starting FocusMate Local - The Guided Work Desk
echo 100%% Local Inference Agent Workspace (No Cloud Required)
echo ========================================================
echo.

:: Add Local MinGit and Python Scripts to PATH if not already present
set PATH=%LOCALAPPDATA%\Programs\MinGit\cmd;%LOCALAPPDATA%\Python\pythoncore-3.14-64\Scripts;%PATH%

:: Start Uvicorn Server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
pause
