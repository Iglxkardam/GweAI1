/**
 * DepositPage - Main deposit interface with AGW integration
 * 
 * Features:
 * - Abstract Global Wallet connection
 * - Animated flip card with balance and QR code
 * - Recent transaction history
 * - Real-time balance updates
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWallet, FaHistory, FaSync, FaArrowRight, FaTimes } from 'react-icons/fa';
import { StarfieldBackground } from '../../components';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useAgwWallet } from './hooks/useAgwWallet';
import { WalletConnectButton } from './components/WalletConnectButton';
import { DepositCard } from './components/DepositCard';
import { formatRelativeTime, formatBalanceWithSymbol, getExplorerUrl } from './utils/format';
import type { Transaction } from './types/wallet.types';
import { isAddress } from 'viem';
import { useGlobalPrices } from '../../context/PriceContext';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { TOKENS } from '../../config/tokens';
import { preloadWalletClient } from '../../utils/walletPreloader';
import { showErrorToast } from '../../utils/toastHelper';

export const DepositPage: React.FC = () => {
  const { 
    address, balance, ethBalance, usdcBalance, btcBalance, solBalance, bnbBalance,
    xrpBalance, tonBalance, avaxBalance, tronBalance, cardanoBalance, dogeBalance,
    connected, loading, email, refreshBalance, sendTransaction, sendToken, disconnect, exportPrivateKey,
    USDC_ADDRESS, BTC_ADDRESS, SOL_ADDRESS, BNB_ADDRESS, XRP_ADDRESS, TON_ADDRESS,
    AVAX_ADDRESS, TRON_ADDRESS, CARDANO_ADDRESS, DOGE_ADDRESS
  } = useAgwWallet();
  const { prices } = useGlobalPrices();
  const ETH_PRICE = prices.eth || 0;
  const USDC_PRICE = 1;
  const BTC_PRICE = prices.btc || 0;
  const SOL_PRICE = prices.sol || 139;
  const BNB_PRICE = prices.bnb || 931;
  const XRP_PRICE = prices.xrp || 2.21;
  const TON_PRICE = 1.80;
  const AVAX_PRICE = 14.73;
  const TRON_PRICE = 0.29;
  const CARDANO_PRICE = prices.ada || 0.47;
  const DOGE_PRICE = prices.doge || 0.16;
  const { primaryWallet } = useDynamicContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedToken, setSelectedToken] = useState<'ETH' | 'USDC'>('ETH');
  const [showAssets, setShowAssets] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendTokenType, setSendTokenType] = useState<'ETH' | 'USDC' | 'BTC' | 'SOL' | 'BNB' | 'XRP' | 'TON' | 'AVAX' | 'TRON' | 'CARDANO' | 'DOGE'>('ETH');
  const [sending, setSending] = useState(false);
  
  // Pagination constants
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransactions = transactions.slice(startIndex, endIndex);
  
  // Local state to track wallet connection process
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Stop loading once address is available (wallet fully created)
  useEffect(() => {
    if (address) {
      console.log('[DepositPage] ✅ Wallet ready, address available:', address);
      setIsConnecting(false);
    }
  }, [address]);

  // Monitor wallet creation progress - CRITICAL: Keep loading active during wallet creation
  useEffect(() => {
    if (connected && !address) {
      console.log('[DepositPage] ⏳ Wallet connected but address not ready yet (creating wallet)...');
      // Ensure loading state is active during wallet creation
      setIsConnecting(true);
    }
  }, [connected, address]);

  // Stop loading ONLY when we have a definitive result (success or explicit cancellation)
  useEffect(() => {
    // Don't use showAuthFlow to determine cancellation - it closes even during wallet creation
    // Only stop loading when we get an address (success) - cancellation is handled by event listener
    if (isConnecting && address) {
      console.log('[DepositPage] ✅ Wallet creation complete, stopping loading');
      setIsConnecting(false);
    }
  }, [isConnecting, address]);

  // Listen for wallet connection cancellation
  useEffect(() => {
    const handleCancel = () => {
      setIsConnecting(false);
    };
    window.addEventListener('wallet-connect-cancelled', handleCancel);
    return () => window.removeEventListener('wallet-connect-cancelled', handleCancel);
  }, []);

  // Load transactions from localStorage and backend - Optimized with proper cleanup
  useEffect(() => {
    if (!address) {
      setTransactions([]);
      setCurrentPage(1); // Reset to first page
      return;
    }

    let isMounted = true;

    // Load wallet-specific transactions from localStorage immediately
    const loadLocalTransactions = () => {
      try {
        const storageKey = `wallet_${address.toLowerCase()}_transactions`;
        const storedTxs = localStorage.getItem(storageKey);
        if (storedTxs && isMounted) {
          const txs = JSON.parse(storedTxs);
          setTransactions(txs);
          setCurrentPage(1); // Reset to first page when transactions change
        } else if (isMounted) {
          setTransactions([]);
          setCurrentPage(1);
        }
      } catch (error) {
        if (isMounted) {
          setTransactions([]);
          setCurrentPage(1);
        }
      }
    };

    loadLocalTransactions();

    const fetchTransactions = async () => {
      if (!isMounted) return;
      
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const response = await fetch(`${apiUrl}/api/transactions/${address}`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeout);
        
        if (response.ok && isMounted) {
          const data = await response.json();
          const backendTxs = data.transactions || [];
          
          // Merge with wallet-specific localStorage transactions
          const storageKey = `wallet_${address.toLowerCase()}_transactions`;
          const storedTxs = localStorage.getItem(storageKey);
          const localTxs = storedTxs ? JSON.parse(storedTxs) : [];
          
          // Combine and deduplicate by txHash
          const allTxs = [...localTxs, ...backendTxs];
          const uniqueTxs = Array.from(
            new Map(allTxs.map(tx => [tx.txHash, tx])).values()
          );
          
          // Sort by timestamp (newest first) and keep only last 20
          const sortedTxs = uniqueTxs
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, 20);
          
          if (isMounted) {
            setTransactions(sortedTxs);
            localStorage.setItem(storageKey, JSON.stringify(sortedTxs));
          }
        }
      } catch (error) {
        // Silently fail if backend is not running or timeout
      }
    };

    fetchTransactions();
    
    // Poll for updates every 60 seconds (optimized from 30s for scalability)
    const interval = setInterval(() => {
      if (isMounted) fetchTransactions();
    }, 60000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [address]);

  // Auto-refresh balances every 15 seconds when wallet is connected
  useEffect(() => {
    if (!connected || !address) return;

    // Initial refresh
    refreshBalance();

    // Set up polling for balance updates
    const balanceInterval = setInterval(() => {
      console.log('[DepositPage] Auto-refreshing balances...');
      refreshBalance();
    }, 15000); // 15 seconds

    return () => clearInterval(balanceInterval);
  }, [connected, address, refreshBalance]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSend = async () => {
    if (!isAddress(sendToAddress)) {
      showErrorToast(new Error('Invalid wallet address'));
      return;
    }

    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      showErrorToast(new Error('Invalid amount'));
      return;
    }

    // Get balance and token config based on type (VERIFIED from blockchain)
    const tokenConfig: Record<typeof sendTokenType, { balance: string; address?: string; decimals: number }> = {
      ETH: { balance: ethBalance, decimals: 18 },
      USDC: { balance: usdcBalance, address: USDC_ADDRESS, decimals: 6 },
      BTC: { balance: btcBalance, address: BTC_ADDRESS, decimals: 8 },
      SOL: { balance: solBalance, address: SOL_ADDRESS, decimals: 9 },
      BNB: { balance: bnbBalance, address: BNB_ADDRESS, decimals: 18 },
      XRP: { balance: xrpBalance, address: XRP_ADDRESS, decimals: 6 },
      TON: { balance: tonBalance, address: TON_ADDRESS, decimals: 9 },
      AVAX: { balance: avaxBalance, address: AVAX_ADDRESS, decimals: 18 },
      TRON: { balance: tronBalance, address: TRON_ADDRESS, decimals: 6 },
      CARDANO: { balance: cardanoBalance, address: CARDANO_ADDRESS, decimals: 6 },
      DOGE: { balance: dogeBalance, address: DOGE_ADDRESS, decimals: 8 },
    };
    
    const config = tokenConfig[sendTokenType];
    if (parseFloat(sendAmount) > parseFloat(config.balance)) {
      showErrorToast(new Error(`Insufficient ${sendTokenType} balance`));
      return;
    }

    setSending(true);

    try {
      // Use sendToken for ERC20 tokens, sendTransaction for ETH
      if (sendTokenType === 'ETH') {
        await sendTransaction(sendToAddress, sendAmount, 'ETH');
      } else {
        await sendToken(config.address!, sendToAddress, sendAmount, config.decimals);
      }
      
      // Reload transactions from wallet-specific localStorage immediately
      if (address) {
        const storageKey = `wallet_${address.toLowerCase()}_transactions`;
        const storedTxs = localStorage.getItem(storageKey);
        if (storedTxs) {
          setTransactions(JSON.parse(storedTxs));
        }
        
        // Reload again after 3 seconds to get the updated status
        setTimeout(() => {
          const updatedTxs = localStorage.getItem(storageKey);
          if (updatedTxs) {
            setTransactions(JSON.parse(updatedTxs));
          }
        }, 3500);
      }
      
      setShowSendModal(false);
      setSendToAddress('');
      setSendAmount('');
      
      await refreshBalance();
    } catch (error: any) {
      showErrorToast(error);
    } finally {
      setSending(false);
    }
  };

  // Show loading if SDK is loading OR connecting process started but card not ready
  // CRITICAL: Wait for address to be available, not just connected state
  const showLoading = useMemo(() => {
    // Loading during initial SDK load
    if (loading) return true;
    
    // Loading when user clicked connect but address not ready yet
    if (isConnecting && !address) return true;
    
    // Loading when connected is true but address still being created (new user)
    if (connected && !address) return true;
    
    return false;
  }, [loading, isConnecting, address, connected]);
  
  // Dynamic loading message based on state
  const loadingMessage = useMemo(() => {
    if (connected && !address) {
      return 'Creating your wallet ...';
    }
    if (isConnecting) {
      return 'Connecting wallet ...';
    }
    return 'Loading ...';
  }, [connected, address, isConnecting]);

  return (
    <div 
      className="min-h-screen pt-20 pb-8 px-4 relative deposit-page-container"
      style={{
        background: '#000',
        backgroundImage: `
          radial-gradient(circle at top right, rgba(121, 68, 154, 0.13), transparent),
          radial-gradient(circle at 20% 80%, rgba(41, 196, 255, 0.13), transparent)
        `
      }}
    >
      <StarfieldBackground optimized={true} />
      
      {/* Loading overlay with dynamic message */}
      {showLoading && <LoadingScreen message={loadingMessage} />}
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-3 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
                <FaWallet className="text-purple-400 text-3xl" />
              </div>
              <div className="text-center">
                <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Deposit Assets
                </h1>
                <p className="text-gray-300 text-base font-medium">
                  Powered by <span className="text-purple-400 font-semibold">Dynamic SDK</span> with Multi-Wallet Support
                </p>
              </div>
            </div>
          </div>
          
          {/* Wallet Connection */}
          {!connected && (
            <div className="flex justify-center">
              <WalletConnectButton onConnecting={() => setIsConnecting(true)} />
            </div>
          )}
        </motion.div>

        {/* Main Content */}
        {connected && address ? (
          <>
            {/* Deposit Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12 relative"
            >
              <div className="flex flex-col items-center gap-6">
                {/* Main Card - Centered */}
                <DepositCard
                  address={address}
                  email={email || undefined}
                  balance={balance}
                  symbol={selectedToken}
                  chainId={parseInt(import.meta.env.VITE_CHAIN_ID || '11124')}
                  usdValue={parseFloat(balance) * 2000}
                  onRefresh={handleRefresh}
                  selectedToken={selectedToken}
                  onTokenChange={setSelectedToken}
                  onShowAssets={() => setShowAssets(!showAssets)}
                  onExportKey={exportPrivateKey}
                  onDisconnect={disconnect}
                />

                {/* Assets Panel - Slides in from right */}
                <motion.div
                  initial={false}
                  animate={{ 
                    opacity: showAssets ? 1 : 0,
                    x: showAssets ? 0 : 50,
                    scale: showAssets ? 1 : 0.95
                  }}
                  transition={{ 
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  style={{ display: showAssets ? 'block' : 'none' }}
                  className="w-full max-w-5xl"
                >
                  <div className="bg-transparent backdrop-blur-sm rounded-2xl p-6 border-0">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <FaWallet className="text-gray-300" />
                      Your Assets
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {[
                        { symbol: TOKENS.ETH.symbol, name: TOKENS.ETH.name, balance: ethBalance, price: ETH_PRICE, logo: TOKENS.ETH.logo, decimals: 4, canSend: true },
                        { symbol: TOKENS.BTC.symbol, name: TOKENS.BTC.name, balance: btcBalance, price: BTC_PRICE, logo: TOKENS.BTC.logo, decimals: 6, canSend: true },
                        { symbol: TOKENS.SOL.symbol, name: TOKENS.SOL.name, balance: solBalance, price: SOL_PRICE, logo: TOKENS.SOL.logo, decimals: 4, canSend: true },
                        { symbol: TOKENS.BNB.symbol, name: TOKENS.BNB.name, balance: bnbBalance, price: BNB_PRICE, logo: TOKENS.BNB.logo, decimals: 6, canSend: true },
                        { symbol: TOKENS.XRP.symbol, name: TOKENS.XRP.name, balance: xrpBalance, price: XRP_PRICE, logo: TOKENS.XRP.logo, decimals: 4, canSend: true },
                        { symbol: TOKENS.TON.symbol, name: TOKENS.TON.name, balance: tonBalance, price: TON_PRICE, logo: TOKENS.TON.logo, decimals: 4, canSend: true },
                        { symbol: TOKENS.AVAX.symbol, name: TOKENS.AVAX.name, balance: avaxBalance, price: AVAX_PRICE, logo: TOKENS.AVAX.logo, decimals: 4, canSend: true },
                        { symbol: TOKENS.TRX.symbol, name: TOKENS.TRX.name, balance: tronBalance, price: TRON_PRICE, logo: TOKENS.TRX.logo, decimals: 4, canSend: true },
                        { symbol: TOKENS.ADA.symbol, name: TOKENS.ADA.name, balance: cardanoBalance, price: CARDANO_PRICE, logo: TOKENS.ADA.logo, decimals: 4, canSend: true },
                        { symbol: TOKENS.DOGE.symbol, name: TOKENS.DOGE.name, balance: dogeBalance, price: DOGE_PRICE, logo: TOKENS.DOGE.logo, decimals: 4, canSend: true },
                        { symbol: TOKENS.USDC.symbol, name: TOKENS.USDC.name, balance: usdcBalance, price: USDC_PRICE, logo: TOKENS.USDC.logo, decimals: 2, canSend: true },
                      ]
                        .filter(token => parseFloat(token.balance) > 0)
                        .map((token, index) => (
                          <motion.div
                            key={token.symbol}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-white/[0.08] hover:border-white/[0.12] transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <img src={token.logo} alt={token.symbol} className="w-10 h-10" />
                                <div>
                                  <p className="text-white font-semibold text-lg">{token.symbol}</p>
                                  <p className="text-gray-400 text-xs">{token.name}</p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-white/[0.08]">
                              <p className="text-2xl font-bold text-white">
                                {parseFloat(token.balance).toFixed(token.decimals)}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                ≈ ${(parseFloat(token.balance) * token.price).toFixed(2)} USD
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSendTokenType(token.symbol as any);
                                  setShowSendModal(true);
                                }}
                                onMouseEnter={() => preloadWalletClient(primaryWallet)}
                                onFocus={() => preloadWalletClient(primaryWallet)}
                                className="mt-3 w-full px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.15] hover:border-white/[0.25] rounded-lg text-sm text-white font-semibold transition-all duration-200"
                              >
                                Send
                              </button>
                            </div>
                          </motion.div>
                        ))
                      }
                    </div>

                    {/* Total Value */}
                    <div className="pt-4 mt-6 border-t border-white/[0.08]">
                      <p className="text-gray-400 text-sm mb-1">Total Portfolio Value</p>
                      <p className="text-3xl font-bold text-white">
                        ${(
                          (parseFloat(ethBalance) * ETH_PRICE) +
                          (parseFloat(btcBalance) * BTC_PRICE) +
                          (parseFloat(solBalance) * SOL_PRICE) +
                          (parseFloat(bnbBalance) * BNB_PRICE) +
                          (parseFloat(xrpBalance) * XRP_PRICE) +
                          (parseFloat(tonBalance) * TON_PRICE) +
                          (parseFloat(avaxBalance) * AVAX_PRICE) +
                          (parseFloat(tronBalance) * TRON_PRICE) +
                          (parseFloat(cardanoBalance) * CARDANO_PRICE) +
                          (parseFloat(dogeBalance) * DOGE_PRICE) +
                          (parseFloat(usdcBalance) * USDC_PRICE)
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-transparent backdrop-blur-sm rounded-xl border-0 p-6 max-w-2xl mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaHistory />
                  Recent Activity
                </h3>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200"
                  title="Refresh"
                >
                  <FaSync className={`text-white ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {transactions.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {currentTransactions.map((tx, index) => {
                    // Ensure type and status have default values
                    const txType = tx.type || 'deposit';
                    const txStatus = tx.status || 'pending';
                    
                    return (
                      <a
                        key={tx.id || tx.txHash || `tx-${index}`}
                        href={getExplorerUrl(tx.txHash, 11124, 'tx')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/[0.08] hover:border-white/[0.12] transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                            <FaWallet className="text-purple-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">
                              {txType.charAt(0).toUpperCase() + txType.slice(1)}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {formatRelativeTime(tx.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium text-sm">
                            {formatBalanceWithSymbol(tx.amount, tx.tokenSymbol)}
                          </p>
                          <p className={`text-xs ${
                            txStatus === 'completed' ? 'text-green-400' :
                            txStatus === 'pending' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {txStatus.charAt(0).toUpperCase() + txStatus.slice(1)}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.08]">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          currentPage === 1
                            ? 'bg-white/[0.03] text-gray-500 cursor-not-allowed'
                            : 'bg-white/[0.08] text-white hover:bg-white/[0.12]'
                        }`}
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <span className="text-gray-500 text-xs">
                          ({transactions.length} total)
                        </span>
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          currentPage === totalPages
                            ? 'bg-white/[0.03] text-gray-500 cursor-not-allowed'
                            : 'bg-white/[0.08] text-white hover:bg-white/[0.12]'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No deposit history yet</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Your deposits will appear here
                  </p>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          /* Welcome Message */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.00005] p-12 max-w-xl mx-auto text-center"
          >
            <div className="mb-8 text-center">
  <FaWallet className="text-6xl text-purple-100 mx-auto mb-4" />
  <h2 className="text-2xl font-bold text-white mb-2">
    Welcome to 
    <span className="font-fantasy ml-0 text-red-300 tracking-wide"> GweAI </span>
    Wallet
  </h2>
  <p className="text-gray-400 text-lg">
    {loading ? 'Loading your wallet...' : 'Connect your wallet to get started'}
  </p>
</div>


            
          </motion.div>
        )}
      </div>

      {/* Send Modal */}
      <AnimatePresence>
        {showSendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSendModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-transparent backdrop-blur-sm rounded-2xl p-6 max-w-md w-full border-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Send {sendTokenType}
                </h3>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Recipient Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={sendToAddress}
                    onChange={(e) => setSendToAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/[0.15] transition-colors"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.0"
                      step="0.000001"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/[0.15] transition-colors pr-20"
                    />
                    <button
                      onClick={() => {
                        const balances: Record<typeof sendTokenType, string> = {
                          ETH: ethBalance, USDC: usdcBalance, BTC: btcBalance, SOL: solBalance,
                          BNB: bnbBalance, XRP: xrpBalance, TON: tonBalance, AVAX: avaxBalance,
                          TRON: tronBalance, CARDANO: cardanoBalance, DOGE: dogeBalance
                        };
                        const balance = balances[sendTokenType];
                        setSendAmount(balance);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.15] rounded-lg text-xs text-white font-medium transition-all"
                    >
                      MAX
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Balance: {(() => {
                      const balances: Record<typeof sendTokenType, string> = {
                        ETH: ethBalance, USDC: usdcBalance, BTC: btcBalance, SOL: solBalance,
                        BNB: bnbBalance, XRP: xrpBalance, TON: tonBalance, AVAX: avaxBalance,
                        TRON: tronBalance, CARDANO: cardanoBalance, DOGE: dogeBalance
                      };
                      return parseFloat(balances[sendTokenType]).toFixed(sendTokenType === 'USDC' ? 2 : sendTokenType === 'ETH' ? 4 : sendTokenType === 'BTC' ? 6 : 4);
                    })()} {sendTokenType}
                  </p>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={sending || !sendToAddress || !sendAmount}
                  className={`w-full px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border ${
                    sending || !sendToAddress || !sendAmount
                      ? 'bg-white/[0.03] text-gray-500 cursor-not-allowed border-white/[0.05]'
                      : 'bg-white/[0.08] hover:bg-white/[0.12] text-white border-white/[0.12] hover:border-white/[0.2]'
                  }`}
                >
                  {sending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send {sendTokenType}
                      <FaArrowRight />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
