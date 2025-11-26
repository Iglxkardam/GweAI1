/**
 * Vault Service - Handles interactions with VaultStaking contract
 */

import { createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

// Contract addresses
export const VAULT_STAKING_ADDRESS = '0xB156a66521BCB5A903daA42879A3e562E402Fa41'; // VaultStaking - Production Deployment
export const TREASURY_WALLET = '0x39c0b97A8F2194fcd7396296F7697a84dd81077A'; // Receives penalties

// Token addresses on Base Sepolia
export const TOKEN_ADDRESSES: Record<string, string> = {
  'ETH': '0x0000000000000000000000000000000000000000', // Native ETH
  'USDC': '0xBEE08798a3634e29F47e3d277C9d11507D55F66a',
  'BTC': '0x7d9E31f5cCac4b9c8566f343A6bD6f3263DFcC91',
  'SOL': '0x241ECE6Dce0E0825F9992410B3fA5d4b8fC8d199',
  'BNB': '0xAA9Be1a8A7f7254C1759bAa7e0f7864579c33a96',
  'XRP': '0x01E278B5421AAC93A206C15b2933419DA19E17b3',
  'TON': '0xC85D84a1092b81aCBA9bC75fad6063a7DA642E36',
  'AVAX': '0x5DC449E37b6DAAD182d4Fb13C8dFE53C383C2E46',
  'TRON': '0x45442ecB66A1a10c0F9817fb7F2B50a3bB99bd69',
  'CARDANO': '0xcB1A4c81E7a56cbE2246DA3aE256Ba0154940648',
  'DOGE': '0x803aD69f487536Ec1eE8a83Cd329e3d1703f8337'
};

// Token decimals - MUST match actual deployed token contracts
export const TOKEN_DECIMALS: Record<string, number> = {
  'ETH': 18,
  'USDC': 6,
  'BTC': 8,
  'SOL': 9,  // SOL uses 9 decimals (matches deployed contract)
  'BNB': 8,
  'XRP': 8,
  'TON': 8,
  'AVAX': 8,
  'TRON': 8,
  'CARDANO': 8,
  'DOGE': 8
};

// Token-specific APYs (in percentage)
export const TOKEN_APYS: Record<string, number> = {
  'BTC': 10.0,  // Higher APY for BTC
  'SOL': 9.0,   // Medium APY for SOL
  'USDC': 6.0   // Lower APY for stablecoin
};

// VaultStaking ABI (only functions we need)
export const VAULT_STAKING_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "lockDuration", "type": "uint256" }],
    "name": "stakeETH",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "lockDuration", "type": "uint256" }
    ],
    "name": "stakeToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "stakeId", "type": "uint256" }],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "stakeId", "type": "uint256" }],
    "name": "withdrawEarly",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "stakeId", "type": "uint256" }],
    "name": "calculatePenalty",
    "outputs": [
      { "internalType": "uint256", "name": "penalty", "type": "uint256" },
      { "internalType": "uint256", "name": "amountAfterPenalty", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getUserStakes",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "stakeId", "type": "uint256" }],
    "name": "getStake",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "amount", "type": "uint256" },
          { "internalType": "uint256", "name": "lockDate", "type": "uint256" },
          { "internalType": "uint256", "name": "unlockDate", "type": "uint256" },
          { "internalType": "uint256", "name": "lockDuration", "type": "uint256" },
          { "internalType": "uint256", "name": "apy", "type": "uint256" },
          { "internalType": "address", "name": "token", "type": "address" },
          { "internalType": "bool", "name": "withdrawn", "type": "bool" },
          { "internalType": "uint256", "name": "totalYield", "type": "uint256" }
        ],
        "internalType": "struct VaultStaking.Stake",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "token", "type": "address" }],
    "name": "getContractBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Legacy LiquidityPool ABI (kept for reference)
export const LIQUIDITY_POOL_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" }
    ],
    "name": "poolBalance",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// ERC20 ABI for approve
export const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

/**
 * Get token address by symbol
 */
export const getTokenAddress = (symbol: string): string => {
  const address = TOKEN_ADDRESSES[symbol.toUpperCase()];
  if (!address) {
    throw new Error(`Token ${symbol} not supported`);
  }
  return address;
};

/**
 * Get token symbol by address
 */
export const getTokenSymbol = (address: string): string => {
  const normalizedAddress = address.toLowerCase();
  for (const [symbol, addr] of Object.entries(TOKEN_ADDRESSES)) {
    if (addr.toLowerCase() === normalizedAddress) {
      return symbol;
    }
  }
  return 'UNKNOWN';
};

/**
 * Get token decimals by symbol
 */
export const getTokenDecimals = (symbol: string): number => {
  const decimals = TOKEN_DECIMALS[symbol.toUpperCase()];
  if (decimals === undefined) {
    throw new Error(`Token ${symbol} decimals not found`);
  }
  return decimals;
};

