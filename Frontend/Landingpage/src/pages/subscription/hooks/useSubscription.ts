import { useState, useEffect, useRef } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { encodeFunctionData } from 'viem';
import {
  getTimeRemaining,
  PlanType,
  formatExpiryDate,
  getPlanName,
  SUBSCRIPTION_CONTRACT_ADDRESS,
  USDC_TOKEN_ADDRESS,
  ERC20_ABI,
} from '../services/contractService';
import { logError } from '../../../utils/errorHandler';
import { showErrorToast } from '../../../utils/toastHelper';
import { validateTransaction, logSecurityEvent } from '../../../config/contracts';

interface SubscriptionData {
  planType: PlanType;
  expiryTimestamp: bigint;
  hasAccess: boolean;
  isExpired: boolean;
}

interface UseSubscriptionReturn {
  // Wallet connection
  isConnected: boolean;
  address: string | undefined;
  
  // Subscription status
  subscription: SubscriptionData | null;
  planName: string;
  expiryFormatted: string;
  timeRemaining: string;
  hasAccess: boolean;
  
  // Balance
  usdcBalance: string;
  
  // Actions
  purchasePlan: (
    planType: PlanType,
    onProgress?: (step: 'approving' | 'approved' | 'purchasing' | 'success' | 'error') => void
  ) => Promise<void>;
  
  // Loading and error states
  isLoading: boolean;
  isPurchasing: boolean;
  error: string | null;
  
  // Refresh function
  refetch: () => Promise<void>;
}

// Cache for subscription data per address
const subscriptionCache = new Map<string, {
  data: SubscriptionData;
  balance: string;
  timestamp: number;
}>();

const CACHE_DURATION = 30000; // 30 seconds

