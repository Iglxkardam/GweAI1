/**
 * React hook for Base Sepolia Wallet with Dynamic Embedded Wallet
 * 
 * Dynamic embedded wallet - No MetaMask/extension needed!
 * 
 * @see https://docs.dynamic.xyz
 * @see https://docs.base.org
 */

import { useCallback, useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { formatEther, parseEther, formatUnits } from 'viem';
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
  
  const address = primaryWallet?.address;
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
      // Create direct RPC provider for Base Sepolia
      const rpcUrl = 'https://sepolia.base.org';
      const provider = {
        send: async (method: string, params: any[]) => {
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
          });
          const data = await response.json();
          return data.result;
        },
      };
      
      // Fetch ETH balance
      const ethBal = await provider.send('eth_getBalance', [primaryWallet.address, 'latest']);
      const balanceInWei = BigInt(ethBal);
      setEthBalance(formatEther(balanceInWei));
      
      // Fetch USDC balance (6 decimals)
      try {
        const usdcData = await provider.send('eth_call', [
          {
            to: USDC_TOKEN_ADDRESS,
            data: `0x70a08231000000000000000000000000${primaryWallet.address.slice(2)}`, // balanceOf(address)
          },
          'latest',
        ]);
        // Check if response is valid before converting to BigInt
        if (usdcData && usdcData !== '0x') {
          const usdcBal = BigInt(usdcData);
          setUsdcBalance(formatUnits(usdcBal, 6)); // USDC has 6 decimals
        } else {
          setUsdcBalance('0');
        }
      } catch (err) {
        console.warn('USDC balance fetch failed:', err);
        setUsdcBalance('0');
      }
      
      // Fetch BTC balance (8 decimals - cbBTC)
      try {
        const btcData = await provider.send('eth_call', [
          {
            to: BTC_TOKEN_ADDRESS,
            data: `0x70a08231000000000000000000000000${primaryWallet.address.slice(2)}`, // balanceOf(address)
          },
          'latest',
        ]);
        const btcBal = BigInt(btcData);
        setBtcBalance(formatUnits(btcBal, 8)); // cbBTC has 8 decimals
      } catch (err) {
        console.warn('BTC balance fetch failed:', err);
        setBtcBalance('0');
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      setEthBalance('0');
      setUsdcBalance('0');
      setBtcBalance('0');
    }
  }, [primaryWallet]);
  
  // Auto-refresh balance when wallet connects
  useEffect(() => {
    if (authenticated && primaryWallet) {
      refreshBalance();
      
      // Refresh every 10 seconds
      const interval = setInterval(refreshBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [authenticated, primaryWallet, refreshBalance]);

  /**
   * Sign in - Opens Dynamic login modal (creates embedded wallet automatically)
   */
  const signIn = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔐 Opening Dynamic login...');
      setShowAuthFlow(true);
    } catch (error) {
      console.error('❌ Login failed:', error);
    } finally {
      setLoading(false);
    }
  }, [setShowAuthFlow]);

  /**
   * Sign out - Logout from Dynamic
   */
  const signOut = useCallback(async () => {
    try {
      console.log('👋 Logging out...');
      
      // Clear wallet-specific data from IndexedDB and localStorage
      if (address) {
        console.log('🗑️ Clearing wallet data for:', address);
        await storageService.clearWallet(address);
      }
      
      await handleLogOut();
    } catch (error) {
      console.error('Sign out error:', error);
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
      console.log('📤 Sending transaction:', { to, value });
      
      const amountInWei = parseEther(value);
      
      // Use Dynamic's proper method - getWalletClient for viem integration
      const walletClient = await (primaryWallet as any).getWalletClient?.();
      
      if (walletClient) {
        console.log('🔍 Using wallet client');
        // Use viem's wallet client directly
        const hash = await walletClient.sendTransaction({
          to: to as `0x${string}`,
          value: amountInWei,
        });
        console.log('✅ Transaction sent:', hash);
        
        // Save to localStorage
        if (primaryWallet.address) {
          const storageKey = `wallet_${primaryWallet.address.toLowerCase()}_transactions`;
          const storedTxs = localStorage.getItem(storageKey);
          const txs = storedTxs ? JSON.parse(storedTxs) : [];
          
          txs.unshift({
            txHash: hash,
            from: primaryWallet.address,
            to,
            amount: value,
            token: 'ETH',
            timestamp: new Date().toISOString(),
            status: 'pending',
          });
          
          localStorage.setItem(storageKey, JSON.stringify(txs));
        }
        
        return { hash };
      }
      
      // Fallback: Use connector methods
      const connector: any = primaryWallet.connector;
      console.log('🔍 Using connector fallback');
      
      // Try getWalletClient from connector
      const connectorWalletClient = await connector.getWalletClient?.();
      
      if (connectorWalletClient) {
        const hash = await connectorWalletClient.sendTransaction({
          to: to as `0x${string}`,
          value: amountInWei,
        });
        console.log('✅ Transaction sent via connector wallet client:', hash);
        
        // Save to localStorage
        if (primaryWallet.address) {
          const storageKey = `wallet_${primaryWallet.address.toLowerCase()}_transactions`;
          const storedTxs = localStorage.getItem(storageKey);
          const txs = storedTxs ? JSON.parse(storedTxs) : [];
          
          txs.unshift({
            txHash: hash,
            from: primaryWallet.address,
            to,
            amount: value,
            token: 'ETH',
            timestamp: new Date().toISOString(),
            status: 'pending',
          });
          
          localStorage.setItem(storageKey, JSON.stringify(txs));
        }
        
        return { hash };
      }
      
      throw new Error('Could not get wallet client for transaction');
    } catch (error) {
      console.error('Transaction failed:', error);
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
      console.log(`💸 Sending ${amount} tokens to ${to}...`);
      
      // ERC20 transfer function selector: 0xa9059cbb
      // transfer(address to, uint256 amount)
      const amountBigInt = BigInt(Math.floor(Number(amount) * Math.pow(10, decimals)));
      const amountHex = amountBigInt.toString(16).padStart(64, '0');
      const toAddressHex = to.toLowerCase().replace('0x', '').padStart(64, '0');
      const data = `0xa9059cbb${toAddressHex}${amountHex}` as `0x${string}`;
      
      console.log(`📝 Transfer data:`, data);
      
      // Use Dynamic's proper method - getWalletClient for viem integration
      const walletClient = await (primaryWallet as any).getWalletClient?.();
      
      if (walletClient) {
        console.log('🔍 Using wallet client for token transfer');
        const hash = await walletClient.sendTransaction({
          to: tokenAddress as `0x${string}`,
          data,
        });
        console.log(`✅ Token transfer submitted:`, hash);
        
        // Save to localStorage
        if (primaryWallet.address) {
          const storageKey = `wallet_${primaryWallet.address.toLowerCase()}_transactions`;
          const storedTxs = localStorage.getItem(storageKey);
          const txs = storedTxs ? JSON.parse(storedTxs) : [];
          
          // Determine token symbol from address
          const tokenSymbol = tokenAddress.toLowerCase() === USDC_TOKEN_ADDRESS.toLowerCase() ? 'USDC' : 'TOKEN';
          
          txs.unshift({
            txHash: hash,
            from: primaryWallet.address,
            to,
            amount,
            token: tokenSymbol,
            timestamp: new Date().toISOString(),
            status: 'pending',
          });
          
          localStorage.setItem(storageKey, JSON.stringify(txs));
        }
        
        return { hash };
      }
      
      // Fallback: Use connector
      const connector: any = primaryWallet.connector;
      const connectorWalletClient = await connector.getWalletClient?.();
      
      if (connectorWalletClient) {
        const hash = await connectorWalletClient.sendTransaction({
          to: tokenAddress as `0x${string}`,
          data,
        });
        console.log(`✅ Token transfer submitted via connector:`, hash);
        
        // Save to localStorage
        if (primaryWallet.address) {
          const storageKey = `wallet_${primaryWallet.address.toLowerCase()}_transactions`;
          const storedTxs = localStorage.getItem(storageKey);
          const txs = storedTxs ? JSON.parse(storedTxs) : [];
          
          // Determine token symbol from address
          const tokenSymbol = tokenAddress.toLowerCase() === USDC_TOKEN_ADDRESS.toLowerCase() ? 'USDC' : 'TOKEN';
          
          txs.unshift({
            txHash: hash,
            from: primaryWallet.address,
            to,
            amount,
            token: tokenSymbol,
            timestamp: new Date().toISOString(),
            status: 'pending',
          });
          
          localStorage.setItem(storageKey, JSON.stringify(txs));
        }
        
        return { hash };
      }
      
      throw new Error('Could not get wallet client for token transfer');
    } catch (error) {
      console.error('Token transfer failed:', error);
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
        console.log('🔐 Opening Dynamic user profile');
      } else {
        // Fallback: show auth flow
        setShowAuthFlow(true);
        console.log('🔐 Opening auth flow for profile access');
      }
    } catch (error) {
      console.error('Failed to open profile:', error);
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
      console.log('🔑 Opening Dynamic user profile for wallet export...');
      
      // Open Dynamic user profile modal
      setShowDynamicUserProfile(true);
      
      console.log('✅ User profile modal opened');
      console.log('ℹ️ Note: MFA/Passkey must be set up to export private key');
      
    } catch (error) {
      console.error('Failed to open export:', error);
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
