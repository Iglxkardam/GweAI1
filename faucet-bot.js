/**
 * Faucet Bot - Monitors claim requests and processes them automatically
 * Listens to Faucet contract events and sends tokens to users
 */

const { ethers } = require('ethers');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const FAUCET_CONTRACT_ADDRESS = process.env.FAUCET_CONTRACT_ADDRESS;
const USDC_ADDRESS = process.env.USDC_CONTRACT_ADDRESS || '0xBEE08798a3634e29F47e3d277C9d11507D55F66a';
const RPC_URL = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
const CHAIN_ID = 84532;
const PORT = process.env.BOT_PORT || 3003;

// Faucet Contract ABI
const FAUCET_ABI = [
  'function claim() external',
  'function claimFor(address beneficiary) external',
  'function canClaim(address user) public view returns (bool)',
  'function timeUntilNextClaim(address user) public view returns (uint256)',
  'function getUserInfo(address user) external view returns (bool, uint256, uint256, uint256)',
  'function getStats() external view returns (uint256, uint256, uint256, uint256, uint256)',
  'event Claimed(address indexed user, uint256 ethAmount, uint256 usdcAmount, uint256 timestamp)'
];

// Initialize provider and wallet
let provider;
let wallet;
let faucetContract;

async function initialize() {
  try {
    console.log('🚀 Initializing Faucet Bot...');
    
    provider = new ethers.JsonRpcProvider(RPC_URL);
    
    if (!process.env.PRIVATE_KEY) {
      console.error('❌ PRIVATE_KEY not set in .env');
      process.exit(1);
    }
    
    if (!FAUCET_CONTRACT_ADDRESS) {
      console.error('❌ FAUCET_CONTRACT_ADDRESS not set in .env');
      process.exit(1);
    }
    
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    faucetContract = new ethers.Contract(FAUCET_CONTRACT_ADDRESS, FAUCET_ABI, wallet);
    
    console.log('✅ Bot wallet:', wallet.address);
    console.log('✅ Faucet contract:', FAUCET_CONTRACT_ADDRESS);
    
    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Bot ETH balance:', ethers.formatEther(balance));
    
    // Start event listener
    startEventListener();
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

/**
 * Listen to faucet events and process claims
 * NOTE: Disabled to prevent RPC filter errors on public endpoints
 */
function startEventListener() {
  console.log('✅ Event listening disabled (prevents RPC errors)');
  console.log('💡 Claims will be logged via API endpoint responses');
  
  // Event listening disabled due to Base Sepolia RPC filter limitations
  // The API endpoint works perfectly without event listening
}

/**
 * API: Request claim (bot processes it)
 */
app.post('/api/faucet/request-claim', async (req, res) => {
  try {
    const { address } = req.body;
    
    // Validate address
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 NEW CLAIM REQUEST');
    console.log(`👤 Address: ${address}`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    
    // Check if user can claim
    const canClaim = await faucetContract.canClaim(address);
    if (!canClaim) {
      const timeUntilNext = await faucetContract.timeUntilNextClaim(address);
      const hoursLeft = Math.ceil(Number(timeUntilNext) / 3600);
      return res.status(429).json({ 
        error: `Already claimed. Try again in ${hoursLeft} hours`,
        timeRemaining: Number(timeUntilNext)
      });
    }
    
    // Get faucet stats to check if sufficient balance
    const stats = await faucetContract.getStats();
    const ethBalance = stats[0];
    const usdcBalance = stats[1];
    
    console.log('💰 Faucet balances:');
    console.log('   ETH:', ethers.formatEther(ethBalance));
    console.log('   USDC:', ethers.formatUnits(usdcBalance, 6));
    
    if (ethBalance < ethers.parseEther('0.001')) {
      return res.status(503).json({ 
        error: 'Faucet has insufficient ETH. Please try again later.' 
      });
    }
    
    if (usdcBalance < ethers.parseUnits('100', 6)) {
      return res.status(503).json({ 
        error: 'Faucet has insufficient USDC. Please try again later.' 
      });
    }
    
    // Process claim (bot calls contract on behalf of user)
    console.log(`⚡ Processing claim for ${address}...`);
    
    // Bot calls claimFor(address) to send tokens to the user
    const tx = await faucetContract.claimFor(address, { 
      gasLimit: 300000
    });
    
    console.log('📤 Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ CLAIM SUCCESSFUL!');
      console.log('💵 Sent: 100 USDC + 0.001 ETH');
      console.log(`🔗 TX: ${tx.hash}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Get claim event details
      const claimEvent = receipt.logs
        .map(log => {
          try {
            return faucetContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(event => event && event.name === 'Claimed');
      
      return res.json({
        success: true,
        txHash: tx.hash,
        ethAmount: '0.001',
        usdcAmount: '100',
        recipient: address,
        blockNumber: receipt.blockNumber
      });
    } else {
      throw new Error('Transaction failed');
    }
    
  } catch (error) {
    console.error('\n❌ CLAIM FAILED');
    console.error('Error:', error.message);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (error.message.includes('Already claimed')) {
      return res.status(429).json({ 
        error: 'Already claimed. Please wait for cooldown period.' 
      });
    }
    
    return res.status(500).json({ 
      error: error.message || 'Failed to process claim' 
    });
  }
});

/**
 * API: Check claim status
 */
app.get('/api/faucet/status', async (req, res) => {
  try {
    const { address } = req.query;
    
    const [ethBalance, usdcBalance, totalClaimants, totalEthDistributed, totalUsdcDistributed] = 
      await faucetContract.getStats();
    
    let userInfo = null;
    if (address && ethers.isAddress(address)) {
      const info = await faucetContract.getUserInfo(address);
      userInfo = {
        canClaim: info[0],
        timeUntilNextClaim: Number(info[1]),
        lastClaimTime: Number(info[2]),
        totalClaims: Number(info[3])
      };
    }
    
    res.json({
      faucetAddress: FAUCET_CONTRACT_ADDRESS,
      ethBalance: ethers.formatEther(ethBalance),
      usdcBalance: ethers.formatUnits(usdcBalance, 6),
      totalClaimants: Number(totalClaimants),
      totalEthDistributed: ethers.formatEther(totalEthDistributed),
      totalUsdcDistributed: ethers.formatUnits(totalUsdcDistributed, 6),
      userInfo
    });
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'faucet-bot',
    timestamp: new Date().toISOString()
  });
});

// Start bot
initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║      🤖 Faucet Bot Running            ║
╠════════════════════════════════════════╣
║  Port: ${PORT}
║  Chain: Base Sepolia (${CHAIN_ID})
║  Bot: ${wallet.address.substring(0, 10)}...
║  Faucet: ${FAUCET_CONTRACT_ADDRESS.substring(0, 10)}...
╚════════════════════════════════════════╝
    `);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down...');
  process.exit(0);
});
