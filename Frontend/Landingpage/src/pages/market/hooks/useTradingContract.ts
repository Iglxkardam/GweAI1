/**
 * Trading Contract Hook - Router Integration
 * Handles buy/sell transactions with AMM Router
 * OPTIMIZED: Fast gas, optimized approvals, error handling
 * SECURITY: Uses verified contract addresses with validation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAgwWallet } from '../../deposit/hooks/useAgwWallet';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { parseUnits } from 'viem';
import { logError } from '../../../utils/errorHandler';
import { showErrorToast } from '../../../utils/toastHelper';
import { getVerifiedContract, validateTransaction, isVerifiedToken, logSecurityEvent } from '../../../config/contracts';

// Use verified contract addresses (cannot be modified via env)
const ROUTER_ADDRESS = getVerifiedContract('ROUTER');
const USDC_ADDRESS = getVerifiedContract('USDC_TOKEN');

export interface TradeParams {
  tokenAddress: string;
  amount: string; // Human-readable amount
  tokenDecimals: number;
  minAmountOut?: string; // Optional slippage protection
}

export const useTradingContract = () => {
  const { address } = useAgwWallet();
  const { primaryWallet } = useDynamicContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // OPTIMIZATION: Cache wallet client for instant popup
  const walletClientRef = useRef<any>(null);
  
  // Preload wallet client on mount
  useEffect(() => {
    if (primaryWallet) {
      (primaryWallet as any).getWalletClient?.().then((client: any) => {
        if (client) {
          walletClientRef.current = client;
          console.log('[useTradingContract] ✅ Wallet client preloaded');
        }
      }).catch(() => {});
    }
    return () => { walletClientRef.current = null; };
  }, [primaryWallet]);

  /**
   * Buy tokens with USDC
   * @param params Trade parameters
   */
  const buyToken = useCallback(async (params: TradeParams): Promise<string | null> => {
    if (!address || !primaryWallet) {
      setError('Wallet not connected');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { tokenAddress, amount, minAmountOut = '0' } = params;
      
      // SECURITY: Validate token address
      if (!isVerifiedToken(tokenAddress)) {
        logSecurityEvent({
          type: 'ERROR',
          details: 'Attempted to buy unverified token',
          address: tokenAddress,
        });
        throw new Error('SECURITY: Token not in whitelist. Contact support if this is a legitimate token.');
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
        details: 'Buy token transaction initiated',
        address: tokenAddress,
      });
      
      // Parse amounts
      const usdcAmount = parseUnits(amount, 6); // USDC has 6 decimals
      const minOut = parseUnits(minAmountOut, params.tokenDecimals);

      // OPTIMIZATION: Use cached wallet client or fetch
      let walletClient = walletClientRef.current;
      if (!walletClient) {
        console.log('[buyToken] Fetching wallet client...');
        walletClient = await (primaryWallet as any).getWalletClient?.();
        if (walletClient) walletClientRef.current = walletClient;
      }
      
      if (!walletClient) throw new Error('Wallet client not available');
      
      // Create public client for reading blockchain state
      const { createPublicClient, http, erc20Abi } = await import('viem');
      const { baseSepolia } = await import('viem/chains');
      
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http('https://sepolia.base.org'),
      });

      // Step 1: Check current allowance
      const currentAllowance = await publicClient.readContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address as `0x${string}`, ROUTER_ADDRESS as `0x${string}`],
      }) as bigint;

      console.log('🔍 Current USDC allowance:', currentAllowance.toString());
      console.log('💰 Required amount:', usdcAmount.toString());

      // Step 2: Approve if allowance is insufficient
      if (currentAllowance < usdcAmount) {
        console.log('🔐 Approving unlimited USDC (better UX - approve once)...');
        
        // Approve max uint256 so user doesn't need to approve every transaction
        const maxApproval = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
        const approveData = `0x095ea7b3${ROUTER_ADDRESS.slice(2).padStart(64, '0')}${maxApproval}`;
        
        const approveTx = await walletClient.sendTransaction({
          to: USDC_ADDRESS as `0x${string}`,
          data: approveData as `0x${string}`,
        });

        console.log('✅ USDC approval sent:', approveTx);
        console.log('⏳ Waiting for approval confirmation...');

        await publicClient.waitForTransactionReceipt({ 
          hash: approveTx,
          confirmations: 1,
        });

        console.log('✅ USDC approved and confirmed');
      } else {
        console.log('✅ Sufficient allowance already exists, skipping approval');
      }

      // Step 3: Buy tokens
      console.log('💰 Buying tokens...');
      console.log('Token address:', tokenAddress);
      console.log('USDC amount:', usdcAmount.toString());
      console.log('Min amount out:', minOut.toString());
      
      // Correct function selector for buy(address,uint256,uint256) = 0xa59ac6dd
      const buyData = `0xa59ac6dd${tokenAddress.slice(2).padStart(64, '0')}${usdcAmount.toString(16).padStart(64, '0')}${minOut.toString(16).padStart(64, '0')}`;
      console.log('Buy data:', buyData);
      
      const buyTx = await walletClient.sendTransaction({
        to: ROUTER_ADDRESS as `0x${string}`,
        data: buyData as `0x${string}`,
      });

      console.log('✅ Buy transaction sent:', buyTx);
      setLoading(false);
      return buyTx;

    } catch (err: any) {
      logError('BuyToken', err);
      setError(err.message || 'Failed to buy token');
      setLoading(false);
      
      // Show user-friendly toast
      showErrorToast(err);
      return null;
    }
  }, [address, primaryWallet]);

  /**
   * Sell tokens for USDC
   * @param params Trade parameters
   */
  const sellToken = useCallback(async (params: TradeParams): Promise<string | null> => {
    if (!address || !primaryWallet) {
      setError('Wallet not connected');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { tokenAddress, amount, tokenDecimals, minAmountOut = '0' } = params;
      
      // SECURITY: Validate token address
      if (!isVerifiedToken(tokenAddress)) {
        logSecurityEvent({
          type: 'ERROR',
          details: 'Attempted to sell unverified token',
          address: tokenAddress,
        });
        throw new Error('SECURITY: Token not in whitelist. Contact support if this is a legitimate token.');
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
        details: 'Sell token transaction initiated',
        address: tokenAddress,
      });
      
      // Parse amounts
      const tokenAmount = parseUnits(amount, tokenDecimals);
      const minUsdcOut = parseUnits(minAmountOut, 6); // USDC has 6 decimals

      // OPTIMIZATION: Use cached wallet client or fetch
      let walletClient = walletClientRef.current;
      if (!walletClient) {
        console.log('[sellToken] Fetching wallet client...');
        walletClient = await (primaryWallet as any).getWalletClient?.();
        if (walletClient) walletClientRef.current = walletClient;
      }
      
      if (!walletClient) throw new Error('Wallet client not available');

      // Step 1: Approve token
      console.log('🔐 Approving token...');
      const approveData = `0x095ea7b3${ROUTER_ADDRESS.slice(2).padStart(64, '0')}${tokenAmount.toString(16).padStart(64, '0')}`;
      
      const approveTx = await walletClient.sendTransaction({
        to: tokenAddress as `0x${string}`,
        data: approveData as `0x${string}`,
      });

      console.log('✅ Token approval sent:', approveTx);
      console.log('⏳ Waiting for approval confirmation...');

      // Wait for approval to be mined
      const { createPublicClient, http } = await import('viem');
      const { baseSepolia } = await import('viem/chains');
      
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http('https://sepolia.base.org'),
      });

      await publicClient.waitForTransactionReceipt({ 
        hash: approveTx,
        confirmations: 1,
      });

      console.log('✅ Token approved and confirmed');

      // Step 2: Sell tokens
      console.log('💸 Selling tokens...');
      // Correct function selector for sell(address,uint256,uint256) = 0x6a272462
      const sellData = `0x6a272462${tokenAddress.slice(2).padStart(64, '0')}${tokenAmount.toString(16).padStart(64, '0')}${minUsdcOut.toString(16).padStart(64, '0')}`;
      
      const sellTx = await walletClient.sendTransaction({
        to: ROUTER_ADDRESS as `0x${string}`,
        data: sellData as `0x${string}`,
      });

      console.log('✅ Sell transaction sent:', sellTx);
      setLoading(false);
      return sellTx;

    } catch (err: any) {
      logError('SellToken', err);
      setError(err.message || 'Failed to sell token');
      setLoading(false);
      
      // Show user-friendly toast
      showErrorToast(err);
      return null;
    }
  }, [address, primaryWallet]);

  return {
    buyToken,
    sellToken,
    loading,
    error,
  };
};
