@echo off
robocopy "src\app\(dashboard)" "src\app\dashboard" /E
if errorlevel 8 goto failed
rd /s /q "src\app\(dashboard)"
echo Successfully renamed folder
goto end
:failed
echo Failed to copy folder
:end 