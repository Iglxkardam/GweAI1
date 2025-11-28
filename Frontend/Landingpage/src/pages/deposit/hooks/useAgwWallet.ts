/**
 * React hook for Base Sepolia Wallet with Dynamic Embedded Wallet
 * 
 * Dynamic embedded wallet - No MetaMask/extension needed!
 * 
 * @see https://docs.dynamic.xyz
 * @see https://docs.base.org
 */

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { formatEther, parseEther, formatUnits } from 'viem';
import { storageService } from '../../../utils/indexedDBService';
import { getPublicClient } from '../../../utils/rpcProvider';
import { logError } from '../../../utils/errorHandler';
import { showErrorToast, showWarningToast } from '../../../utils/toastHelper';

// Token Contract Addresses on Base Sepolia (PRODUCTION DEPLOYMENT)
const USDC_TOKEN_ADDRESS = '0xBEE08798a3634e29F47e3d277C9d11507D55F66a'; // USDC (Liquidity Pool Base)
const BTC_TOKEN_ADDRESS = '0x7d9E31f5cCac4b9c8566f343A6bD6f3263DFcC91';   // BTC
const SOL_TOKEN_ADDRESS = '0x241ECE6Dce0E0825F9992410B3fA5d4b8fC8d199';   // SOL
const BNB_TOKEN_ADDRESS = '0xAA9Be1a8A7f7254C1759bAa7e0f7864579c33a96';   // BNB
const XRP_TOKEN_ADDRESS = '0x01E278B5421AAC93A206C15b2933419DA19E17b3';   // XRP
const TON_TOKEN_ADDRESS = '0xC85D84a1092b81aCBA9bC75fad6063a7DA642E36';   // TON
const AVAX_TOKEN_ADDRESS = '0x5DC449E37b6DAAD182d4Fb13C8dFE53C383C2E46';  // AVAX
const TRON_TOKEN_ADDRESS = '0x45442ecB66A1a10c0F9817fb7F2B50a3bB99bd69';  // TRON
const CARDANO_TOKEN_ADDRESS = '0xcB1A4c81E7a56cbE2246DA3aE256Ba0154940648'; // CARDANO
const DOGE_TOKEN_ADDRESS = '0x803aD69f487536Ec1eE8a83Cd329e3d1703f8337';    // DOGE