export function useSubscription(): UseSubscriptionReturn {
  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address;
  const isConnected = !!primaryWallet;
  
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // OPTIMIZATION: Cache wallet client for instant popup
  const walletClientRef = useRef<any>(null);
  
  // Preload wallet client on mount
  useEffect(() => {
    if (primaryWallet) {
      (primaryWallet as any).getWalletClient?.().then((client: any) => {
        if (client) {
          walletClientRef.current = client;
          console.log('[useSubscription] ✅ Wallet client preloaded');
        }
      }).catch(() => {});
    }
    return () => { walletClientRef.current = null; };
  }, [primaryWallet]);

  const fetchSubscriptionData = async (forceRefresh = false) => {
    if (!address || !isConnected || !primaryWallet) {
      setSubscription(null);
      setUsdcBalance('0');
      return;
    }

    // Check cache first (unless force refresh)
    const cached = subscriptionCache.get(address.toLowerCase());
    const now = Date.now();
    
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('[useSubscription] Using cached data for:', address);
      setSubscription(cached.data);
      setUsdcBalance(cached.balance);
      setIsLoading(false);
      return;
    }

    console.log('[useSubscription] 🔄 Fetching fresh data (forceRefresh:', forceRefresh, ')');
    setIsLoading(true);
    setError(null);

    try {
      console.log('[useSubscription] Fetching data for address:', address);
      const provider = await (primaryWallet as any).getWalletClient?.();
      
      // Fetch USDC balance
      const usdcBalanceData = await provider.request({
        method: 'eth_call',
        params: [
          {
            to: USDC_TOKEN_ADDRESS,
            data: `0x70a08231000000000000000000000000${address.slice(2)}`, // balanceOf(address)
          },
          'latest',
        ],
      });
      const usdcBal = BigInt(usdcBalanceData as string);
      const formattedBalance = (Number(usdcBal) / 1e6).toString(); // USDC has 6 decimals
      
      console.log('[useSubscription] 💰 USDC Balance:', {
        raw: usdcBal.toString(),
        formatted: formattedBalance,
        address: address
      });
      
      // Set balance first (it's working)
      setUsdcBalance(formattedBalance);
      
      let sub: SubscriptionData;
      
      try {
        // Use getWalletClient to get proper viem client for read operations
        const walletClient = await (primaryWallet as any).getWalletClient?.();
        
        if (!walletClient) {
          throw new Error('Could not get wallet client');
        }
        
        // Use viem's readContract for proper contract reading
        console.log('[useSubscription] 📖 Reading subscription from contract...');
        console.log('[useSubscription] 📍 Contract:', SUBSCRIPTION_CONTRACT_ADDRESS);
        console.log('[useSubscription] 📍 User:', address);
        
        // Import needed for proper type handling
        const { readContract } = await import('viem/actions');
        const { SUBSCRIPTION_PLAN_ABI } = await import('../services/contractService');
        
        const result = await readContract(walletClient, {
          address: SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`,
          abi: SUBSCRIPTION_PLAN_ABI,
          functionName: 'getSubscription',
          args: [address as `0x${string}`],
        }) as [number, bigint, boolean, boolean];
        
        console.log('[useSubscription] 📊 Raw contract result:', result);
        
        // Result is array: [planType, expiryTimestamp, hasAccess, isExpired]
        sub = {
          planType: Number(result[0]) as PlanType,
          expiryTimestamp: result[1] as bigint,
          hasAccess: result[2] as boolean,
          isExpired: result[3] as boolean,
        };
        
        console.log('[useSubscription] ✅ Subscription data fetched successfully');
        console.log('[useSubscription] 📦 Decoded:', {
          plan: getPlanName(sub.planType),
          expiry: sub.expiryTimestamp.toString(),
          hasAccess: sub.hasAccess,
          isExpired: sub.isExpired,
        });
      } catch (contractErr) {
        console.warn('[useSubscription] ⚠️ Contract call failed, using FREE plan defaults:', contractErr);
        // Contract call failed - use default FREE plan
        sub = {
          planType: PlanType.FREE,
          expiryTimestamp: BigInt(0),
          hasAccess: false,
          isExpired: true,
        };
      }

      setSubscription(sub);
      
      // Cache the result
      subscriptionCache.set(address.toLowerCase(), {
        data: sub,
        balance: formattedBalance,
        timestamp: Number(now),
      });
      
      console.log('[useSubscription] Fetched data:', {
        plan: getPlanName(sub.planType),
        hasAccess: sub.hasAccess,
        isExpired: sub.isExpired,
        balance: formattedBalance,
      });
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      console.warn('⚠️ Contract call failed - using default values. Balance still fetched successfully.');
      
      // Don't set error message - just use defaults for subscription
      // Keep the balance that was successfully fetched
      setSubscription({
        planType: PlanType.FREE,
        expiryTimestamp: BigInt(0),
        hasAccess: false,
        isExpired: true,
      });
      
      // Only reset balance if it wasn't set (meaning USDC fetch also failed)
      if (!usdcBalance || usdcBalance === '0') {
        setUsdcBalance('0');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Purchase plan function using Dynamic
  const purchasePlan = async (
    planType: PlanType,
    onProgress?: (step: 'approving' | 'approved' | 'purchasing' | 'success' | 'error') => void
  ) => {
    if (!address || !isConnected || !primaryWallet) {
      setError('Please connect your wallet');
      onProgress?.('error');
      return;
    }

    if (planType === PlanType.FREE) {
      setError('Cannot purchase free plan');
      onProgress?.('error');
      return;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      // OPTIMIZATION: Use cached wallet client or fetch
      console.log('[useSubscription] 🔄 Getting wallet client...');
      let walletClient = walletClientRef.current;
      
      if (!walletClient) {
        console.log('[useSubscription] ⚡ Fetching wallet client (not cached)...');
        walletClient = await (primaryWallet as any).getWalletClient?.();
        if (walletClient) {
          walletClientRef.current = walletClient;
          console.log('[useSubscription] ✅ Wallet client cached for future use');
        }
      } else {
        console.log('[useSubscription] ✅ Using cached wallet client (instant)');
      }
      
      if (!walletClient) {
        throw new Error('Could not get wallet client - please try reconnecting your wallet');
      }
      
      // Check current subscription state first
      console.log('[useSubscription] 🔍 Checking current subscription state...');
      const { readContract: readContractAction } = await import('viem/actions');
      const contractService = await import('../services/contractService');
      
      const currentSub: any = await readContractAction(walletClient, {
        address: SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`,
        abi: contractService.SUBSCRIPTION_PLAN_ABI,
        functionName: 'getSubscription',
        args: [address as `0x${string}`],
      });
      
      const currentPlanType = Number(currentSub[0]);
      const currentExpiry = currentSub[1] as bigint;
      const currentHasAccess = currentSub[2] as boolean;
      
      console.log('[useSubscription] 📊 Current subscription:', {
        planType: currentPlanType,
        expiry: currentExpiry.toString(),
        hasAccess: currentHasAccess,
      });
      
      // Check for corrupted state: non-FREE plan with 0 expiry
      if (currentPlanType !== 0 && currentExpiry === 0n) {
        console.error('[useSubscription] ❌ Subscription in corrupted state!');
        throw new Error('Your subscription is in an invalid state. Please contact support or try again later.');
      }
      
      // Plan prices
      const prices: Record<PlanType, bigint> = {
        [PlanType.FREE]: BigInt(0),
        [PlanType.MONTHLY]: BigInt(2_000000), // $2 with 6 decimals
        [PlanType.YEARLY]: BigInt(20_000000), // $20 with 6 decimals
      };
      const price = prices[planType];
      
      console.log('[useSubscription] 💳 Starting purchase flow for plan:', planType);
      console.log('[useSubscription] 💰 Price:', price.toString(), 'USDC');
      
      // SECURITY: Validate subscription contract before transaction
      const validation = await validateTransaction({
        contractAddress: SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`,
        contractType: 'SUBSCRIPTION',
        userAddress: address as `0x${string}`,
      });
      
      if (!validation.valid) {
        logSecurityEvent({
          type: 'ERROR',
          details: validation.error || 'Subscription contract validation failed',
          address: SUBSCRIPTION_CONTRACT_ADDRESS,
        });
        throw new Error(validation.error || 'Contract validation failed');
      }
      
      logSecurityEvent({
        type: 'CONTRACT_CALL',
        details: `Subscription purchase initiated - Plan: ${planType}`,
        address: SUBSCRIPTION_CONTRACT_ADDRESS,
      });
      
      onProgress?.('approving');
      
      // Step 1: Approve USDC spending using viem's encodeFunctionData
      console.log('[useSubscription] ⏳ Step 1/2: Requesting USDC approval...');
      console.log('[useSubscription] 📍 USDC Address:', USDC_TOKEN_ADDRESS);
      console.log('[useSubscription] 📍 Spender (Subscription):', SUBSCRIPTION_CONTRACT_ADDRESS);
      console.log('[useSubscription] 💰 Amount to approve:', price.toString());
      console.log('[useSubscription] 📍 User address:', address);
      
      // Check current allowance first
      console.log('[useSubscription] 🔍 Checking current allowance before approval...');
      const checkAllowanceData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address as `0x${string}`, SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`],
      });
      
      const currentAllowanceResult = await walletClient.request({
        method: 'eth_call',
        params: [
          {
            to: USDC_TOKEN_ADDRESS,
            data: checkAllowanceData,
          },
          'latest',
        ],
      });
      
      const currentAllowance = BigInt(currentAllowanceResult as string);
      console.log('[useSubscription] 📊 Current allowance BEFORE approval:', currentAllowance.toString());
      
      if (currentAllowance >= price) {
        console.log('[useSubscription] ✅ Sufficient allowance already exists! Skipping approval...');
        onProgress?.('approved');
      } else {
        console.log('[useSubscription] ⚠️  Need to approve:', (price - currentAllowance).toString(), 'more USDC');
        
        // Use viem to properly encode the approve function call
        const approveData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [SUBSCRIPTION_CONTRACT_ADDRESS, price],
        });
        
        console.log('[useSubscription] 📝 Encoded approve data:', approveData);
        
        try {
          const approveHash = await walletClient.sendTransaction({
            to: USDC_TOKEN_ADDRESS as `0x${string}`,
            data: approveData,
            gas: BigInt(90000),
          });
          
          console.log('[useSubscription] ✅ Approval transaction submitted:', approveHash);
          console.log('[useSubscription] 🔍 Approve tx:', `https://sepolia.basescan.org/tx/${approveHash}`);
          
          // Wait for approval transaction receipt
          console.log('[useSubscription] ⏳ Waiting for approval to be mined...');
          const { waitForTransactionReceipt: waitForReceipt } = await import('viem/actions');
          
          const approveReceipt = await waitForReceipt(walletClient, {
            hash: approveHash,
            timeout: 60_000,
          });
          
          console.log('[useSubscription] 📝 Approval receipt:', {
            status: approveReceipt.status,
            blockNumber: approveReceipt.blockNumber.toString(),
          });
          
          if (approveReceipt.status === 'reverted') {
            throw new Error('Approval transaction was reverted!');
          }
          
          console.log('[useSubscription] ✅ Approval confirmed on chain!');
          
          onProgress?.('approved');
        } catch (approveErr: any) {
          console.error('[useSubscription] ❌ Approval failed:', approveErr);
          throw new Error(`Approval failed: ${approveErr.message}`);
        }
      }
      
      onProgress?.('approved');
      
      // Step 2: Purchase the plan - manually encode to avoid ABI issues
      onProgress?.('purchasing');
      console.log('[useSubscription] ⏳ Step 2/2: Requesting plan purchase...');
      console.log('[useSubscription] 📍 Subscription Contract:', SUBSCRIPTION_CONTRACT_ADDRESS);
      console.log('[useSubscription] 📦 Plan Type:', planType);
      
      // Manually encode purchasePlan(uint8) - selector: 0x98693010
      const planTypeHex = planType.toString(16).padStart(64, '0');
      const purchaseData = `0x98693010${planTypeHex}`;
      
      console.log('[useSubscription] 📝 Encoded purchase data:', purchaseData);
      console.log('[useSubscription] 📍 Sending from address:', address);
      console.log('[useSubscription] 📍 WalletClient account:', walletClient.account?.address);
      
      const purchaseHash = await walletClient.sendTransaction({
        to: SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`,
        from: address as `0x${string}`,  // Explicitly set from address
        data: purchaseData as `0x${string}`,
        gas: BigInt(200000),
      });
      
      console.log('[useSubscription] ✅ Purchase transaction submitted:', purchaseHash);
      console.log('[useSubscription] 🔍 Transaction hash:', `https://sepolia.basescan.org/tx/${purchaseHash}`);
      
      // Wait for transaction receipt to verify it was actually mined successfully
      console.log('[useSubscription] ⏳ Waiting for transaction receipt...');
      const { waitForTransactionReceipt } = await import('viem/actions');
      
      try {
        const receipt = await waitForTransactionReceipt(walletClient, {
          hash: purchaseHash,
          timeout: 60_000, // 60 seconds timeout
        });
        
        console.log('[useSubscription] 📝 Transaction receipt:', {
          status: receipt.status,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          logs: receipt.logs.length,
        });
        
        if (receipt.status === 'reverted') {
          console.error('[useSubscription] ❌ Transaction reverted!');
          throw new Error('Purchase transaction was reverted by the contract. Check your USDC balance and allowance.');
        }
        
        if (receipt.logs.length === 0) {
          console.error('[useSubscription] ❌ No events emitted - transaction likely reverted internally');
          throw new Error('Transaction succeeded but no events emitted. Contract call may have failed.');
        }
        
        console.log('[useSubscription] ✅ Transaction confirmed on chain!');
        
      } catch (receiptErr: any) {
        console.error('[useSubscription] ❌ Error waiting for receipt:', receiptErr);
        throw new Error(`Transaction failed: ${receiptErr.message}`);
      }
      
      console.log('[useSubscription] 🎉 Subscription purchased successfully!');
      onProgress?.('success');
      
      // Clear cache and refresh data
      if (address) {
        subscriptionCache.delete(address.toLowerCase());
      }
      await fetchSubscriptionData();
    } catch (err: any) {
      logError('PurchaseSubscription', err);
      
      console.error('[useSubscription] ❌ Error purchasing subscription:', err);
      onProgress?.('error');
      
      setError(err.message || 'Failed to purchase subscription');
      
      // Show user-friendly toast
      showErrorToast(err);
      
      throw err;
      
      throw err;
    } finally {
      setIsPurchasing(false);
    }
  };

  // Fetch on mount and when address changes
  useEffect(() => {
    if (address && isConnected) {
      fetchSubscriptionData();
    }
  }, [address, isConnected]);

  // Calculate derived values
  const planName = subscription ? getPlanName(subscription.planType) : 'No Plan';
  const expiryFormatted = subscription ? formatExpiryDate(subscription.expiryTimestamp) : '';
  const timeRemaining = subscription ? getTimeRemaining(subscription.expiryTimestamp) : '';
  const hasAccess = subscription?.hasAccess || false;

  return {
    isConnected,
    address,
    subscription,
    planName,
    expiryFormatted,
    timeRemaining,
    hasAccess,
    usdcBalance,
    purchasePlan,
    isLoading,
    isPurchasing,
    error,
    refetch: () => fetchSubscriptionData(true), // Force refresh when manually called
  };
}