/**
 * Calculate early withdrawal penalty
 * CRITICAL: Must match VaultStaking contract logic
 * Contract formula (VaultStaking.sol withdrawEarly):
 * - earnedYield = (elapsedTime / totalTime) × totalYield
 * - penalty = totalYield - earnedYield (unearned yield)
 * - amountAfterPenalty = principal - penalty (penalty deducted from principal)
 * 
 * This function is for display/estimation only.
 * NOTE: Takes principal as first parameter now to match contract logic
 */
export const calculateEarlyWithdrawalPenalty = (
  principal: number,
  lockDate: number,
  unlockDate: number,
  totalYield: number,
  currentTime: number = Date.now()
): {
  penalty: number;
  earnedYield: number;
  penaltyPercentage: number;
  amountAfterPenalty: number;
  remainingDays: number;
} => {
  const totalLockTime = unlockDate - lockDate;
  const elapsedTime = currentTime - lockDate;
  const remainingTime = unlockDate - currentTime;
  
  // If already unlocked, no penalty - user gets principal + full yield
  if (remainingTime <= 0) {
    return {
      penalty: 0,
      earnedYield: totalYield,
      penaltyPercentage: 0,
      amountAfterPenalty: principal + totalYield,
      remainingDays: 0
    };
  }
  
  // Calculate earned yield proportionally to time elapsed
  const earnedYield = (elapsedTime / totalLockTime) * totalYield;
  
  // Penalty is the UNEARNED yield (deducted from principal per contract)
  const penalty = totalYield - earnedYield;
  
  // Penalty percentage relative to total yield
  const penaltyPercentage = (penalty / totalYield) * 100;
  
  // User receives: principal MINUS penalty (contract deducts unearned yield from principal)
  const amountAfterPenalty = principal - penalty;
  
  const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
  
  return {
    penalty,
    earnedYield,
    penaltyPercentage,
    amountAfterPenalty,
    remainingDays
  };
};

/**
 * Prepare stake transaction data (approve + deposit)
 * Returns transaction data for AGW wallet
 */
export const prepareStakeTransaction = async (
  token: string,
  amount: number,
  userAddress: string
): Promise<{
  approveData?: {
    to: string;
    data: string;
    value: string;
  };
  depositData: {
    to: string;
    data: string;
    value: string;
  };
}> => {
  // Validate token is supported (only BTC, SOL, USDC)
  const supportedTokens = ['BTC', 'SOL', 'USDC'];
  if (!supportedTokens.includes(token.toUpperCase())) {
    throw new Error(`Token ${token} not supported. Only BTC, SOL, and USDC are allowed.`);
  }
  
  const tokenAddress = getTokenAddress(token);
  const decimals = getTokenDecimals(token);
  const amountInWei = parseUnits(amount.toString(), decimals);
  
  // For ERC20 tokens, need approval first
  // Check current allowance
  try {
    const allowance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [userAddress as `0x${string}`, VAULT_STAKING_ADDRESS as `0x${string}`]
    });
    
    let approveData = undefined;
    
    // If allowance is insufficient, prepare approve transaction
    if (allowance < amountInWei) {
      // Approve function selector: 0x095ea7b3
      const spenderParam = VAULT_STAKING_ADDRESS.toLowerCase().replace('0x', '').padStart(64, '0');
      const amountParam = amountInWei.toString(16).padStart(64, '0');
      const approveCallData = `0x095ea7b3${spenderParam}${amountParam}`;
      
      approveData = {
        to: tokenAddress,
        data: approveCallData,
        value: '0'
      };
    }
    
    // Prepare deposit transaction
    // deposit(address token, uint256 amount)
    const tokenParam = tokenAddress.toLowerCase().replace('0x', '').padStart(64, '0');
    const amountParam = amountInWei.toString(16).padStart(64, '0');
    const depositData = `0x47e7ef24${tokenParam}${amountParam}`;
    
    return {
      approveData,
      depositData: {
        to: VAULT_STAKING_ADDRESS,
        data: depositData,
        value: '0'
      }
    };
  } catch (error) {
    console.error('Error preparing stake transaction:', error);
    throw new Error('Failed to prepare stake transaction');
  }
};

/**
 * Prepare withdraw transaction data
 * Handles both normal and early withdrawal with penalty
 */
export const prepareWithdrawTransaction = (
  token: string,
  amount: number,
  isEarlyWithdraw: boolean = false,
  penaltyAmount: number = 0
): {
  to: string;
  data: string;
  value: string;
  effectiveAmount: number;
} => {
  const tokenAddress = getTokenAddress(token);
  const decimals = getTokenDecimals(token);
  
  // Calculate effective amount after penalty
  const effectiveAmount = isEarlyWithdraw ? amount - penaltyAmount : amount;
  const amountInWei = parseUnits(effectiveAmount.toString(), decimals);
  
  // withdraw(address token, uint256 amount)
  // Function selector: 0xf3fef3a3
  const tokenParam = tokenAddress.toLowerCase().replace('0x', '').padStart(64, '0');
  const amountParam = amountInWei.toString(16).padStart(64, '0');
  const withdrawData = `0xf3fef3a3${tokenParam}${amountParam}`;
  
  return {
    to: VAULT_STAKING_ADDRESS,
    data: withdrawData,
    value: '0',
    effectiveAmount
  };
};