// Token Configuration (VERIFIED decimals from actual deployed contracts)
export const SUPPORTED_TOKENS = {
  BTC: { address: BTC_TOKEN_ADDRESS, decimals: 8, symbol: 'BTC', name: 'Bitcoin' },
  SOL: { address: SOL_TOKEN_ADDRESS, decimals: 9, symbol: 'SOL', name: 'Solana' },
  BNB: { address: BNB_TOKEN_ADDRESS, decimals: 18, symbol: 'BNB', name: 'BNB' },
  XRP: { address: XRP_TOKEN_ADDRESS, decimals: 6, symbol: 'XRP', name: 'Ripple' },
  TON: { address: TON_TOKEN_ADDRESS, decimals: 9, symbol: 'TON', name: 'Toncoin' },
  AVAX: { address: AVAX_TOKEN_ADDRESS, decimals: 18, symbol: 'AVAX', name: 'Avalanche' },
  TRON: { address: TRON_TOKEN_ADDRESS, decimals: 6, symbol: 'TRON', name: 'Tron' },
  CARDANO: { address: CARDANO_TOKEN_ADDRESS, decimals: 6, symbol: 'CARDANO', name: 'Cardano' },
  DOGE: { address: DOGE_TOKEN_ADDRESS, decimals: 8, symbol: 'DOGE', name: 'Dogecoin' },
  USDC: { address: USDC_TOKEN_ADDRESS, decimals: 6, symbol: 'USDC', name: 'USD Coin' },
} as const;

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
  
  // Cache wallet client to avoid repeated calls
  const walletClientRef = useRef<any>(null);
  
  const [ethBalance, setEthBalance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [btcBalance, setBtcBalance] = useState('0');
  const [solBalance, setSolBalance] = useState('0');
  const [bnbBalance, setBnbBalance] = useState('0');
  const [xrpBalance, setXrpBalance] = useState('0');
  const [tonBalance, setTonBalance] = useState('0');
  const [avaxBalance, setAvaxBalance] = useState('0');
  const [tronBalance, setTronBalance] = useState('0');
  const [cardanoBalance, setCardanoBalance] = useState('0');
  const [dogeBalance, setDogeBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  
  const address = useMemo(() => primaryWallet?.address, [primaryWallet?.address]);
  const authenticated = !!primaryWallet;
  
  // Use singleton publicClient instead of creating new one every time
  const publicClient = useMemo(() => getPublicClient(), []);
  
  // Get cached wallet client
  const getCachedWalletClient = useCallback(async () => {
    if (walletClientRef.current) {
      return walletClientRef.current;
    }
    
    if (!primaryWallet) return null;
    
    const walletClient = await (primaryWallet as any).getWalletClient?.();
    if (walletClient) {
      walletClientRef.current = walletClient;
    }
    return walletClient;
  }, [primaryWallet]);
  
  // Clear cache when wallet changes
  useEffect(() => {
    walletClientRef.current = null;
    
    // OPTIMIZATION: Preload wallet client immediately when wallet connects
    if (primaryWallet) {
      // Warm up the wallet client in background (non-blocking)
      (primaryWallet as any).getWalletClient?.().then((client: any) => {
        if (client) {
          walletClientRef.current = client;
          console.log('[useAgwWallet] ✅ Wallet client preloaded and cached');
        }
      }).catch((err: any) => {
        console.warn('[useAgwWallet] Wallet client preload failed (will retry on demand):', err);
      });
    }
  }, [primaryWallet]);
  
  // Fetch all balances (ETH + All 10 Tokens) - Optimized with timeout and error recovery
  const refreshBalance = useCallback(async () => {
    if (!primaryWallet) {
      setEthBalance('0');
      setUsdcBalance('0');
      setBtcBalance('0');
      setSolBalance('0');
      setBnbBalance('0');
      setXrpBalance('0');
      setTonBalance('0');
      setAvaxBalance('0');
      setTronBalance('0');
      setCardanoBalance('0');
      setDogeBalance('0');
      return;
    }
    
    try {
      const rpcUrl = 'https://base-sepolia.g.alchemy.com/v2/demo';
      const timeout = 10000; // 10 second timeout
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Helper function to create token balance call
      const createTokenCall = (tokenAddress: string, id: number) => 
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            jsonrpc: '2.0', 
            id, 
            method: 'eth_call', 
            params: [{
              to: tokenAddress,
              data: `0x70a08231000000000000000000000000${primaryWallet.address.slice(2)}`,
            }, 'latest']
          }),
          signal: controller.signal,
        }).then(r => r.json()).then(d => d.result);
      
      // Fetch all balances in parallel for maximum speed
      const [
        ethBal, 
        usdcData, 
        btcData, 
        solData, 
        bnbData, 
        xrpData, 
        tonData, 
        avaxData, 
        tronData, 
        cardanoData, 
        dogeData
      ] = await Promise.allSettled([
        // ETH balance
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            jsonrpc: '2.0', 
            id: 1, 
            method: 'eth_getBalance', 
            params: [primaryWallet.address, 'latest'] 
          }),
          signal: controller.signal,
        }).then(r => r.json()).then(d => d.result),
        
        // Token balances
        createTokenCall(USDC_TOKEN_ADDRESS, 2),
        createTokenCall(BTC_TOKEN_ADDRESS, 3),
        createTokenCall(SOL_TOKEN_ADDRESS, 4),
        createTokenCall(BNB_TOKEN_ADDRESS, 5),
        createTokenCall(XRP_TOKEN_ADDRESS, 6),
        createTokenCall(TON_TOKEN_ADDRESS, 7),
        createTokenCall(AVAX_TOKEN_ADDRESS, 8),
        createTokenCall(TRON_TOKEN_ADDRESS, 9),
        createTokenCall(CARDANO_TOKEN_ADDRESS, 10),
        createTokenCall(DOGE_TOKEN_ADDRESS, 11),
      ]);
      
      clearTimeout(timeoutId);
      
      // Process ETH balance
      if (ethBal.status === 'fulfilled' && ethBal.value) {
        setEthBalance(formatEther(BigInt(ethBal.value)));
      } else {
        setEthBalance('0');
      }
      
      // Process USDC balance (6 decimals)
      if (usdcData.status === 'fulfilled' && usdcData.value && usdcData.value !== '0x') {
        setUsdcBalance(formatUnits(BigInt(usdcData.value), 6));
      } else {
        setUsdcBalance('0');
      }
      
      // Process BTC balance (8 decimals)
      if (btcData.status === 'fulfilled' && btcData.value && btcData.value !== '0x') {
        setBtcBalance(formatUnits(BigInt(btcData.value), 8));
      } else {
        setBtcBalance('0');
      }
      
      // Process SOL balance (9 decimals - CORRECTED)
      if (solData.status === 'fulfilled' && solData.value && solData.value !== '0x') {
        setSolBalance(formatUnits(BigInt(solData.value), 9));
      } else {
        setSolBalance('0');
      }
      
      // Process BNB balance (18 decimals - CORRECTED)
      if (bnbData.status === 'fulfilled' && bnbData.value && bnbData.value !== '0x') {
        setBnbBalance(formatUnits(BigInt(bnbData.value), 18));
      } else {
        setBnbBalance('0');
      }
      
      // Process XRP balance (6 decimals - CORRECTED)
      if (xrpData.status === 'fulfilled' && xrpData.value && xrpData.value !== '0x') {
        setXrpBalance(formatUnits(BigInt(xrpData.value), 6));
      } else {
        setXrpBalance('0');
      }
      
      // Process TON balance (9 decimals - CORRECTED)
      if (tonData.status === 'fulfilled' && tonData.value && tonData.value !== '0x') {
        setTonBalance(formatUnits(BigInt(tonData.value), 9));
      } else {
        setTonBalance('0');
      }
      
      // Process AVAX balance (18 decimals - CORRECTED)
      if (avaxData.status === 'fulfilled' && avaxData.value && avaxData.value !== '0x') {
        setAvaxBalance(formatUnits(BigInt(avaxData.value), 18));
      } else {
        setAvaxBalance('0');
      }
      
      // Process TRON balance (6 decimals - CORRECTED)
      if (tronData.status === 'fulfilled' && tronData.value && tronData.value !== '0x') {
        setTronBalance(formatUnits(BigInt(tronData.value), 6));
      } else {
        setTronBalance('0');
      }
      
      // Process CARDANO balance (6 decimals - CORRECTED)
      if (cardanoData.status === 'fulfilled' && cardanoData.value && cardanoData.value !== '0x') {
        setCardanoBalance(formatUnits(BigInt(cardanoData.value), 6));
      } else {
        setCardanoBalance('0');
      }
      
      // Process DOGE balance (8 decimals)
      if (dogeData.status === 'fulfilled' && dogeData.value && dogeData.value !== '0x') {
        setDogeBalance(formatUnits(BigInt(dogeData.value), 8));
      } else {
        setDogeBalance('0');
      }
    } catch (error) {
      // Silent fail - keep previous balances or set to 0
      console.warn('Balance fetch timeout or error:', error);
      setEthBalance('0');
      setUsdcBalance('0');
      setBtcBalance('0');
      setSolBalance('0');
      setBnbBalance('0');
      setXrpBalance('0');
      setTonBalance('0');
      setAvaxBalance('0');
      setTronBalance('0');
      setCardanoBalance('0');
      setDogeBalance('0');
    }
  }, [primaryWallet]);
  
  // Fetch balance once when wallet connects - with debounce to prevent multiple calls
  useEffect(() => {
    if (!authenticated || !address) return;
    
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) refreshBalance();
    }, 500); // Debounce 500ms to prevent rapid consecutive calls
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [authenticated, address, refreshBalance]);

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
    _tokenType: 'ETH' | 'USDC' = 'ETH',
    data?: string,
    skipSave?: boolean
  ) => {
    if (!primaryWallet) {
      throw new Error('No wallet connected');
    }
    try {
      const amountInWei = parseEther(value);
      
      // Use cached wallet client
      const walletClient = await getCachedWalletClient();
      
      if (walletClient) {
        // Log transaction details
        console.log('sendTransaction called:', {
          to,
          value,
          amountInWei: amountInWei.toString(),
          data,
          hasData: !!data,
          dataLength: data?.length
        });
        
        // Build transaction object
        const txParams: any = {
          to: to as `0x${string}`,
          value: amountInWei,
        };
        
        // Only add data if it exists and is valid
        if (data && data.startsWith('0x') && data.length > 2) {
          txParams.data = data as `0x${string}`;
          console.log('Adding data to transaction:', data);
        }
        
        // Use viem's wallet client directly
        const hash = await walletClient.sendTransaction(txParams);
        
        // Use singleton publicClient (already cached)
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        // Save to localStorage only after confirmation (skip for vault transactions)
        if (!skipSave && primaryWallet.address && receipt.status === 'success') {
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
          data: data as `0x${string}` | undefined,
        });
        
        // Use singleton publicClient
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        // Save to localStorage only after confirmation (skip for vault transactions)
        if (!skipSave && primaryWallet.address && receipt.status === 'success') {
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
    } catch (error: any) {
      logError('SendTransaction', error);
      showErrorToast(error);
      throw error;
      throw error;
    }
  }, [primaryWallet, getCachedWalletClient, publicClient]);

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
      console.log('[useAgwWallet] 🚀 Starting token transfer...');
      
      // ERC20 transfer function selector: 0xa9059cbb
      // transfer(address to, uint256 amount)
      const amountBigInt = BigInt(Math.floor(Number(amount) * Math.pow(10, decimals)));
      const amountHex = amountBigInt.toString(16).padStart(64, '0');
      const toAddressHex = to.toLowerCase().replace('0x', '').padStart(64, '0');
      const data = `0xa9059cbb${toAddressHex}${amountHex}` as `0x${string}`;
      
      // OPTIMIZATION: Use cached client if available
      let walletClient = walletClientRef.current;
      
      if (!walletClient) {
        console.log('[useAgwWallet] ⚡ Fetching wallet client for token transfer...');
        walletClient = await getCachedWalletClient();
      } else {
        console.log('[useAgwWallet] ✅ Using cached wallet client (instant)');
      }
      
      if (walletClient) {
        const hash = await walletClient.sendTransaction({
          to: tokenAddress as `0x${string}`,
          data,
        });
        
        // Use singleton publicClient
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        // Save to localStorage only after confirmation
        if (primaryWallet.address && receipt.status === 'success') {
          const storageKey = `wallet_${primaryWallet.address.toLowerCase()}_transactions`;
          const storedTxs = localStorage.getItem(storageKey);
          const txs = storedTxs ? JSON.parse(storedTxs) : [];
          
          // Map token address to proper symbol
          const tokenAddressMap: Record<string, string> = {
            '0xBEE08798a3634e29F47e3d277C9d11507D55F66a': 'USDC',
            '0x7d9E31f5cCac4b9c8566f343A6bD6f3263DFcC91': 'BTC',
            '0x241ECE6Dce0E0825F9992410B3fA5d4b8fC8d199': 'SOL',
            '0xAA9Be1a8A7f7254C1759bAa7e0f7864579c33a96': 'BNB',
            '0x01E278B5421AAC93A206C15b2933419DA19E17b3': 'XRP',
            '0xC85D84a1092b81aCBA9bC75fad6063a7DA642E36': 'TON',
            '0x5DC449E37b6DAAD182d4Fb13C8dFE53C383C2E46': 'AVAX',
            '0x45442ecB66A1a10c0F9817fb7F2B50a3bB99bd69': 'TRX',
            '0xcB1A4c81E7a56cbE2246DA3aE256Ba0154940648': 'ADA',
            '0x803aD69f487536Ec1eE8a83Cd329e3d1703f8337': 'DOGE',
          };
          const tokenSymbol = tokenAddressMap[tokenAddress] || 'TOKEN';
          
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
        
        // Use singleton publicClient
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        // Save to localStorage only after confirmation
        if (primaryWallet.address && receipt.status === 'success') {
          const storageKey = `wallet_${primaryWallet.address.toLowerCase()}_transactions`;
          const storedTxs = localStorage.getItem(storageKey);
          const txs = storedTxs ? JSON.parse(storedTxs) : [];
          
          // Map token address to proper symbol (same as primary path)
          const tokenAddressMap: Record<string, string> = {
            '0xBEE08798a3634e29F47e3d277C9d11507D55F66a': 'USDC',
            '0x7d9E31f5cCac4b9c8566f343A6bD6f3263DFcC91': 'BTC',
            '0x241ECE6Dce0E0825F9992410B3fA5d4b8fC8d199': 'SOL',
            '0xAA9Be1a8A7f7254C1759bAa7e0f7864579c33a96': 'BNB',
            '0x01E278B5421AAC93A206C15b2933419DA19E17b3': 'XRP',
            '0xC85D84a1092b81aCBA9bC75fad6063a7DA642E36': 'TON',
            '0x5DC449E37b6DAAD182d4Fb13C8dFE53C383C2E46': 'AVAX',
            '0x45442ecB66A1a10c0F9817fb7F2B50a3bB99bd69': 'TRX',
            '0xcB1A4c81E7a56cbE2246DA3aE256Ba0154940648': 'ADA',
            '0x803aD69f487536Ec1eE8a83Cd329e3d1703f8337': 'DOGE',
          };
          const tokenSymbol = tokenAddressMap[tokenAddress] || 'TOKEN';
          
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
    } catch (error: any) {
      logError('SendToken', error);
      showErrorToast(error);
      throw error;
      throw error;
    }
  }, [primaryWallet, getCachedWalletClient, publicClient]);

  /**
   * Add Passkey MFA - Opens Dynamic's user profile modal
   * Dashboard mein MFA already enable hai, user ko profile se add karna hoga
   */
  const handleAddPasskey = useCallback(async () => {
    if (!authenticated) {
      showWarningToast('Wallet Not Connected', 'Please connect your wallet first', 'Click "Connect Wallet" to continue');
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
      showWarningToast('Profile Unavailable', 'Unable to open profile', 'Try clicking your wallet address in the top right');
    }
  }, [authenticated, setShowDynamicUserProfile, setShowAuthFlow]);

  /**
   * Export Private Key - Opens Dynamic's wallet export modal
   * ⚠️ IMPORTANT: User ko private key backup lene ke liye
   * Note: MFA/Passkey setup required for export
   */
  const exportPrivateKey = useCallback(async () => {
    if (!authenticated) {
      showWarningToast('Wallet Not Connected', 'Please connect your wallet first', 'Click "Connect Wallet" to continue');
      return;
    }
    
    try {
      // Open Dynamic user profile modal
      setShowDynamicUserProfile(true);
    } catch (error) {
      showWarningToast('Settings Unavailable', 'Please click your wallet address in the top right corner', 'Access wallet settings from there');
    }
  }, [authenticated, setShowDynamicUserProfile]);

  return {
    // State
    address: address || null,
    balance: ethBalance,
    ethBalance,
    usdcBalance,
    btcBalance,
    solBalance,
    bnbBalance,
    xrpBalance,
    tonBalance,
    avaxBalance,
    tronBalance,
    cardanoBalance,
    dogeBalance,
    connected: authenticated,
    loading: loading,
    error: null,
    email: user?.email || null,

    // Token Addresses
    USDC_ADDRESS: USDC_TOKEN_ADDRESS,
    BTC_ADDRESS: BTC_TOKEN_ADDRESS,
    SOL_ADDRESS: SOL_TOKEN_ADDRESS,
    BNB_ADDRESS: BNB_TOKEN_ADDRESS,
    XRP_ADDRESS: XRP_TOKEN_ADDRESS,
    TON_ADDRESS: TON_TOKEN_ADDRESS,
    AVAX_ADDRESS: AVAX_TOKEN_ADDRESS,
    TRON_ADDRESS: TRON_TOKEN_ADDRESS,
    CARDANO_ADDRESS: CARDANO_TOKEN_ADDRESS,
    DOGE_ADDRESS: DOGE_TOKEN_ADDRESS,

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
export { 
  USDC_TOKEN_ADDRESS, 
  BTC_TOKEN_ADDRESS,
  SOL_TOKEN_ADDRESS,
  BNB_TOKEN_ADDRESS,
  XRP_TOKEN_ADDRESS,
  TON_TOKEN_ADDRESS,
  AVAX_TOKEN_ADDRESS,
  TRON_TOKEN_ADDRESS,
  CARDANO_TOKEN_ADDRESS,
  DOGE_TOKEN_ADDRESS
};
