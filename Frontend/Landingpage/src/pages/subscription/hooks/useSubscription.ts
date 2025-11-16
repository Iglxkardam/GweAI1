import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import {
  getUserSubscription,
  getUSDCBalance,
  formatUSDC,
  getTimeRemaining,
  PlanType,
  formatExpiryDate,
  getPlanName,
  SUBSCRIPTION_CONTRACT_ADDRESS,
  USDC_TOKEN_ADDRESS,
  SUBSCRIPTION_PLAN_ABI,
  ERC20_ABI,
} from '../services/contractService';

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
  const { address, isConnected } = useAccount();
  
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription data
  const publicClient = usePublicClient();

  const fetchSubscriptionData = async () => {
    if (!address || !isConnected || !publicClient) {
      setSubscription(null);
      setUsdcBalance('0');
      return;
    }

    // Check cache first
    const cached = subscriptionCache.get(address.toLowerCase());
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('[useSubscription] Using cached data for:', address);
      setSubscription(cached.data);
      setUsdcBalance(cached.balance);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useSubscription] Fetching data for address:', address);
      console.log('[useSubscription] Using USDC contract:', await import('../services/contractService').then(m => m.USDC_TOKEN_ADDRESS));
      console.log('[useSubscription] Using publicClient:', publicClient);
      
      // Fetch subscription and balance using wagmi's publicClient
      const [sub, balance] = await Promise.all([
        getUserSubscription(address, publicClient as any),
        getUSDCBalance(address, publicClient as any),
      ]);

      const formattedBalance = formatUSDC(balance);
      setSubscription(sub);
      setUsdcBalance(formattedBalance);
      
      // Cache the result
      subscriptionCache.set(address.toLowerCase(), {
        data: sub,
        balance: formattedBalance,
        timestamp: now,
      });
      
      console.log('[useSubscription] Fetched data:', {
        plan: getPlanName(sub.planType),
        hasAccess: sub.hasAccess,
        isExpired: sub.isExpired,
        balanceRaw: balance.toString(),
        balanceFormatted: formattedBalance,
        balanceNumber: parseFloat(formattedBalance),
      });
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const { writeContractAsync } = useWriteContract();

  // Purchase plan function with Chrome pop-up protection
  const purchasePlan = async (
    planType: PlanType,
    onProgress?: (step: 'approving' | 'approved' | 'purchasing' | 'success' | 'error') => void
  ) => {
    if (!address || !isConnected) {
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
      onProgress?.('approving');
      // Plan prices
      const prices: Record<PlanType, bigint> = {
        [PlanType.FREE]: BigInt(0),
        [PlanType.MONTHLY]: BigInt(2_000000), // $2 with 6 decimals
        [PlanType.YEARLY]: BigInt(20_000000), // $20 with 6 decimals
      };
      const price = prices[planType];
      
      console.log('[useSubscription] 💳 Starting purchase flow for plan:', planType);
      console.log('[useSubscription] 💰 Price:', price.toString(), 'USDC');
      
      // Step 1: Approve USDC spending (First user action)
      console.log('[useSubscription] ⏳ Step 1/2: Requesting USDC approval...');
      console.log('[useSubscription] 👆 Please approve the transaction in your wallet');
      
      const approveHash = await writeContractAsync({
        address: USDC_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`, price],
      });
      
      console.log('[useSubscription] ✅ Approval transaction submitted:', approveHash);
      console.log('[useSubscription] ⏳ Waiting for approval to be mined...');
      
      // Wait for approval confirmation (minimum 2 blocks)
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          confirmations: 1,
        });
        console.log('[useSubscription] ✅ Approval confirmed on-chain');
        onProgress?.('approved');
      } else {
        // Fallback: wait 5 seconds if no publicClient
        await new Promise(resolve => setTimeout(resolve, 5000));
        onProgress?.('approved');
      }
      
      // Small delay to prevent Chrome pop-up blocking (user-initiated flow)
      console.log('[useSubscription] ⏳ Preparing purchase transaction...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Purchase the plan (Second user action)
      onProgress?.('purchasing');
      console.log('[useSubscription] ⏳ Step 2/2: Requesting plan purchase...');
      console.log('[useSubscription] 👆 Please confirm the purchase in your wallet');
      
      const purchaseHash = await writeContractAsync({
        address: SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`,
        abi: SUBSCRIPTION_PLAN_ABI,
        functionName: 'purchasePlan',
        args: [planType],
      });
      
      console.log('[useSubscription] ✅ Purchase transaction submitted:', purchaseHash);
      console.log('[useSubscription] ⏳ Waiting for purchase to be mined...');
      
      // Wait for purchase confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({
          hash: purchaseHash,
          confirmations: 1,
        });
        console.log('[useSubscription] ✅ Purchase confirmed on-chain');
      } else {
        // Fallback: wait 5 seconds if no publicClient
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      console.log('[useSubscription] 🎉 Subscription purchased successfully!');
      onProgress?.('success');
      
      // Clear cache and refresh data
      if (address) {
        subscriptionCache.delete(address.toLowerCase());
      }
      await fetchSubscriptionData();
    } catch (err) {
      console.error('[useSubscription] ❌ Error purchasing subscription:', err);
      onProgress?.('error');
      
      // Handle user rejection gracefully
      if (err instanceof Error) {
        if (err.message.includes('user rejected') || 
            err.message.includes('User rejected') ||
            err.message.includes('user denied') ||
            err.message.includes('User denied')) {
          setError('Transaction cancelled by user');
          console.log('[useSubscription] ℹ️ User cancelled the transaction');
        } else if (err.message.includes('insufficient funds')) {
          setError('Insufficient USDC balance');
          console.log('[useSubscription] ℹ️ Insufficient funds');
        } else if (err.message.includes('Failed to initialize')) {
          setError('Wallet connection issue. Please try reconnecting your wallet.');
          console.log('[useSubscription] ℹ️ Wallet initialization failed - may be Chrome pop-up blocker');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to purchase subscription. Please try again.');
      }
      
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
    refetch: fetchSubscriptionData,
  };
}
