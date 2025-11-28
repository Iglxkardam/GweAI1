# 🚀 Render.com Deployment Guide

## Step 1: Prepare Repository

Your `faucet-bot` folder is ready! Now push to GitHub:

```bash
git add faucet-bot/
git commit -m "Add faucet bot for Render deployment"
git push origin main
```

## Step 2: Create Render Account

1. Go to: https://render.com/
2. Click "Get Started"
3. Sign up with GitHub (easiest)
4. Authorize Render to access your repositories

## Step 3: Deploy Web Service

1. **Click "New +"** → **"Web Service"**

2. **Connect Repository:**

   - Find your repository: `Iglxkardam/GweAI1`
   - Click "Connect"

3. **Configure Service:**

   ```
   Name: faucet-bot
   Region: Choose closest to you
   Branch: main
   Root Directory: faucet-bot
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Select Plan:**

   - Choose **"Free"** ($0/month)
   - Note: Service sleeps after 15 min inactivity

5. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable"

   Add these one by one:

   ```
   PRIVATE_KEY = your_bot_wallet_private_key
   FAUCET_CONTRACT_ADDRESS = 0x29D3821d47646B269Eca9EA57a19197c5210Bec2
   USDC_CONTRACT_ADDRESS = 0xBEE08798a3634e29F47e3d277C9d11507D55F66a
   BASE_SEPOLIA_RPC = https://sepolia.base.org
   ```

6. **Click "Create Web Service"**

## Step 4: Get Your Permanent URL

After deployment completes (~2-3 minutes):

1. Copy your service URL (e.g., `https://faucet-bot-xyz.onrender.com`)
2. This URL **NEVER CHANGES** ✅

## Step 5: Update Frontend

Edit `Frontend/Landingpage/.env`:

```env
VITE_FAUCET_BOT_URL=https://your-service-name.onrender.com
```

## Step 6: Deploy Frontend to Vercel

```bash
cd Frontend/Landingpage
npm run build
# Deploy via Vercel dashboard or CLI
```

## ✅ Done!

Your faucet is now live with a **permanent URL**!

## 📊 Monitor Your Bot

- **Render Dashboard:** https://dashboard.render.com/
- **Bot Logs:** Click your service → "Logs" tab
- **Health Check:** `https://your-service.onrender.com/health`

## ⚠️ Important Notes

**Free Tier Limitations:**

- Service sleeps after 15 min inactivity
- Takes ~30 seconds to wake up on first request
- Then stays awake while users are claiming
- 750 hours/month free (enough for most testnet usage)

**To Keep Bot Always Awake (Optional):**

- Upgrade to paid plan ($7/month)
- Or use a cron job to ping `/health` every 10 minutes

## 🔧 Troubleshooting

### Bot Not Starting

- Check Render logs for errors
- Verify all environment variables are set
- Ensure PRIVATE_KEY is correct (no 0x prefix needed)

### Claims Failing

- Check bot wallet has enough ETH for gas (~0.636 ETH)
- Verify faucet contract has tokens (1.1 ETH + 10,000 USDC)
- Check Render logs for specific error messages

### Frontend Can't Reach Bot

- Verify VITE_FAUCET_BOT_URL is correct
- Test health endpoint: `https://your-service.onrender.com/health`
- Check CORS is enabled (already configured)

## 🎯 Next Steps

After successful deployment:

1. Test claim from your live frontend
2. Monitor Render logs for activity
3. Check transaction on BaseScan
4. Share your dApp with users!

---

**Need Help?** Check Render docs: https://docs.render.com/
