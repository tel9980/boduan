@echo off
cd backend
call ..\.venv\Scripts\activate.bat
python scheduler.py
pause
