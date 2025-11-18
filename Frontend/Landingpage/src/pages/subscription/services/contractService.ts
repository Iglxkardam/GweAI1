import { ethers } from 'ethers';
import type { PublicClient, WalletClient } from 'viem';

// Deployed contract address on Base Sepolia (NEW TREASURY)
export const SUBSCRIPTION_CONTRACT_ADDRESS = '0xcFbdEaba321700A9C125b41dB6bBd6BBBA752287';

// USDC token address on Base Sepolia (MockUSDC - VERIFIED)
export const USDC_TOKEN_ADDRESS = '0xBEE08798a3634e29F47e3d277C9d11507D55F66a';

// Plan Types enum matching the contract
export enum PlanType {
  FREE = 0,
  MONTHLY = 1,
  YEARLY = 2,
}

// Subscription Plan ABI from the deployed contract
export const SUBSCRIPTION_PLAN_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_usdcToken", "type": "address" },
      { "internalType": "address", "name": "_treasury", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "AccessRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "OwnerSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "enum SubscriptionPlan.PlanType", "name": "previousPlan", "type": "uint8" }
    ],
    "name": "PlanExpired",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "enum SubscriptionPlan.PlanType", "name": "planType", "type": "uint8" },
      { "indexed": false, "internalType": "uint256", "name": "expiryTimestamp", "type": "uint256" }
    ],
    "name": "PlanPurchased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "enum SubscriptionPlan.PlanType", "name": "planType", "type": "uint8" },
      { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "duration", "type": "uint256" }
    ],
    "name": "PlanUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "newTreasury", "type": "address" }
    ],
    "name": "TreasuryUpdated",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "checkAccess",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getOwner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "enum SubscriptionPlan.PlanType", "name": "planType", "type": "uint8" }
    ],
    "name": "getPlanDetails",
    "outputs": [
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" },
      { "internalType": "bool", "name": "isActive", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getSubscription",
    "outputs": [
      { "internalType": "enum SubscriptionPlan.PlanType", "name": "planType", "type": "uint8" },
      { "internalType": "uint256", "name": "expiryTimestamp", "type": "uint256" },
      { "internalType": "bool", "name": "hasAccess", "type": "bool" },
      { "internalType": "bool", "name": "isExpired", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "enum SubscriptionPlan.PlanType", "name": "planType", "type": "uint8" }
    ],
    "name": "purchasePlan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "revokeExpiredAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "setOwner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasury",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdcToken",
    "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// ERC20 ABI for USDC token approval
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
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

/**
 * Get contract instance with signer or provider
 */
export const getSubscriptionContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(
    SUBSCRIPTION_CONTRACT_ADDRESS,
    SUBSCRIPTION_PLAN_ABI,
    signerOrProvider
  );
};

/**
 * Get USDC token contract instance
 */
export const getUSDCContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(
    USDC_TOKEN_ADDRESS,
    ERC20_ABI,
    signerOrProvider
  );
};

/**
 * Get user's subscription details (supports both ethers Provider and viem PublicClient)
 */
