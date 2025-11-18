/**
 * Comprehensive Wallet Profile Component
 * 
 * Features:
 * - Display all connected wallets (multi-wallet support)
 * - Show balances for ETH and all tokens
 * - Switch between wallets
 * - Add new wallets
 * - Copy address
 * - View on block explorer
 * - Wallet management options
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaWallet, 
  FaCopy, 
  FaExternalLinkAlt, 
  FaPlus,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import { useComprehensiveWallet } from '../hooks/useComprehensiveWallet';
import { TOKENS } from '../config/tokens';

export const WalletProfile: React.FC = () => {
  const {
    address,
    connected,
    userWallets,
    balances,
    getAllTokenBalances,
    connect,
    disconnect,
    addWallet,
    isRefreshing,
  } = useComprehensiveWallet();
  
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showAllWallets, setShowAllWallets] = useState(false);
  
  // Copy address to clipboard
  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };
  
  // Open block explorer
  const viewOnExplorer = (addr: string) => {
    window.open(`https://sepolia.basescan.org/address/${addr}`, '_blank');
  };
  
  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  // Get token icon
  const getTokenIcon = (symbol: string) => {
    const token = Object.values(TOKENS).find(t => t.symbol === symbol);
    if (token) {
      return <img src={token.logo} alt={symbol} className="w-5 h-5" />;
    }
    return <FaWallet className="w-5 h-5 text-gray-400" />;
  };
  
  if (!connected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <FaWallet className="text-6xl text-purple-400" />
          <h3 className="text-xl font-bold text-white">Connect Your Wallet</h3>
          <p className="text-gray-400 text-center">
            Connect your wallet to view balances and manage your assets
          </p>
          <button
            onClick={connect}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all"
          >
            Connect Wallet
          </button>
        </div>
      </motion.div>
    );
  }
  
  const tokenBalances = getAllTokenBalances();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main Wallet Card */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <FaWallet className="text-2xl text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Primary Wallet</h3>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-400">{formatAddress(address || '')}</p>
                <button
                  onClick={() => handleCopyAddress(address || '')}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Copy address"
                >
                  {copiedAddress ? <FaCheck className="text-green-400" /> : <FaCopy />}
                </button>
                <button
                  onClick={() => viewOnExplorer(address || '')}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="View on explorer"
                >
                  <FaExternalLinkAlt />
                </button>
              </div>
            </div>
          </div>
          
          {/* Total Balance */}
          <div className="text-right">
            <p className="text-sm text-gray-400">Total Balance</p>
            <p className="text-2xl font-bold text-white">
              ${balances.totalUSD}
              {isRefreshing && (
                <span className="text-xs text-gray-400 ml-2">↻</span>
              )}
            </p>
          </div>
        </div>
        
        {/* Token Balances */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Token Balances
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tokenBalances.map((token) => (
              <div
                key={token.symbol}
                className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getTokenIcon(token.symbol)}
                    <span className="font-semibold text-white">{token.symbol}</span>
                  </div>
                  <span className="text-xs text-gray-400">{token.name}</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {parseFloat(token.balance).toFixed(6)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Multi-Wallet Section */}
      {userWallets.length > 1 && (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FaWallet className="text-purple-400" />
              <h4 className="font-semibold text-white">
                All Wallets ({userWallets.length})
              </h4>
            </div>
            <button
              onClick={() => setShowAllWallets(!showAllWallets)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {showAllWallets ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
          
          <AnimatePresence>
            {showAllWallets && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {userWallets.map((wallet, index) => (
                  <div
                    key={wallet.id}
                    className={`p-3 rounded-lg border ${
                      wallet.address === address
                        ? 'bg-purple-600/20 border-purple-500/50'
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    } transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          wallet.address === address
                            ? 'bg-purple-600'
                            : 'bg-white/10'
                        }`}>
                          <span className="text-sm font-bold text-white">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {formatAddress(wallet.address)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {wallet.connector.name || 'Connected'}
                            {wallet.address === address && ' • Primary'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopyAddress(wallet.address)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <FaCopy />
                        </button>
                        <button
                          onClick={() => viewOnExplorer(wallet.address)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <FaExternalLinkAlt />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center space-x-3">
        <button
          onClick={addWallet}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-white font-medium"
        >
          <FaPlus />
          <span>Add Wallet</span>
        </button>
        
        <button
          onClick={disconnect}
          className="flex-1 px-4 py-3 bg-red-500/20 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors text-red-400 font-medium"
        >
          Disconnect
        </button>
      </div>
    </motion.div>
  );
};
