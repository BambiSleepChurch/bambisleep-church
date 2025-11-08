@echo off
REM Quick launcher for Multi-Instance Copilot Coordination System

echo ========================================
echo   COPILOT CLI COORDINATION LAUNCHER
echo ========================================
echo.
echo This will launch the orchestrator in THIS terminal.
echo.
echo NEXT STEPS - Open 3 more Copilot CLI terminals and run:
echo.
echo   Terminal 2 (Inspector):
echo     cd F:\.powershell\7
echo     pwsh -File worker.ps1 -Role inspector
echo.
echo   Terminal 3 (Writer - perfect for WSL):
echo     cd F:\.powershell\7
echo     pwsh -File worker.ps1 -Role writer
echo.
echo   Terminal 4 (Tester):
echo     cd F:\.powershell\7  
echo     pwsh -File worker.ps1 -Role tester
echo.
echo ========================================
echo   Starting Orchestrator...
echo ========================================
echo.

pwsh -NoExit -File orchestrator.ps1
