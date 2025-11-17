/**
 * Wallet Actions Component
 * 
 * Provides UI for common wallet operations:
 * - Send tokens (ETH, USDC, BTC)
 * - Receive (show QR code)
 * - Add custom tokens
 * - Transaction history
 * - Network switching
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPaperPlane,
  FaQrcode,
  FaPlus,
  FaHistory,
  FaTimes,
  FaCheck,
  FaSpinner,
} from 'react-icons/fa';
import QRCode from 'react-qr-code';
import { useComprehensiveWallet } from '../hooks/useComprehensiveWallet';

type ActionType = 'send' | 'receive' | 'addToken' | 'history' | 'network' | null;

export const WalletActions: React.FC = () => {
  const {
    address,
    connected,
    balances,
    sendTransaction,
    sendToken,
    tokenAddresses,
    tokens,
    loading,
  } = useComprehensiveWallet();
  
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [selectedToken, setSelectedToken] = useState<'ETH' | 'USDC' | 'BTC'>('ETH');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Handle send transaction
  const handleSend = async () => {
    if (!recipient || !amount) {
      setErrorMessage('Please enter recipient and amount');
      return;
    }
    
    try {
      setTxStatus('pending');
      setErrorMessage('');
      
      let result;
      
      if (selectedToken === 'ETH') {
        result = await sendTransaction({
          to: recipient,
          value: amount,
        });
      } else {
        const tokenAddress = selectedToken === 'USDC' 
          ? tokenAddresses.USDC 
          : tokenAddresses.BTC;
        const decimals = tokens[selectedToken].decimals;
        
        result = await sendToken({
          tokenAddress,
          to: recipient,
          amount,
          decimals,
        });
      }
      
      setTxHash(result.hash);
      setTxStatus('success');
      setRecipient('');
      setAmount('');
      
      // Auto close after 3 seconds
      setTimeout(() => {
        setActiveAction(null);
        setTxStatus('idle');
      }, 3000);
    } catch (error: any) {
      console.error('Send failed:', error);
      setTxStatus('error');
      setErrorMessage(error.message || 'Transaction failed');
    }
  };
  
  // Close modal
  const closeModal = () => {
    setActiveAction(null);
    setTxStatus('idle');
    setRecipient('');
    setAmount('');
    setErrorMessage('');
  };
  
  if (!connected) {
    return null;
  }
  
  // Quick action buttons
  const actions = [
    { type: 'send' as ActionType, icon: FaPaperPlane, label: 'Send', color: 'purple' },
    { type: 'receive' as ActionType, icon: FaQrcode, label: 'Receive', color: 'blue' },
    { type: 'addToken' as ActionType, icon: FaPlus, label: 'Add Token', color: 'green' },
    { type: 'history' as ActionType, icon: FaHistory, label: 'History', color: 'orange' },
  ];
  
  return (
    <>
      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => (
          <motion.button
            key={action.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveAction(action.type)}
            className={`flex flex-col items-center justify-center space-y-2 p-4 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:border-${action.color}-500/50 transition-all group`}
          >
            <div className={`w-12 h-12 bg-${action.color}-600/20 rounded-full flex items-center justify-center group-hover:bg-${action.color}-600/30 transition-colors`}>
              <action.icon className={`text-xl text-${action.color}-400`} />
            </div>
            <span className="text-sm font-medium text-white">{action.label}</span>
          </motion.button>
        ))}
      </div>
      
      {/* Modals */}
      <AnimatePresence>
        {activeAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">
                  {activeAction === 'send' && 'Send Tokens'}
                  {activeAction === 'receive' && 'Receive Tokens'}
                  {activeAction === 'addToken' && 'Add Custom Token'}
                  {activeAction === 'history' && 'Transaction History'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              
              {/* Send Modal */}
              {activeAction === 'send' && (
                <div className="space-y-4">
                  {txStatus === 'idle' || txStatus === 'error' ? (
                    <>
                      {/* Token Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Select Token
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['ETH', 'USDC', 'BTC'] as const).map((token) => (
                            <button
                              key={token}
                              onClick={() => setSelectedToken(token)}
                              className={`p-3 rounded-lg font-semibold transition-all ${
                                selectedToken === token
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              {token}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Balance: {selectedToken === 'ETH' ? balances.eth : selectedToken === 'USDC' ? balances.usdc : balances.btc} {selectedToken}
                        </p>
                      </div>
                      
                      {/* Recipient */}
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Recipient Address
                        </label>
                        <input
                          type="text"
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="0x..."
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      
                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Amount
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.0"
                          step="0.000001"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      
                      {/* Error Message */}
                      {errorMessage && (
                        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                          <p className="text-sm text-red-400">{errorMessage}</p>
                        </div>
                      )}
                      
                      {/* Send Button */}
                      <button
                        onClick={handleSend}
                        disabled={loading || !recipient || !amount}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <FaPaperPlane />
                        <span>Send {selectedToken}</span>
                      </button>
                    </>
                  ) : txStatus === 'pending' ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <FaSpinner className="text-6xl text-purple-400 animate-spin" />
                      <p className="text-lg text-white font-semibold">Processing Transaction...</p>
                      <p className="text-sm text-gray-400">Please wait while we process your transaction</p>
                    </div>
                  ) : txStatus === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center">
                        <FaCheck className="text-4xl text-green-400" />
                      </div>
                      <p className="text-lg text-white font-semibold">Transaction Sent!</p>
                      <a
                        href={`https://sepolia.basescan.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-400 hover:text-purple-300 underline"
                      >
                        View on Block Explorer
                      </a>
                    </div>
                  ) : null}
                </div>
              )}
              
              {/* Receive Modal */}
              {activeAction === 'receive' && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    {/* QR Code */}
                    <div className="bg-white p-4 rounded-2xl">
                      <QRCode value={address || ''} size={200} />
                    </div>
                    
                    {/* Address */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-400 mb-2 text-center">
                        Your Wallet Address
                      </label>
                      <div className="flex items-center space-x-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                        <input
                          type="text"
                          value={address || ''}
                          readOnly
                          className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(address || '');
                          }}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          <FaPaperPlane />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 text-center">
                      Scan this QR code or copy the address to receive tokens
                    </p>
                  </div>
                </div>
              )}
              
              {/* Add Token Modal */}
              {activeAction === 'addToken' && (
                <div className="space-y-4">
                  <p className="text-gray-400">
                    Feature coming soon! You'll be able to add custom ERC20 tokens to track in your wallet.
                  </p>
                </div>
              )}
              
              {/* History Modal */}
              {activeAction === 'history' && (
                <div className="space-y-4">
                  <p className="text-gray-400">
                    Transaction history will be displayed here. For now, view your transactions on{' '}
                    <a
                      href={`https://sepolia.basescan.org/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      Block Explorer
                    </a>
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
