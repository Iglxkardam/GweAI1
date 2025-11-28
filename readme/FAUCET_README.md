# 🚰 Gasless Faucet Server

A gasless faucet server that allows users to claim testnet USDC without needing ETH for gas fees.

## How It Works

1. **User clicks "Claim"** in the frontend (no gas needed)
2. **Frontend calls backend API** with user's wallet address
3. **Backend server executes transaction** using its own wallet (pays gas)
4. **USDC sent directly** to user's wallet from Liquidity Pool

## Setup Instructions

### 1. Install Dependencies

```bash
cd "e:\solidity\vercel gweai\SipLedger"
npm install express cors ethers dotenv nodemon --save
```

### 2. Configure Environment

Create or update `.env` file:

```env
FAUCET_PRIVATE_KEY=your_private_key_here
RPC_URL=https://sepolia.base.org
FAUCET_PORT=3002
```

**IMPORTANT:** The wallet associated with `FAUCET_PRIVATE_KEY` must:

- Have ETH for gas fees (at least 0.01 ETH recommended)
- Have the liquidity pool owner role (or contract must allow calls)

### 3. Fund the Faucet Wallet

Get the faucet wallet address:

```bash
node -e "const ethers = require('ethers'); const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY'); console.log(wallet.address)"
```

Send ETH to this address for gas fees:

- Use Base Sepolia faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Or send from another wallet

### 4. Start the Faucet Server

```bash
node faucet-server.js
```

Or with auto-restart on changes:

```bash
npm run dev
```

### 5. Update Frontend API URL

In `Frontend/Landingpage/.env`:

```env
VITE_API_BASE_URL=http://localhost:3002
```

## API Endpoints

### POST /api/faucet/claim

Claim tokens from faucet (gasless for user)

**Request:**

```json
{
  "address": "0x1234...",
  "token": "USDC",
  "amount": "100"
}
```

**Response:**

```json
{
  "success": true,
  "txHash": "0xabc...",
  "amount": "100",
  "token": "USDC",
  "recipient": "0x1234...",
  "blockNumber": 12345
}
```

### GET /api/faucet/status?address=0x1234...

Check faucet status and user eligibility

**Response:**

```json
{
  "faucetAddress": "0x5678...",
  "faucetEthBalance": "0.05",
  "canClaim": true,
  "lastClaimTimestamp": null,
  "cooldownPeriod": 86400000,
  "supportedTokens": ["USDC"],
  "claimAmount": "100 USDC"
}
```

### GET /health

Health check endpoint

## Security Features

- ✅ One claim per wallet address
- ✅ 24-hour cooldown period
- ✅ Address validation
- ✅ Amount verification
- ✅ Rate limiting via cooldown
- ✅ Gas limit protection

## Troubleshooting

### "Faucet is out of funds"

- The faucet wallet needs more ETH for gas fees
- Send ETH to the faucet wallet address

### "Liquidity pool has insufficient USDC"

- The liquidity pool contract doesn't have enough USDC
- Add more USDC to the liquidity pool

### "Already claimed"

- User has already claimed in the last 24 hours
- Wait for cooldown period to expire

## Production Deployment

For production, consider:

1. **Use a database** instead of in-memory Map for claim tracking
2. **Add Redis** for distributed cooldown tracking
3. **Implement rate limiting** at API level
4. **Add authentication** (optional)
5. **Monitor wallet balance** and alert when low
6. **Use environment-specific configs**
7. **Enable HTTPS** with SSL certificates
8. **Add logging** (Winston, Morgan)
9. **Implement queue system** (Bull, RabbitMQ) for high volume

## Contract Integration

The faucet calls `removeLiquidity(address token, uint256 amount)` on the LiquidityPool contract:

```solidity
function removeLiquidity(address token, uint256 amount) external onlyOwner {
    // Withdraws tokens from pool and sends to caller (faucet wallet)
}
```

The contract must:

- Allow the faucet wallet to call `removeLiquidity`
- Have sufficient USDC balance
- Have proper access control

## License

MIT
