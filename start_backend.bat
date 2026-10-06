@echo off
echo Starting MindAxis Backend Server...
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
