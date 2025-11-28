# 🚀 Quick Start Guide - Gasless Faucet

## What You Need

1. **Faucet Wallet** - A wallet with ETH for gas fees
2. **Node.js** - Installed on your system
3. **Liquidity Pool Access** - Faucet wallet must be able to call removeLiquidity

## Step-by-Step Setup

### 1️⃣ Install Dependencies

Open PowerShell in the project root:

```powershell
cd "e:\solidity\vercel gweai\SipLedger"
npm install express cors ethers dotenv nodemon
```

### 2️⃣ Configure Environment

Create/edit `.env` file in project root:

```env
FAUCET_PRIVATE_KEY=37e2e04e8f4c3a685d9ac8e81cb00b8cd81adbb925147f3bcaa85097c2b7645d
RPC_URL=https://sepolia.base.org
FAUCET_PORT=3002
```

### 3️⃣ Fund the Faucet Wallet

**Get wallet address:**

```powershell
node -e "const ethers = require('ethers'); const wallet = new ethers.Wallet('37e2e04e8f4c3a685d9ac8e81cb00b8cd81adbb925147f3bcaa85097c2b7645d'); console.log('Faucet Wallet:', wallet.address)"
```

**Send ETH to this address:**

- Go to: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Request Base Sepolia ETH
- Send at least 0.01 ETH to the faucet wallet

### 4️⃣ Start the Faucet Server

```powershell
node faucet-server.js
```

You should see:

```
╔════════════════════════════════════════╗
║   🚰 Gasless Faucet Server Running    ║
╠════════════════════════════════════════╣
║  Port: 3002
║  Chain: Base Sepolia (84532)
║  Faucet: 0x1234...
╚════════════════════════════════════════╝
```

### 5️⃣ Update Frontend Config

In `Frontend/Landingpage/.env`:

```env
VITE_API_BASE_URL=http://localhost:3002
```

### 6️⃣ Test the Faucet

1. Connect your wallet in the app
2. Go to Faucet page
3. Click "Claim 100 USDC"
4. Wait for confirmation (no gas needed!)

## How It Works

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   User      │         │   Faucet     │         │  Liquidity Pool │
│   Wallet    │         │   Server     │         │   Contract      │
└──────┬──────┘         └──────┬───────┘         └────────┬────────┘
       │                       │                          │
       │  1. Click "Claim"     │                          │
       │──────────────────────>│                          │
       │   (No gas needed)     │                          │
       │                       │                          │
       │                       │  2. Call removeLiquidity │
       │                       │──────────────────────────>│
       │                       │     (Server pays gas)    │
       │                       │                          │
       │                       │  3. Transfer USDC        │
       │<──────────────────────┼──────────────────────────│
       │   100 USDC received   │                          │
       │                       │                          │
```

## Troubleshooting

### ❌ "Faucet is out of funds"

**Solution:** Send more ETH to faucet wallet for gas

### ❌ "Connection refused"

**Solution:** Make sure faucet server is running on port 3002

### ❌ "Already claimed"

**Solution:** Wait 24 hours or clear localStorage

### ❌ "Insufficient liquidity"

**Solution:** Add more USDC to the liquidity pool

## Production Deployment

For production/mainnet:

1. Use a secure wallet with sufficient ETH
2. Deploy faucet server to cloud (AWS, Heroku, etc.)
3. Add rate limiting and DDoS protection
4. Use database instead of memory for claim tracking
5. Monitor wallet balance and set up alerts
6. Implement proper logging and error tracking

## Security Notes

- Keep `FAUCET_PRIVATE_KEY` secret
- Never commit private keys to git
- Use separate wallet for faucet (not your main wallet)
- Fund with only what's needed for gas
- Monitor for abuse and adjust cooldown periods

## Support

If you encounter issues:

1. Check server logs in terminal
2. Verify wallet has ETH for gas
3. Confirm contract allows faucet wallet to call removeLiquidity
4. Check network connectivity

Happy Testing! 🎉
