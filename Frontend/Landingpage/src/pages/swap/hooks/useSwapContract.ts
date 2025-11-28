/**
 * Swap Contract Hook - Router Integration
 * Handles token-to-token swaps via AMM Router
 * OPTIMIZED: Fast gas, optimized approvals, error handling
 * SECURITY: Uses verified contract addresses with validation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAgwWallet } from '../../deposit/hooks/useAgwWallet';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { parseUnits, formatUnits, erc20Abi } from 'viem';
import { logError } from '../../../utils/errorHandler';
import { showErrorToast, showSuccessToast } from '../../../utils/toastHelper';
import { 
  getVerifiedContract, 
  validateTransaction, 
  isVerifiedToken, 
  logSecurityEvent
} from '../../../config/contracts';

// Use verified contract addresses (cannot be modified via env)
const ROUTER_ADDRESS = getVerifiedContract('ROUTER');
const USDC_ADDRESS = getVerifiedContract('USDC_TOKEN');

export interface SwapParams {
  tokenInAddress: string;
  tokenOutAddress: string;
  amountIn: string; // Human-readable amount
  tokenInDecimals: number;
  tokenOutDecimals: number;
  minAmountOut?: string; // Optional slippage protection
  slippageBps?: number; // Default 50 (0.5%)
}

export interface SwapQuote {
  amountOut: string;
  protocolFee: string;
  priceImpact: string;
  route: string;
}

export const useSwapContract = () => {
  const { address } = useAgwWallet();
  const { primaryWallet } = useDynamicContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  
  // OPTIMIZATION: Cache wallet client for instant popup
  const walletClientRef = useRef<any>(null);
  const publicClientRef = useRef<any>(null);
  
  // Preload wallet client on mount
  useEffect(() => {
    if (primaryWallet) {
      (primaryWallet as any).getWalletClient?.().then((client: any) => {
        if (client) {
          walletClientRef.current = client;
          console.log('[useSwapContract] ✅ Wallet client preloaded');
        }
      }).catch(() => {});
    }
    return () => { 
      walletClientRef.current = null;
      publicClientRef.current = null;
    };
  }, [primaryWallet]);

  /**
   * Get or create public client
   */
  const getPublicClient = useCallback(async () => {
    if (publicClientRef.current) return publicClientRef.current;
    
    const { createPublicClient, http, fallback } = await import('viem');
    const { baseSepolia } = await import('viem/chains');
    
    const client = createPublicClient({
      chain: baseSepolia,
      transport: fallback([
        http('https://base-sepolia.g.alchemy.com/v2/demo', { timeout: 10000, retryCount: 2 }),
        http('https://base-sepolia.blockpi.network/v1/rpc/public', { timeout: 10000, retryCount: 2 }),
        http('https://base-sepolia-rpc.publicnode.com', { timeout: 10000, retryCount: 2 }),
      ]),
    });
    
    publicClientRef.current = client;
    return client;
  }, []);

  /**
   * Get swap quote from router
   */
  const getSwapQuote = useCallback(async (params: SwapParams): Promise<SwapQuote | null> => {
    try {
      const { tokenInAddress, tokenOutAddress, amountIn, tokenInDecimals } = params;
      
      // SECURITY: Validate token addresses
      if (!isVerifiedToken(tokenInAddress) || !isVerifiedToken(tokenOutAddress)) {
        throw new Error('SECURITY: One or both tokens not in whitelist');
      }
      
      const publicClient = await getPublicClient();
      const amountInWei = parseUnits(amountIn, tokenInDecimals);
      
      // ABI for getQuote(address tokenIn, address tokenOut, uint256 amountIn)
      const routerAbi = [
        {
          inputs: [
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
            { name: 'amountIn', type: 'uint256' }
          ],
          name: 'getQuote',
          outputs: [
            { name: 'amountOut', type: 'uint256' },
            { name: 'protocolFee', type: 'uint256' }
          ],
          stateMutability: 'view',
          type: 'function'
        }
      ];
      
      const [amountOut, protocolFee] = await publicClient.readContract({
        address: ROUTER_ADDRESS as `0x${string}`,
        abi: routerAbi,
        functionName: 'getQuote',
        args: [
          tokenInAddress as `0x${string}`,
          tokenOutAddress as `0x${string}`,
          amountInWei
        ],
      }) as [bigint, bigint];
      
      const amountOutFormatted = formatUnits(amountOut, params.tokenOutDecimals);
      const protocolFeeFormatted = formatUnits(protocolFee, params.tokenOutDecimals);
      
      // Calculate price impact
      const priceImpact = '0.0'; // TODO: Calculate actual price impact if needed
      
      const route = tokenInAddress === USDC_ADDRESS || tokenOutAddress === USDC_ADDRESS
        ? 'Direct'
        : 'Via USDC';
      
      const quoteResult: SwapQuote = {
        amountOut: amountOutFormatted,
        protocolFee: protocolFeeFormatted,
        priceImpact,
        route,
      };
      
      setQuote(quoteResult);
      return quoteResult;
      
    } catch (err: any) {
      console.error('Failed to get quote:', err);
      setError(err.message || 'Failed to get quote');
      return null;
    }
  }, [getPublicClient]);

  /**
   * Execute token swap
   */
  const executeSwap = useCallback(async (params: SwapParams): Promise<string | null> => {
    if (!address || !primaryWallet) {
      setError('Wallet not connected');
      showErrorToast(new Error('Please connect your wallet first'));
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { 
        tokenInAddress, 
        tokenOutAddress, 
        amountIn, 
        tokenInDecimals,
        tokenOutDecimals,
        minAmountOut = '0',
        slippageBps = 50 // 0.5% default slippage
      } = params;
      
      // SECURITY: Validate token addresses
      if (!isVerifiedToken(tokenInAddress)) {
        logSecurityEvent({
          type: 'ERROR',
          details: 'Attempted to swap from unverified token',
          address: tokenInAddress,
        });
        throw new Error('SECURITY: Input token not in whitelist');
      }
      
      if (!isVerifiedToken(tokenOutAddress)) {
        logSecurityEvent({
          type: 'ERROR',
          details: 'Attempted to swap to unverified token',
          address: tokenOutAddress,
        });
        throw new Error('SECURITY: Output token not in whitelist');
      }
      
      if (tokenInAddress.toLowerCase() === tokenOutAddress.toLowerCase()) {
        throw new Error('Cannot swap same token');
      }
      
      // SECURITY: Validate contract before transaction
      const validation = await validateTransaction({
        contractAddress: ROUTER_ADDRESS,
        contractType: 'ROUTER',
        userAddress: address as `0x${string}`,
      });
      
      if (!validation.valid) {
        logSecurityEvent({
          type: 'ERROR',
          details: validation.error || 'Contract validation failed',
          address: ROUTER_ADDRESS,
        });
        throw new Error(validation.error || 'Contract validation failed');
      }
      
      logSecurityEvent({
        type: 'CONTRACT_CALL',
        details: 'Swap transaction initiated',
        address: `${tokenInAddress} -> ${tokenOutAddress}`,
      });
      
      // Parse amounts
      const amountInWei = parseUnits(amountIn, tokenInDecimals);
      
      // Get quote to calculate minAmountOut with slippage
      let minAmountOutWei: bigint;
      if (minAmountOut && parseFloat(minAmountOut) > 0) {
        minAmountOutWei = parseUnits(minAmountOut, tokenOutDecimals);
      } else {
        // Get quote and apply slippage
        const quoteResult = await getSwapQuote(params);
        if (!quoteResult) {
          throw new Error('Failed to get quote for slippage calculation');
        }
        
        const expectedOut = parseUnits(quoteResult.amountOut, tokenOutDecimals);
        minAmountOutWei = (expectedOut * BigInt(10000 - slippageBps)) / BigInt(10000);
      }

      // OPTIMIZATION: Use cached wallet client or fetch
      let walletClient = walletClientRef.current;
      if (!walletClient) {
        console.log('[executeSwap] Fetching wallet client...');
        walletClient = await (primaryWallet as any).getWalletClient?.();
        if (walletClient) walletClientRef.current = walletClient;
      }
      
      if (!walletClient) throw new Error('Wallet client not available');
      
      const publicClient = await getPublicClient();

      // Step 1: Check current allowance
      const currentAllowance = await publicClient.readContract({
        address: tokenInAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address as `0x${string}`, ROUTER_ADDRESS as `0x${string}`],
      }) as bigint;

      console.log('🔍 Current token allowance:', currentAllowance.toString());
      console.log('💰 Required amount:', amountInWei.toString());

      // Step 2: Approve if allowance is insufficient
      if (currentAllowance < amountInWei) {
        console.log('🔐 Approving unlimited token (better UX - approve once)...');
        
        // Approve max uint256 so user doesn't need to approve every transaction
        const maxApproval = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
        const approveData = `0x095ea7b3${ROUTER_ADDRESS.slice(2).padStart(64, '0')}${maxApproval}`;
        
        const approveTx = await walletClient.sendTransaction({
          to: tokenInAddress as `0x${string}`,
          data: approveData as `0x${string}`,
        });

        console.log('✅ Token approval sent:', approveTx);
        console.log('⏳ Waiting for approval confirmation...');

        await publicClient.waitForTransactionReceipt({ 
          hash: approveTx,
          confirmations: 1,
        });

        console.log('✅ Token approved and confirmed');
      } else {
        console.log('✅ Sufficient allowance already exists, skipping approval');
      }

      // Step 3: Execute swap
      console.log('🔄 Executing swap...');
      console.log('Token In:', tokenInAddress);
      console.log('Token Out:', tokenOutAddress);
      console.log('Amount In:', amountInWei.toString());
      console.log('Min Amount Out:', minAmountOutWei.toString());
      
      // Function signature: swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut)
      // Function selector: 0xfe029156
      const swapData = `0xfe029156${
        tokenInAddress.slice(2).padStart(64, '0')
      }${
        tokenOutAddress.slice(2).padStart(64, '0')
      }${
        amountInWei.toString(16).padStart(64, '0')
      }${
        minAmountOutWei.toString(16).padStart(64, '0')
      }`;
      
      console.log('Swap data:', swapData);
      
      const swapTx = await walletClient.sendTransaction({
        to: ROUTER_ADDRESS as `0x${string}`,
        data: swapData as `0x${string}`,
      });

      console.log('✅ Swap transaction sent:', swapTx);
      
      // Wait for confirmation
      console.log('⏳ Waiting for swap confirmation...');
      await publicClient.waitForTransactionReceipt({ 
        hash: swapTx,
        confirmations: 1,
      });
      
      console.log('✅ Swap completed successfully');
      
      showSuccessToast('Swap Complete', 'Your tokens have been swapped successfully! 🎉');
      
      setLoading(false);
      return swapTx;

    } catch (err: any) {
      logError('ExecuteSwap', err);
      setError(err.message || 'Failed to execute swap');
      setLoading(false);
      
      // Show user-friendly toast
      showErrorToast(err);
      return null;
    }
  }, [address, primaryWallet, getPublicClient, getSwapQuote]);

  return {
    executeSwap,
    getSwapQuote,
    loading,
    error,
    quote,
  };
};
