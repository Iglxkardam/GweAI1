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
import { useCryptoPrice } from '../../hooks/useCryptoPrice';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

export const DepositPage: React.FC = () => {
  const { address, balance, ethBalance, usdcBalance, btcBalance, connected, loading, email, refreshBalance, sendTransaction, sendToken, disconnect, exportPrivateKey, USDC_ADDRESS } = useAgwWallet();
  const { eth: ETH_PRICE, usdc: USDC_PRICE } = useCryptoPrice();
  const { showAuthFlow } = useDynamicContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedToken, setSelectedToken] = useState<'ETH' | 'USDC'>('ETH');
  const [showAssets, setShowAssets] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendTokenType, setSendTokenType] = useState<'ETH' | 'USDC'>('ETH');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  
  // Local state to track wallet connection process
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Stop loading once address is available OR if auth flow closes without connection
  useEffect(() => {
    if (address) {
      // Immediately stop loading when address is available
      setIsConnecting(false);
    }
  }, [address]);

  // Stop loading if auth flow is closed but no wallet connected
  useEffect(() => {
    if (!showAuthFlow && isConnecting && !connected) {
      // Auth flow closed without connecting, stop loading
      setIsConnecting(false);
    }
  }, [showAuthFlow, isConnecting, connected]);

  // Listen for wallet connection cancellation
  useEffect(() => {
    const handleCancel = () => {
      setIsConnecting(false);
    };
    window.addEventListener('wallet-connect-cancelled', handleCancel);
    return () => window.removeEventListener('wallet-connect-cancelled', handleCancel);
  }, []);

  // Load transactions from localStorage and backend
  useEffect(() => {
    if (!address) {
      // Clear transactions when wallet disconnects
      setTransactions([]);
      return;
    }

    // Load wallet-specific transactions from localStorage immediately
    const loadLocalTransactions = () => {
      try {
        const storageKey = `wallet_${address.toLowerCase()}_transactions`;
        const storedTxs = localStorage.getItem(storageKey);
        if (storedTxs) {
          const txs = JSON.parse(storedTxs);
          setTransactions(txs);
        } else {
          setTransactions([]); // Clear if no data for this wallet
        }
      } catch (error) {
        setTransactions([]);
      }
    };

    loadLocalTransactions();

    const fetchTransactions = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/transactions/${address}`);
        
        if (response.ok) {
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
          
          setTransactions(uniqueTxs);
          
          // Update localStorage with merged data
          localStorage.setItem(storageKey, JSON.stringify(uniqueTxs));
        }
      } catch (error) {
        // Silently fail if backend is not running (dev mode)
      }
    };

    fetchTransactions();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, [address]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSend = async () => {
    setSendError('');
    
    if (!isAddress(sendToAddress)) {
      setSendError('Invalid wallet address');
      return;
    }

    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      setSendError('Invalid amount');
      return;
    }

    const balance = sendTokenType === 'ETH' ? ethBalance : usdcBalance;
    if (parseFloat(sendAmount) > parseFloat(balance)) {
      setSendError(`Insufficient ${sendTokenType} balance`);
      return;
    }

    setSending(true);

    try {
      // Use sendToken for USDC, sendTransaction for ETH
      if (sendTokenType === 'USDC') {
        await sendToken(USDC_ADDRESS, sendToAddress, sendAmount, 6);
      } else {
        await sendTransaction(sendToAddress, sendAmount, sendTokenType);
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
      setSendError(error.message || 'Transaction failed');
    } finally {
      setSending(false);
    }
  };

  // Show loading if SDK is loading OR connecting process started but card not ready
  const showLoading = useMemo(() => 
    loading || (isConnecting && !address),
    [loading, isConnecting, address]
  );

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
      
      {/* Loading overlay */}
      {showLoading && <LoadingScreen />}
      
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
              <div className="flex justify-center items-start gap-6">
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
                  className="w-80"
                >
                  <div className="bg-transparent backdrop-blur-sm rounded-2xl p-6 border-0">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <FaWallet className="text-gray-300" />
                      Your Assets
                    </h3>
                    
                    <div className="space-y-4">
                      {/* ETH Asset */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-white/[0.08] hover:border-white/[0.12] transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center">
                              <span className="text-xl text-white brightness-150">Ξ</span>
                            </div>
                            <div>
                              <p className="text-white font-semibold text-lg">ETH</p>
                              <p className="text-gray-400 text-xs">Ethereum</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/[0.08]">
                          <p className="text-2xl font-bold text-white">
                            {parseFloat(ethBalance).toFixed(4)}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            ≈ ${(parseFloat(ethBalance) * ETH_PRICE).toFixed(2)} USD
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSendTokenType('ETH');
                              setShowSendModal(true);
                            }}
                            className="mt-3 w-full px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.15] rounded-lg text-sm text-white font-medium transition-all duration-200"
                          >
                            Send
                          </button>
                        </div>
                      </motion.div>

                      {/* USDC Asset */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-white/[0.08] hover:border-white/[0.12] transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center">
                              <span className="text-xl text-white brightness-150">$</span>
                            </div>
                            <div>
                              <p className="text-white font-semibold text-lg">USDC</p>
                              <p className="text-gray-400 text-xs">USD Coin</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/[0.08]">
                          <p className="text-2xl font-bold text-white">
                            {parseFloat(usdcBalance).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            ≈ ${parseFloat(usdcBalance).toFixed(2)} USD
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSendTokenType('USDC');
                              setShowSendModal(true);
                            }}
                            className="mt-3 w-full px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.15] rounded-lg text-sm text-white font-medium transition-all duration-200"
                          >
                            Send
                          </button>
                        </div>
                      </motion.div>

                      {/* BTC Asset */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-white/[0.08] hover:border-white/[0.12] transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center">
                              <span className="text-xl text-white brightness-150">₿</span>
                            </div>
                            <div>
                              <p className="text-white font-semibold text-lg">cbBTC</p>
                              <p className="text-gray-400 text-xs">Coinbase Bitcoin</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/[0.08]">
                          <p className="text-2xl font-bold text-white">
                            {parseFloat(btcBalance).toFixed(6)}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            ≈ ${(parseFloat(btcBalance) * 45000).toFixed(2)} USD
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert('BTC send coming soon!');
                            }}
                            className="mt-3 w-full px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.15] rounded-lg text-sm text-white font-medium transition-all duration-200"
                          >
                            Send
                          </button>
                        </div>
                      </motion.div>

                      {/* Total Value */}
                      <div className="pt-4 border-t border-white/[0.08]">
                        <p className="text-gray-400 text-sm mb-1">Total Portfolio Value</p>
                        <p className="text-3xl font-bold text-white">
                          ${((parseFloat(ethBalance) * ETH_PRICE) + (parseFloat(usdcBalance) * USDC_PRICE) + (parseFloat(btcBalance) * 45000)).toFixed(2)}
                        </p>
                      </div>
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
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx, index) => {
                    // Ensure type and status have default values
                    const txType = tx.type || 'deposit';
                    const txStatus = tx.status || 'pending';
                    
                    return (
                      <a
                        key={tx.id || tx.txHash || `tx-${index}`}
                        href={getExplorerUrl(tx.txHash, 11124, 'tx')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-white/[0.03] rounded-lg border border-white/[0.08] hover:border-white/[0.12] transition-colors"
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
                        const balance = sendTokenType === 'ETH' ? ethBalance : usdcBalance;
                        setSendAmount(balance);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.15] rounded-lg text-xs text-white font-medium transition-all"
                    >
                      MAX
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Balance: {sendTokenType === 'ETH' ? ethBalance : parseFloat(usdcBalance).toFixed(2)} {sendTokenType}
                  </p>
                </div>

                {/* Error Message */}
                {sendError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                  >
                    {sendError}
                  </motion.div>
                )}

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
