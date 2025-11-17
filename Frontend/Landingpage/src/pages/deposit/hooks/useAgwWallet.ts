/**
 * React hook for Base Sepolia Wallet with Dynamic Embedded Wallet
 * 
 * Dynamic embedded wallet - No MetaMask/extension needed!
 * 
 * @see https://docs.dynamic.xyz
 * @see https://docs.base.org
 */

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { formatEther, parseEther, formatUnits, createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { storageService } from '../../../utils/indexedDBService';

// Token Contract Addresses on Base Sepolia (NEWLY DEPLOYED - VERIFIED)
const USDC_TOKEN_ADDRESS = '0xBEE08798a3634e29F47e3d277C9d11507D55F66a'; // MockUSDC on Base Sepolia
const BTC_TOKEN_ADDRESS = '0xD8a6E3FCA403d79b6AD6216b60527F51cc967D39'; // cbBTC on Base Sepolia

export const useAgwWallet = () => {
  const context = useDynamicContext();
  const { 
    primaryWallet,
    user,
    setShowAuthFlow,
    handleLogOut,
  } = context;
  
  // Try to get user profile methods from context
  const setShowDynamicUserProfile = (context as any).setShowDynamicUserProfile;
  
  const [ethBalance, setEthBalance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [btcBalance, setBtcBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  
  const address = useMemo(() => primaryWallet?.address, [primaryWallet?.address]);
  const authenticated = !!primaryWallet;
  
  // Fetch all balances (ETH, USDC, BTC)
  const refreshBalance = useCallback(async () => {
    if (!primaryWallet) {
      setEthBalance('0');
      setUsdcBalance('0');
      setBtcBalance('0');
      return;
    }
    
    try {
      const rpcUrl = 'https://sepolia.base.org';
      
      // Fetch all balances in parallel for faster loading
      const [ethBal, usdcData, btcData] = await Promise.allSettled([
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            jsonrpc: '2.0', 
            id: 1, 
            method: 'eth_getBalance', 
            params: [primaryWallet.address, 'latest'] 
          }),
        }).then(r => r.json()).then(d => d.result),
        
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            jsonrpc: '2.0', 
            id: 2, 
            method: 'eth_call', 
            params: [{
              to: USDC_TOKEN_ADDRESS,
              data: `0x70a08231000000000000000000000000${primaryWallet.address.slice(2)}`,
            }, 'latest']
          }),
        }).then(r => r.json()).then(d => d.result),
        
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            jsonrpc: '2.0', 
            id: 3, 
            method: 'eth_call', 
            params: [{
              to: BTC_TOKEN_ADDRESS,
              data: `0x70a08231000000000000000000000000${primaryWallet.address.slice(2)}`,
            }, 'latest']
          }),
        }).then(r => r.json()).then(d => d.result),
      ]);
      
      // Process ETH balance
      if (ethBal.status === 'fulfilled' && ethBal.value) {
        setEthBalance(formatEther(BigInt(ethBal.value)));
      } else {
        setEthBalance('0');
      }
      
      // Process USDC balance
      if (usdcData.status === 'fulfilled' && usdcData.value && usdcData.value !== '0x') {
        setUsdcBalance(formatUnits(BigInt(usdcData.value), 6));
      } else {
        setUsdcBalance('0');
      }
      
      // Process BTC balance
      if (btcData.status === 'fulfilled' && btcData.value && btcData.value !== '0x') {
        setBtcBalance(formatUnits(BigInt(btcData.value), 8));
      } else {
        setBtcBalance('0');
      }
    } catch (error) {
      setEthBalance('0');
      setUsdcBalance('0');
      setBtcBalance('0');
    }
  }, [primaryWallet]);
  
  // Fetch balance once when wallet connects
  useEffect(() => {
    if (authenticated && address) {
      refreshBalance();
    }
  }, [authenticated, address]);

  /**
   * Sign in - Opens Dynamic login modal (creates embedded wallet automatically)
   */
  const signIn = useCallback(async () => {
    try {
      setLoading(true);
      setShowAuthFlow(true);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  }, [setShowAuthFlow]);

  /**
   * Sign out - Logout from Dynamic
   */
  const signOut = useCallback(async () => {
    try {
      // Clear wallet-specific data from IndexedDB and localStorage
      if (address) {
        // Run storage clear in background, don't wait
        storageService.clearWallet(address).catch(() => {});
      }
      
      // Fast disconnect with 2 second timeout
      await Promise.race([
        handleLogOut(),
        new Promise((resolve) => setTimeout(resolve, 2000))
      ]);
    } catch (error) {
      // Force reload on persistent error
      setTimeout(() => window.location.reload(), 100);
    }
  }, [handleLogOut, address]);
  
  // Alias for consistency with other components
  const disconnect = signOut;

  /**
   * Get wallet address
   */
  const getAddress = useCallback(() => {
    return address || null;
  }, [address]);

  /**
   * Send transaction using Dynamic's embedded wallet
   */
  const sendTransaction = useCallback(async (
    to: string,
    value: string,
    _tokenType: 'ETH' | 'USDC' = 'ETH'
  ) => {
    if (!primaryWallet) {
      throw new Error('No wallet connected');
    }
    try {
      const amountInWei = parseEther(value);
      
      // Use Dynamic's proper method - getWalletClient for viem integration
      const walletClient = await (primaryWallet as any).getWalletClient?.();
      
      if (walletClient) {
        // Use viem's wallet client directly
        const hash = await walletClient.sendTransaction({
          to: to as `0x${string}`,
          value: amountInWei,
        });
        
        // Create public client to wait for transaction
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http('https://sepolia.base.org'),
        });
        
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        // Save to localStorage only after confirmation
        if (primaryWallet.address && receipt.status === 'success') {
          const storageKey = `wallet_${primaryWallet.address.toLowerCase()}_transactions`;
          const storedTxs = localStorage.getItem(storageKey);
          const txs = storedTxs ? JSON.parse(storedTxs) : [];
          
          txs.unshift({
            id: hash,
            type: 'withdrawal',
            txHash: hash,
            from: primaryWallet.address,
            to,
            amount: value,
            tokenSymbol: 'ETH',
            timestamp: new Date().toISOString(),
            status: 'completed',
          });
          
          localStorage.setItem(storageKey, JSON.stringify(txs));
        }
        
        return { hash, receipt };
      }
      
      // Fallback: Use connector methods
      const connector: any = primaryWallet.connector;
      
      // Try getWalletClient from connector
      const connectorWalletClient = await connector.getWalletClient?.();
      
      if (connectorWalletClient) {
        const hash = await connectorWalletClient.sendTransaction({
          to: to as `0x${string}`,
          value: amountInWei,
        });
        
        // Create public client to wait for transaction
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http('https://sepolia.base.org'),
        });
        
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        // Save to localStorage only after confirmation
        if (primaryWallet.address && receipt.status === 'success') {
          const storageKey = `wallet_${primaryWallet.address.toLowerCase()}_transactions`;
          const storedTxs = localStorage.getItem(storageKey);
          const txs = storedTxs ? JSON.parse(storedTxs) : [];
          
          txs.unshift({
            id: hash,
            type: 'withdrawal',
            txHash: hash,
            from: primaryWallet.address,
            to,
            amount: value,
            tokenSymbol: 'ETH',
            timestamp: new Date().toISOString(),
            status: 'completed',
          });
          
          localStorage.setItem(storageKey, JSON.stringify(txs));
        }
        
        return { hash, receipt };
      }
      
      throw new Error('Could not get wallet client for transaction');
    } catch (error) {
      throw error;
    }
  }, [primaryWallet]);

  /**
   * Send tokens (USDC, BTC, or any ERC20) using Dynamic's embedded wallet
   */
  const sendToken = useCallback(async (
    tokenAddress: string,
    to: string,
    amount: string,
    decimals: number = 6
  ) => {
    if (!primaryWallet) {
      throw new Error('No wallet connected');
    }
    
    try {
      // ERC20 transfer function selector: 0xa9059cbb
      // transfer(address to, uint256 amount)
      const amountBigInt = BigInt(Math.floor(Number(amount) * Math.pow(10, decimals)));
      const amountHex = amountBigInt.toString(16).padStart(64, '0');
      const toAddressHex = to.toLowerCase().replace('0x', '').padStart(64, '0');
      const data = `0xa9059cbb${toAddressHex}${amountHex}` as `0x${string}`;
      
      // Use Dynamic's proper method - getWalletClient for viem integration
      const walletClient = await (primaryWallet as any).getWalletClient?.();
      
      if (walletClient) {
        const hash = await walletClient.sendTransaction({
          to: tokenAddress as `0x${string}`,
          data,
        });
        
        // Create public client to wait for transaction
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http('https://sepolia.base.org'),
        });
        
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        // Save to localStorage only after confirmation
        if (primaryWallet.address && receipt.status === 'success') {
          const storageKey = `wallet_${primaryWallet.address.toLowerCase()}_transactions`;
          const storedTxs = localStorage.getItem(storageKey);
          const txs = storedTxs ? JSON.parse(storedTxs) : [];
          
          // Determine token symbol from address
          const tokenSymbol = tokenAddress.toLowerCase() === USDC_TOKEN_ADDRESS.toLowerCase() ? 'USDC' : 'TOKEN';
          
          txs.unshift({
            id: hash,
            type: 'withdrawal',
            txHash: hash,
            from: primaryWallet.address,
            to,
            amount,
            tokenSymbol,
            timestamp: new Date().toISOString(),
            status: 'completed',
          });
          
          localStorage.setItem(storageKey, JSON.stringify(txs));
        }
        
        return { hash, receipt };
      }
      
      // Fallback: Use connector
      const connector: any = primaryWallet.connector;
      const connectorWalletClient = await connector.getWalletClient?.();
      
      if (connectorWalletClient) {
        const hash = await connectorWalletClient.sendTransaction({
          to: tokenAddress as `0x${string}`,
          data,
        });
        
        // Create public client to wait for transaction
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http('https://sepolia.base.org'),
        });
        
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        // Save to localStorage only after confirmation
        if (primaryWallet.address && receipt.status === 'success') {
          const storageKey = `wallet_${primaryWallet.address.toLowerCase()}_transactions`;
          const storedTxs = localStorage.getItem(storageKey);
          const txs = storedTxs ? JSON.parse(storedTxs) : [];
          
          // Determine token symbol from address
          const tokenSymbol = tokenAddress.toLowerCase() === USDC_TOKEN_ADDRESS.toLowerCase() ? 'USDC' : 'TOKEN';
          
          txs.unshift({
            id: hash,
            type: 'withdrawal',
            txHash: hash,
            from: primaryWallet.address,
            to,
            amount,
            tokenSymbol,
            timestamp: new Date().toISOString(),
            status: 'completed',
          });
          
          localStorage.setItem(storageKey, JSON.stringify(txs));
        }
        
        return { hash, receipt };
      }
      
      throw new Error('Could not get wallet client for token transfer');
    } catch (error) {
      throw error;
    }
  }, [primaryWallet]);

  /**
   * Add Passkey MFA - Opens Dynamic's user profile modal
   * Dashboard mein MFA already enable hai, user ko profile se add karna hoga
   */
  const handleAddPasskey = useCallback(async () => {
    if (!authenticated) {
      alert('Please connect wallet first');
      return;
    }
    
    try {
      // Open user profile if method exists
      if (typeof setShowDynamicUserProfile === 'function') {
        setShowDynamicUserProfile(true);
      } else {
        // Fallback: show auth flow
        setShowAuthFlow(true);
      }
    } catch (error) {
      alert('Unable to open profile. Please try clicking your wallet address in the top right.');
    }
  }, [authenticated, setShowDynamicUserProfile, setShowAuthFlow]);

  /**
   * Export Private Key - Opens Dynamic's wallet export modal
   * ⚠️ IMPORTANT: User ko private key backup lene ke liye
   * Note: MFA/Passkey setup required for export
   */
  const exportPrivateKey = useCallback(async () => {
    if (!authenticated) {
      alert('Please connect wallet first');
      return;
    }
    
    try {
      // Open Dynamic user profile modal
      setShowDynamicUserProfile(true);
    } catch (error) {
      alert('Please click your wallet address in the top right corner to access wallet settings.');
    }
  }, [authenticated, setShowDynamicUserProfile]);

  return {
    // State
    address: address || null,
    balance: ethBalance,
    ethBalance,
    usdcBalance,
    btcBalance,
    connected: authenticated,
    loading: loading,
    error: null,
    email: user?.email || null,

    // Token Addresses
    USDC_ADDRESS: USDC_TOKEN_ADDRESS,
    BTC_ADDRESS: BTC_TOKEN_ADDRESS,

    // Methods
    signIn,
    signOut,
    disconnect, // Alias for signOut
    refreshBalance,
    getAddress,
    sendTransaction,
    sendToken, // Send ERC20 tokens (USDC, BTC, etc.)
    addPasskey: handleAddPasskey, // Add Passkey MFA for wallet security
    exportPrivateKey, // Export private key for backup
  };
};

// Export token addresses for use in other components
export { USDC_TOKEN_ADDRESS, BTC_TOKEN_ADDRESS };
