@echo off
echo ================================
echo Starting Faucet Bot with ngrok
echo ================================
echo.

REM Start ngrok in background
echo Starting ngrok tunnel on port 3003...
start /B ngrok http 3003

REM Wait for ngrok to start
timeout /t 5 /nobreak >nul

echo.
echo ================================
echo ngrok is now running!
echo ================================
echo.
echo 1. Open browser and go to: http://localhost:4040
echo 2. Copy the HTTPS forwarding URL (e.g., https://abc123.ngrok-free.app)
echo 3. Update Frontend/Landingpage/.env with:
echo    VITE_FAUCET_BOT_URL=YOUR_NGROK_URL
echo 4. Deploy to Vercel
echo.
echo Press any key to start the faucet bot...
pause >nul

echo.
echo Starting faucet bot on port 3003...
node faucet-bot.js
