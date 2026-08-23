@echo off
echo Requesting administrator privileges...
powershell -NoProfile -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0setup.ps1\"' -Verb RunAs -Wait"
pause