export const getUserSubscription = async (
  userAddress: string,
  provider: ethers.Provider | PublicClient
): Promise<{
  planType: PlanType;
  expiryTimestamp: bigint;
  hasAccess: boolean;
  isExpired: boolean;
}> => {
  // Check if it's a viem PublicClient
  if ('readContract' in provider) {
    const publicClient = provider as PublicClient;
    
    // Log which USDC address the contract is using
    try {
      const contractUsdcAddress: any = await publicClient.readContract({
        address: SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`,
        abi: SUBSCRIPTION_PLAN_ABI,
        functionName: 'usdcToken',
        args: [],
      });
      console.log('[contractService] Contract configured USDC:', contractUsdcAddress);
      console.log('[contractService] Frontend using USDC:', USDC_TOKEN_ADDRESS);
      if (contractUsdcAddress.toLowerCase() !== USDC_TOKEN_ADDRESS.toLowerCase()) {
        console.warn('[contractService] ⚠️ USDC ADDRESS MISMATCH! Contract expects:', contractUsdcAddress);
      }
    } catch (err) {
      console.error('[contractService] Could not read contract USDC address:', err);
    }
    
    const result: any = await publicClient.readContract({
      address: SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`,
      abi: SUBSCRIPTION_PLAN_ABI,
      functionName: 'getSubscription',
      args: [userAddress as `0x${string}`],
    });
    
    return {
      planType: Number(result[0]) as PlanType,
      expiryTimestamp: result[1] as bigint,
      hasAccess: result[2] as boolean,
      isExpired: result[3] as boolean,
    };
  }
  
  // Fallback to ethers
  const contract = getSubscriptionContract(provider as ethers.Provider);
  const result = await contract.getSubscription(userAddress);
  
  return {
    planType: Number(result.planType) as PlanType,
    expiryTimestamp: result.expiryTimestamp,
    hasAccess: result.hasAccess,
    isExpired: result.isExpired,
  };
};

/**
 * Check if user has access to DCA features
 */
export const checkUserAccess = async (
  userAddress: string,
  provider: ethers.Provider
): Promise<boolean> => {
  const contract = getSubscriptionContract(provider);
  return await contract.checkAccess(userAddress);
};

/**
 * Get plan details
 */
export const getPlanDetails = async (
  planType: PlanType,
  provider: ethers.Provider
): Promise<{
  price: bigint;
  duration: bigint;
  isActive: boolean;
}> => {
  const contract = getSubscriptionContract(provider);
  const result = await contract.getPlanDetails(planType);
  
  return {
    price: result.price,
    duration: result.duration,
    isActive: result.isActive,
  };
};

/**
 * Purchase a subscription plan (supports both ethers Signer and viem WalletClient)
 */
export const purchaseSubscription = async (
  planType: PlanType,
  signer: ethers.Signer | WalletClient
): Promise<any> => {
  // Check if it's a viem WalletClient
  if ('writeContract' in signer && 'account' in signer) {
    const walletClient = signer as WalletClient;
    
    // Get plan price first using publicClient (we'll use a read call)
    // For now, use hardcoded prices to avoid needing publicClient
    const prices: Record<PlanType, bigint> = {
      [PlanType.FREE]: BigInt(0),
      [PlanType.MONTHLY]: BigInt(2_000000), // $2 with 6 decimals
      [PlanType.YEARLY]: BigInt(20_000000), // $20 with 6 decimals
    };
    const price = prices[planType];
    
    console.log('[contractService] Approving USDC:', price.toString());
    
    // Approve USDC spending first
    const approveHash = await walletClient.writeContract({
      address: USDC_TOKEN_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`, price],
      account: walletClient.account!,
      chain: walletClient.chain,
    });
    
    console.log('[contractService] Approve tx hash:', approveHash);
    
    // Wait a bit for approval to be mined
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('[contractService] Purchasing plan:', planType);
    
    // Purchase the plan
    const purchaseHash = await walletClient.writeContract({
      address: SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`,
      abi: SUBSCRIPTION_PLAN_ABI,
      functionName: 'purchasePlan',
      args: [planType],
      account: walletClient.account!,
      chain: walletClient.chain,
    });
    
    console.log('[contractService] Purchase tx hash:', purchaseHash);
    
    return { 
      hash: purchaseHash,
      wait: async () => ({ hash: purchaseHash })
    };
  }
  
  // Fallback to ethers
  const contract = getSubscriptionContract(signer as ethers.Signer);
  
  // Get plan price first
  const planDetails = await contract.getPlanDetails(planType);
  const price = planDetails.price;
  
  // Approve USDC spending first
  const usdcContract = getUSDCContract(signer as ethers.Signer);
  const approveTx = await usdcContract.approve(SUBSCRIPTION_CONTRACT_ADDRESS, price);
  await approveTx.wait();
  
  // Purchase the plan
  const purchaseTx = await contract.purchasePlan(planType);
  return purchaseTx;
};

/**
 * Check USDC balance (supports both ethers Provider and viem PublicClient)
 */
export const getUSDCBalance = async (
  userAddress: string,
  provider: ethers.Provider | PublicClient
): Promise<bigint> => {
  // Check if it's a viem PublicClient
  if ('readContract' in provider) {
    const publicClient = provider as PublicClient;
    console.log('[contractService] Using viem publicClient for USDC balance');
    console.log('[contractService] User address:', userAddress);
    console.log('[contractService] USDC contract:', USDC_TOKEN_ADDRESS);
    
    try {
      // First verify the contract has code
      const code = await publicClient.getBytecode({
        address: USDC_TOKEN_ADDRESS as `0x${string}`,
      });
      console.log('[contractService] USDC contract bytecode length:', code ? code.length : 0);
      
      if (!code || code === '0x') {
        console.error('[contractService] USDC contract has no code! Address may be wrong.');
        return BigInt(0);
      }
      
      const balance: any = await publicClient.readContract({
        address: USDC_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
      });
      
      console.log('[contractService] Raw USDC balance:', balance.toString());
      
      return balance as bigint;
    } catch (error) {
      console.error('[contractService] Error reading USDC balance:', error);
      return BigInt(0);
    }
  }
  
  // Fallback to ethers
  const usdcContract = getUSDCContract(provider as ethers.Provider);
  return await usdcContract.balanceOf(userAddress);
};

/**
 * Check USDC allowance
 */
export const getUSDCAllowance = async (
  userAddress: string,
  provider: ethers.Provider
): Promise<bigint> => {
  const usdcContract = getUSDCContract(provider);
  return await usdcContract.allowance(userAddress, SUBSCRIPTION_CONTRACT_ADDRESS);
};

/**
 * Approve USDC spending
 */
export const approveUSDC = async (
  amount: bigint,
  signer: ethers.Signer
): Promise<ethers.ContractTransactionResponse> => {
  const usdcContract = getUSDCContract(signer);
  return await usdcContract.approve(SUBSCRIPTION_CONTRACT_ADDRESS, amount);
};

/**
 * Format USDC amount (6 decimals)
 */
export const formatUSDC = (amount: bigint): string => {
  return ethers.formatUnits(amount, 6);
};

/**
 * Parse USDC amount (6 decimals)
 */
export const parseUSDC = (amount: string): bigint => {
  return ethers.parseUnits(amount, 6);
};

/**
 * Get plan name from enum
 */
export const getPlanName = (planType: PlanType): string => {
  switch (planType) {
    case PlanType.FREE:
      return 'Free';
    case PlanType.MONTHLY:
      return 'Monthly';
    case PlanType.YEARLY:
      return 'Yearly';
    default:
      return 'Unknown';
  }
};

/**
 * Format expiry timestamp
 */
export const formatExpiryDate = (timestamp: bigint): string => {
  if (timestamp === 0n) return 'Never expires';
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Get time remaining until expiry
 */
export const getTimeRemaining = (expiryTimestamp: bigint): string => {
  if (expiryTimestamp === 0n) return 'Never expires';
  
  const now = Math.floor(Date.now() / 1000);
  const remaining = Number(expiryTimestamp) - now;
  
  if (remaining <= 0) return 'Expired';
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  }
  return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
};
