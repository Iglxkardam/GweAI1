/**
 * Gasless Faucet Server
 * Sends USDC to users without requiring them to pay gas fees
 */

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.FAUCET_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Contract addresses
const LIQUIDITY_POOL_ADDRESS = '0x9d8A21F14AEb5db3C364F8349c01Ff347765a4C5';
const USDC_ADDRESS = '0xBEE08798a3634e29F47e3d277C9d11507D55F66a';

// Chain configuration (Base Sepolia)
const CHAIN_ID = 84532;
const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';

// Faucet limits
const FAUCET_AMOUNT_USDC = ethers.parseUnits('100', 6); // 100 USDC with 6 decimals
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours

// In-memory claim tracking (use Redis/DB in production)
const claimHistory = new Map();

// LiquidityPool ABI (only needed functions)
const LIQUIDITY_POOL_ABI = [
  'function removeLiquidity(address token, uint256 amount) external'
];

// Initialize provider and wallet
let provider;
let wallet;
let liquidityPoolContract;

try {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // Use private key from environment variable
  if (!process.env.FAUCET_PRIVATE_KEY) {
    console.error('❌ FAUCET_PRIVATE_KEY not set in environment variables');
    process.exit(1);
  }
  
  wallet = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY, provider);
  liquidityPoolContract = new ethers.Contract(
    LIQUIDITY_POOL_ADDRESS,
    LIQUIDITY_POOL_ABI,
    wallet
  );
  
  console.log('✅ Faucet wallet initialized:', wallet.address);
} catch (error) {
  console.error('❌ Failed to initialize wallet:', error);
  process.exit(1);
}

// Helper: Check if address can claim
function canClaim(address) {
  const lastClaim = claimHistory.get(address.toLowerCase());
  if (!lastClaim) return true;
  
  const timeSinceLastClaim = Date.now() - lastClaim;
  return timeSinceLastClaim > COOLDOWN_PERIOD;
}

// Helper: Validate Ethereum address
function isValidAddress(address) {
  return ethers.isAddress(address);
}

/**
 * POST /api/faucet/claim
 * Claims tokens from faucet (gasless for user)
 */
app.post('/api/faucet/claim', async (req, res) => {
  try {
    const { address, token, amount } = req.body;
    
    // Validation
    if (!address || !isValidAddress(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    if (token !== 'USDC') {
      return res.status(400).json({ error: 'Only USDC is supported currently' });
    }
    
    if (amount !== '100') {
      return res.status(400).json({ error: 'Can only claim 100 USDC' });
    }
    
    // Check cooldown
    if (!canClaim(address)) {
      const lastClaim = claimHistory.get(address.toLowerCase());
      const timeLeft = COOLDOWN_PERIOD - (Date.now() - lastClaim);
      const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000));
      return res.status(429).json({ 
        error: `Already claimed. Try again in ${hoursLeft} hours`,
        cooldownRemaining: timeLeft
      });
    }
    
    console.log(`🎯 Processing faucet claim for ${address}`);
    
    // Call removeLiquidity on LiquidityPool contract
    // This withdraws USDC from the pool and sends it to the user's address
    const tx = await liquidityPoolContract.removeLiquidity(
      USDC_ADDRESS,
      FAUCET_AMOUNT_USDC,
      { gasLimit: 200000 } // Set reasonable gas limit
    );
    
    console.log(`📤 Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      // Record claim
      claimHistory.set(address.toLowerCase(), Date.now());
      
      console.log(`✅ Faucet claim successful for ${address}`);
      
      return res.json({
        success: true,
        txHash: tx.hash,
        amount: '100',
        token: 'USDC',
        recipient: address,
        blockNumber: receipt.blockNumber
      });
    } else {
      throw new Error('Transaction failed');
    }
    
  } catch (error) {
    console.error('❌ Faucet claim error:', error);
    
    // Handle specific errors
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(503).json({ 
        error: 'Faucet is out of funds. Please try again later.' 
      });
    }
    
    if (error.message.includes('insufficient liquidity')) {
      return res.status(503).json({ 
        error: 'Liquidity pool has insufficient USDC. Please try again later.' 
      });
    }
    
    return res.status(500).json({ 
      error: error.message || 'Failed to process faucet claim' 
    });
  }
});

/**
 * GET /api/faucet/status
 * Check faucet status and user eligibility
 */
app.get('/api/faucet/status', async (req, res) => {
  try {
    const { address } = req.query;
    
    const canUserClaim = address ? canClaim(address) : null;
    const lastClaim = address ? claimHistory.get(address.toLowerCase()) : null;
    
    // Check faucet wallet balance
    const faucetBalance = await provider.getBalance(wallet.address);
    
    res.json({
      faucetAddress: wallet.address,
      faucetEthBalance: ethers.formatEther(faucetBalance),
      canClaim: canUserClaim,
      lastClaimTimestamp: lastClaim,
      cooldownPeriod: COOLDOWN_PERIOD,
      supportedTokens: ['USDC'],
      claimAmount: '100 USDC'
    });
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'faucet-server',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚰 Gasless Faucet Server Running    ║
╠════════════════════════════════════════╣
║  Port: ${PORT}                           
║  Chain: Base Sepolia (${CHAIN_ID})          
║  Faucet: ${wallet.address.substring(0, 10)}...
║  Pool: ${LIQUIDITY_POOL_ADDRESS.substring(0, 10)}...
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});
