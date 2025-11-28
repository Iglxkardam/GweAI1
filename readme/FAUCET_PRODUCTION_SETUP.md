# Faucet Bot Production Setup Guide

## Quick Start

### 1. Start ngrok and Bot

Run the batch file:

```bash
start-faucet-production.bat
```

### 2. Get Your ngrok URL

- ngrok will open automatically
- Open browser: http://localhost:4040
- Copy the **HTTPS** forwarding URL (e.g., `https://abc123.ngrok-free.app`)

### 3. Update Frontend Configuration

Edit `Frontend/Landingpage/.env`:

```env
VITE_FAUCET_BOT_URL=https://your-ngrok-url-here.ngrok-free.app
```

### 4. Deploy to Vercel

```bash
cd Frontend/Landingpage
npm run build
# Then deploy via Vercel dashboard or CLI
```

## Manual Setup (Alternative)

### Step 1: Start ngrok

```bash
./ngrok http 3003
```

### Step 2: Start Faucet Bot (in another terminal)

```bash
node faucet-bot.js
```

### Step 3: Configure Frontend

Update `.env` with ngrok URL and deploy

## Important Notes

✅ **Keep bot running** - Users can only claim when bot is active
✅ **ngrok URL changes** - Free ngrok URLs change on restart, update `.env` each time
✅ **HTTPS required** - Vercel requires HTTPS, ngrok provides this automatically
✅ **Bot logs** - Check console for claim activity and errors

## Troubleshooting

### Bot Offline Error

- Check if bot is running: `node faucet-bot.js`
- Verify ngrok tunnel: http://localhost:4040
- Test bot endpoint: `https://your-ngrok-url.ngrok-free.app/health`

### CORS Errors

- Already configured in `faucet-bot.js` with `cors()` middleware ✅

### ngrok Session Expired

- Free tier has 2-hour session limit
- Restart ngrok and update `.env` with new URL

## Production Checklist

- [ ] ngrok running on port 3003
- [ ] Faucet bot running (`node faucet-bot.js`)
- [ ] Frontend `.env` updated with ngrok URL
- [ ] Deployed to Vercel
- [ ] Test claim functionality
- [ ] Monitor bot logs for activity

## Keeping Bot Running 24/7

Consider using PM2 for auto-restart:

```bash
npm install -g pm2
pm2 start faucet-bot.js --name faucet-bot
pm2 startup
pm2 save
```

For ngrok, consider upgrading to paid plan for:

- Static URLs (no need to update .env)
- No session timeouts
- Custom domains