/**
 * Get pool balance for a specific token
 */
export const getPoolBalance = async (token: string): Promise<number> => {
  try {
    const tokenAddress = getTokenAddress(token);
    const decimals = getTokenDecimals(token);
    
    const balance = await publicClient.readContract({
      address: VAULT_STAKING_ADDRESS as `0x${string}`,
      abi: VAULT_STAKING_ABI,
      functionName: 'getContractBalance',
      args: [tokenAddress as `0x${string}`]
    });
    
    return parseFloat(formatUnits(balance, decimals));
  } catch (error) {
    console.error('Error fetching pool balance:', error);
    return 0;
  }
};

/**
 * Validate stake parameters
 */
export const validateStakeParams = (
  token: string,
  amount: number,
  userBalance: number
): { valid: boolean; error?: string } => {
  // Sanitize inputs
  if (typeof amount !== 'number' || !isFinite(amount)) {
    return { valid: false, error: 'Invalid amount format' };
  }
  
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  // Check for reasonable amounts (we use BigInt for conversion, so this is just a sanity check)
  // Allow up to 1 billion tokens (more than enough for any realistic use case)
  if (amount > 1_000_000_000) {
    return { valid: false, error: 'Amount too large (max 1 billion tokens)' };
  }
  
  if (amount > userBalance) {
    return { valid: false, error: 'Insufficient balance' };
  }
  
  // Only allow BTC, SOL, USDC
  const supportedTokens = ['BTC', 'SOL', 'USDC'];
  if (!supportedTokens.includes(token.toUpperCase())) {
    return { valid: false, error: `Token ${token} not supported. Only BTC, SOL, and USDC are allowed.` };
  }
  
  if (!TOKEN_ADDRESSES[token.toUpperCase()]) {
    return { valid: false, error: 'Token address not found' };
  }
  
  return { valid: true };
};

/**
 * Get user's stake IDs from contract
 */
export const getUserStakeIds = async (userAddress: string): Promise<number[]> => {
  try {
    console.log(`🔍 Fetching stakes for user: ${userAddress}`);
    
    const stakeIds = await publicClient.readContract({
      address: VAULT_STAKING_ADDRESS as `0x${string}`,
      abi: VAULT_STAKING_ABI,
      functionName: 'getUserStakes',
      args: [userAddress as `0x${string}`]
    }) as bigint[];
    
    const ids = stakeIds.map(id => Number(id));
    console.log(`✅ Found ${ids.length} stake(s):`, ids);
    
    return ids;
  } catch (error) {
    console.error('❌ Error fetching user stakes:', error);
    return [];
  }
};

/**
 * Get stake details from contract
 */
export const getStakeDetails = async (stakeId: number): Promise<{
  amount: bigint;
  lockDate: bigint;
  unlockDate: bigint;
  lockDuration: bigint;
  apy: bigint;
  token: string;
  withdrawn: boolean;
  totalYield: bigint;
} | null> => {
  try {
    console.log(`📖 Fetching stake details for stakeId: ${stakeId}`);
    
    const stake = await publicClient.readContract({
      address: VAULT_STAKING_ADDRESS as `0x${string}`,
      abi: VAULT_STAKING_ABI,
      functionName: 'getStake',
      args: [BigInt(stakeId)]
    }) as any;
    
    console.log(`✅ Stake ${stakeId} details:`, stake);
    
    // Handle both tuple array format [amount, lockDate, ...] and object format {amount, lockDate, ...}
    if (Array.isArray(stake)) {
      return {
        amount: stake[0],
        lockDate: stake[1],
        unlockDate: stake[2],
        lockDuration: stake[3],
        apy: stake[4],
        token: stake[5],
        withdrawn: stake[6],
        totalYield: stake[7]
      };
    }
    
    return stake;
  } catch (error) {
    console.error(`❌ Error fetching stake ${stakeId} details:`, error);
    return null;
  }
};

/**
 * Calculate penalty from contract
 */
export const getContractPenalty = async (stakeId: number): Promise<{
  penalty: bigint;
  amountAfterPenalty: bigint;
} | null> => {
  try {
    const result = await publicClient.readContract({
      address: VAULT_STAKING_ADDRESS as `0x${string}`,
      abi: VAULT_STAKING_ABI,
      functionName: 'calculatePenalty',
      args: [BigInt(stakeId)]
    });
    
    return {
      penalty: result[0],
      amountAfterPenalty: result[1]
    };
  } catch (error) {
    console.error('Error calculating penalty:', error);
    return null;
  }
};
