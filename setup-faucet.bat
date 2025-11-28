@echo off
echo ========================================
echo   Installing Faucet Server Dependencies
echo ========================================
echo.

cd /d "%~dp0"

echo Installing required packages...
call npm install express cors ethers dotenv nodemon

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env file and add FAUCET_PRIVATE_KEY
echo 2. Fund the faucet wallet with ETH for gas
echo 3. Run: node faucet-server.js
echo.
pause
