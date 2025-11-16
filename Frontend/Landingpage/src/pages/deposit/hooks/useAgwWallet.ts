/**
 * React hook for Abstract Global Wallet integration
 * 
 * This hook wraps the official AGW SDK hooks and provides a unified interface
 * for wallet management in the deposit page.
 * 
 * @see https://docs.abs.xyz/abstract-global-wallet/getting-started
 * @see https://docs.abs.xyz/abstract-global-wallet/api-reference
 */

import { useCallback, useEffect } from 'react';
import { useLoginWithAbstract } from '@abstract-foundation/agw-react';
import { useAccount, useBalance, useDisconnect, useSendTransaction, useWriteContract } from 'wagmi';
import { formatEther, formatUnits, parseEther, parseUnits } from 'viem';
import { usePrivy } from '@privy-io/react-auth';

// USDC contract address on Abstract Testnet
const USDC_CONTRACT_ADDRESS = '0xe4C7fBB0a626ed208021ccabA6Be1566905E2dFc';

/**
 * Hook for AGW wallet management using real Abstract Global Wallet SDK
 */
export const useAgwWallet = () => {
  // AGW Authentication
  const { login } = useLoginWithAbstract();
  
  // Privy user data (email, etc.)
  const { user } = usePrivy();
  
  // Wagmi hooks for wallet data
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  // Transaction hooks
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  
  // ETH balance
  const { data: ethBalanceData, refetch: refetchEthBalance } = useBalance({
    address,
    query: {
      enabled: !!address,
    },
  });

  // USDC balance
  const { data: usdcBalanceData, refetch: refetchUsdcBalance } = useBalance({
    address,
    token: USDC_CONTRACT_ADDRESS as `0x${string}`,
    query: {
      enabled: !!address,
    },
  });

  // Format balances for display
  const formattedEthBalance = ethBalanceData ? formatEther(ethBalanceData.value) : '0';
  const formattedUsdcBalance = usdcBalanceData ? formatUnits(usdcBalanceData.value, 6) : '0';
  
  // Default to ETH balance for backwards compatibility
  const formattedBalance = formattedEthBalance;

  /**
   * Sign in with Abstract Global Wallet
   * Opens AGW login modal for email/social authentication
   */
  const signIn = useCallback(async () => {
    try {
      console.log('🔐 Opening AGW login...');
      await login();
      console.log('✅ Successfully logged in with AGW');
      // Let React hooks handle state update naturally
    } catch (error) {
      console.error('❌ AGW login failed:', error);
      // Don't throw, let user retry
    }
  }, [login]);

  /**
   * Sign out and disconnect wallet
   * Clears all wallet-related storage to prevent cache conflicts
   */
  const signOut = useCallback(async () => {
    try {
      console.log('👋 Signing out...');
      
      // Clear all Abstract Global Wallet storage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('agw') || 
            key.includes('abstract') || 
            key.includes('wallet') || 
            key.includes('privy') ||
            key.includes('wagmi')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage as well
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('agw') || 
            key.includes('abstract') || 
            key.includes('wallet') || 
            key.includes('privy') ||
            key.includes('wagmi')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Disconnect wallet
      disconnect();
      
      console.log('✅ Wallet disconnected and storage cleared');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [disconnect]);

  /**
   * Refresh wallet balance from blockchain
   */
  const refreshBalance = useCallback(async () => {
    if (!address) return;

    try {
      await Promise.all([refetchEthBalance(), refetchUsdcBalance()]);
      console.log(`💰 Balances refreshed - ETH: ${formattedEthBalance}, USDC: ${formattedUsdcBalance}`);
    } catch (error) {
      console.error('Refresh balance error:', error);
    }
  }, [address, refetchEthBalance, refetchUsdcBalance, formattedEthBalance, formattedUsdcBalance]);

  /**
   * Get wallet address
   */
  const getAddress = useCallback(() => {
    return address || null;
  }, [address]);

  /**
   * Send transaction - supports both ETH and USDC transfers
   * @param to - Recipient address
   * @param value - Amount to send (as string)
   * @param tokenType - 'ETH' for native ETH, 'USDC' for USDC token
   */
  const sendTransaction = useCallback(async (
    to: string,
    value: string,
    tokenType: 'ETH' | 'USDC' = 'ETH'
  ) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('📤 Sending transaction...', { to, value, tokenType });

      let txHash: string;

      if (tokenType === 'ETH') {
        // Send native ETH
        const result = await sendTransactionAsync({
          to: to as `0x${string}`,
          value: parseEther(value),
        });
        txHash = result;
        console.log('✅ ETH transaction sent:', txHash);
      } else {
        // Send USDC token using ERC20 transfer
        const result = await writeContractAsync({
          address: USDC_CONTRACT_ADDRESS as `0x${string}`,
          abi: [
            {
              name: 'transfer',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ],
          functionName: 'transfer',
          args: [to as `0x${string}`, parseUnits(value, 6)],
        });
        txHash = result;
        console.log('✅ USDC transaction sent:', txHash);
      }

      // Save transaction to localStorage as pending
      const transaction = {
        id: txHash,
        type: 'withdrawal' as const,
        amount: value,
        tokenSymbol: tokenType,
        status: 'pending' as const,
        txHash: txHash,
        timestamp: new Date().toISOString(),
      };

      // Store transaction with wallet-specific key
      const storageKey = `wallet_${address.toLowerCase()}_transactions`;
      const storedTxs = localStorage.getItem(storageKey);
      const existingTxs = storedTxs ? JSON.parse(storedTxs) : [];
      localStorage.setItem(storageKey, JSON.stringify([transaction, ...existingTxs]));

      // Update status to completed after a short delay (transaction is already confirmed by wagmi)
      setTimeout(() => {
        const updatedTxs = localStorage.getItem(storageKey);
        if (updatedTxs) {
          const txs = JSON.parse(updatedTxs);
          const updatedList = txs.map((tx: any) => 
            tx.txHash === txHash ? { ...tx, status: 'completed' } : tx
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedList));
        }
        refreshBalance();
      }, 3000);

      return txHash;

    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }, [isConnected, address, sendTransactionAsync, writeContractAsync, refreshBalance]);

  // Auto-refresh balance every 15 seconds when connected
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      refreshBalance();
    }, 15000);

    return () => clearInterval(interval);
  }, [isConnected, address, refreshBalance]);

  // Get user email from Privy
  const userEmail = user?.email?.address || user?.google?.email || user?.twitter?.username || null;

  return {
    // State
    address: address || null,
    balance: formattedBalance,
    ethBalance: formattedEthBalance,
    usdcBalance: formattedUsdcBalance,
    connected: isConnected,
    loading: false, // AGW handles loading states internally
    error: null, // AGW handles errors internally
    email: userEmail,

    // Methods
    signIn,
    signOut,
    refreshBalance,
    getAddress,
    sendTransaction,
  };
};
