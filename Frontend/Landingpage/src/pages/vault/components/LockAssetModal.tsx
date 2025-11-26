import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { StakePool } from '../types/vault.types';

interface LockAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: StakePool | null;
  userBalance: string;
  onConfirm: (token: string, amount: number, duration: number) => Promise<void>;
}

const LOCK_DURATIONS = [
  { days: 30, label: '30 Days', multiplier: 0.7 },
  { days: 60, label: '60 Days', multiplier: 0.85 },
  { days: 90, label: '90 Days', multiplier: 1.0 },
  { days: 180, label: '180 Days', multiplier: 1.15 },
  { days: 365, label: '1 Year', multiplier: 1.3 }
];

export const LockAssetModal: React.FC<LockAssetModalProps> = ({
  isOpen,
  onClose,
  pool,
  userBalance,
  onConfirm
}) => {
  const [amount, setAmount] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'signing' | 'processing' | 'success' | 'error'>('idle');


  useEffect(() => {
    if (isOpen && pool) {
      setAmount('');
      setSelectedDuration(90);
      setIsProcessing(false);
      setTxStatus('idle');
    }
  }, [isOpen, pool]);

  if (!pool) return null;

  const balance = parseFloat(userBalance) || 0;
  const amountNum = parseFloat(amount) || 0;
  const selectedDurationData = LOCK_DURATIONS.find(d => d.days === selectedDuration);
  const adjustedAPY = pool.apy * (selectedDurationData?.multiplier || 1);
  const estimatedYield = amountNum * (adjustedAPY / 100) * (selectedDuration / 365);
  const unlockDate = new Date(Date.now() + selectedDuration * 24 * 60 * 60 * 1000);

  const handleMaxClick = () => {
    setAmount(userBalance);
  };

  const handleConfirm = async () => {
    if (amountNum > 0 && amountNum <= balance && !isProcessing) {
      try {
        setIsProcessing(true);
        setTxStatus('signing');
        
        // Call onConfirm which will trigger wallet popup
        await onConfirm(pool.token, amountNum, selectedDuration);
        
        // Transaction successful
        setTxStatus('success');
        
        // Auto-close after showing success
        setTimeout(() => {
          onClose();
        }, 2000);
      } catch (error: any) {
        console.error('Stake failed:', error);
        setTxStatus('error');
        setIsProcessing(false);
      }
    }
  };

  const isValid = amountNum > 0 && amountNum <= balance && !isProcessing;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isProcessing ? undefined : onClose}
            className={`fixed inset-0 bg-black/25 backdrop-blur-sm z-[100] ${
              isProcessing ? 'cursor-wait' : 'cursor-pointer'
            }`}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`bg-black/80 backdrop-blur-xl rounded-2xl border border-white/[0.15] p-5 max-w-md w-full relative ${isProcessing ? 'pointer-events-none' : ''}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-0.5">Stake {pool.token}</h2>
                  <p className="text-gray-400 text-xs">
                    {isProcessing ? 'Processing transaction...' : 'Choose amount and duration'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className={`p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 flex-shrink-0 ${
                    isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FaTimes className="text-gray-400 hover:text-white text-sm" />
                </button>
              </div>

              {/* Pool Info Banner */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-3 mb-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <img src={pool.tokenLogo} alt={pool.token} className="w-8 h-8 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate">{pool.token} Stake Pool</p>
                      <p className="text-gray-400 text-xs truncate">Available: {balance.toFixed(4)} {pool.token}</p>
                    </div>
                  </div>
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-1 flex-shrink-0">
                    <p className="text-green-400 font-bold text-sm">{pool.apy}%</p>
                    <p className="text-green-300 text-[10px]">Base APY</p>
                  </div>
                </div>
              </motion.div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-1.5 block">Amount to Stake</label>
                <div className={`bg-white/[0.03] backdrop-blur-sm rounded-lg border border-white/[0.08] p-3 hover:border-white/[0.12] transition-colors ${
                  isProcessing ? 'opacity-50' : ''
                }`}>
                  <div className="flex items-center gap-2">
                    <img src={pool.tokenLogo} alt={pool.token} className="w-6 h-6 flex-shrink-0" />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      disabled={isProcessing}
                      className="w-full bg-transparent border-none outline-none text-white text-lg font-semibold placeholder-gray-600 disabled:cursor-not-allowed min-w-0"
                      step="0.0001"
                      min="0"
                      max={balance}
                    />
                    <button
                      onClick={handleMaxClick}
                      disabled={isProcessing}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white text-xs font-medium transition-all duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      MAX
                    </button>
                  </div>
                  {balance === 0 && (
                    <p className="text-yellow-400 text-xs mt-1.5 truncate">
                      No {pool.token} balance available
                    </p>
                  )}
                </div>
                {amountNum > balance && balance > 0 && (
                  <p className="text-red-400 text-xs mt-1">Insufficient balance</p>
                )}
              </div>

              {/* Duration Selection */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">Stake Duration</label>
                <div className={`grid grid-cols-2 gap-2 ${isProcessing ? 'opacity-50' : ''}`}>
                  {LOCK_DURATIONS.map((duration) => {
                    const durationAPY = pool.apy * duration.multiplier;
                    const isSelected = selectedDuration === duration.days;
                    return (
                      <motion.button
                        key={duration.days}
                        whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                        onClick={() => !isProcessing && setSelectedDuration(duration.days)}
                        disabled={isProcessing}
                        className={`p-2.5 rounded-lg border transition-all duration-200 ${
                          isSelected
                            ? 'bg-white/[0.08] border-white/[0.2]'
                            : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.12]'
                        } ${isProcessing ? 'cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`font-semibold text-xs ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                            {duration.label}
                          </span>
                          <span className={`text-[10px] font-medium ${isSelected ? 'text-green-400' : 'text-gray-400'}`}>
                            {durationAPY.toFixed(1)}% APY
                          </span>
                        </div>
                        <p className={`text-sm font-bold ${isSelected ? 'text-green-400' : 'text-gray-400'}`}>
                          {durationAPY.toFixed(1)}% APY
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Transaction Summary */}
              {amountNum > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/20 p-3 mb-4 space-y-1.5"
                >
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Stake Amount</span>
                    <span className="text-white font-semibold truncate ml-2">{amountNum.toFixed(4)} {pool.token}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white">{selectedDuration} days</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">APY</span>
                    <span className="text-green-400 font-semibold">{adjustedAPY.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Estimated Yield</span>
                    <span className="text-green-400 truncate ml-2">+{estimatedYield.toFixed(4)} {pool.token}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Unlock Date</span>
                    <span className="text-white text-[10px]">
                      {unlockDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="h-px bg-white/10 my-1"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Total at Unlock</span>
                    <span className="text-green-400 font-bold text-sm truncate ml-2">{(amountNum + estimatedYield).toFixed(4)} {pool.token}</span>
                  </div>
                </motion.div>
              )}

              {/* Transaction Status */}
              {txStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-3 p-3 rounded-lg border ${
                    txStatus === 'signing' ? 'bg-blue-500/10 border-blue-500/30' :
                    txStatus === 'processing' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    txStatus === 'success' ? 'bg-green-500/10 border-green-500/30' :
                    'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {txStatus === 'signing' && (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent flex-shrink-0"></div>
                        <div className="min-w-0">
                          <p className="text-blue-400 font-semibold text-sm">Awaiting Signature</p>
                          <p className="text-blue-300 text-[10px] truncate">Please confirm in your wallet...</p>
                        </div>
                      </>
                    )}
                    {txStatus === 'processing' && (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent flex-shrink-0"></div>
                        <div className="min-w-0">
                          <p className="text-yellow-400 font-semibold text-sm">Processing Transaction</p>
                          <p className="text-yellow-300 text-[10px]">Please wait...</p>
                        </div>
                      </>
                    )}
                    {txStatus === 'success' && (
                      <>
                        <div className="text-green-400 text-xl flex-shrink-0">✓</div>
                        <div className="min-w-0">
                          <p className="text-green-400 font-semibold text-sm">Staked Successfully!</p>
                          <p className="text-green-300 text-[10px] truncate">{amountNum.toFixed(4)} {pool.token} staked for {selectedDuration} days</p>
                        </div>
                      </>
                    )}
                    {txStatus === 'error' && (
                      <>
                        <div className="text-red-400 text-xl flex-shrink-0">✕</div>
                        <div className="min-w-0">
                          <p className="text-red-400 font-semibold text-sm">Transaction Failed</p>
                          <p className="text-red-300 text-[10px]">Please try again</p>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Stake Button */}
              <motion.button
                whileTap={{ scale: isValid ? 0.98 : 1 }}
                onClick={handleConfirm}
                disabled={!isValid || balance === 0 || isProcessing}
                className={`w-full py-3 font-semibold text-sm rounded-lg transition-all duration-200 border relative overflow-hidden ${
                  isProcessing
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 cursor-wait'
                    : !isValid || balance === 0
                    ? 'bg-white/[0.03] border-white/[0.05] cursor-not-allowed text-gray-500'
                    : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border-white/[0.12] hover:border-white/[0.2] text-white'
                }`}
              >
                <span className="relative z-10">
                  {isProcessing ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span className="text-xs">
                        {txStatus === 'signing' ? 'Awaiting Signature...' : 'Processing...'}
                      </span>
                    </span>
                  ) : balance === 0 ? (
                    `No ${pool.token} Balance`
                  ) : !isValid ? (
                    'Enter Amount'
                  ) : (
                    <span className="truncate block px-2">Stake {amountNum.toFixed(4)} {pool.token}</span>
                  )}
                </span>
                
                {/* Animated background effect */}
                {!isProcessing && isValid && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-white/10 to-purple-500/0"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{ pointerEvents: 'none' }}
                  />
                )}
              </motion.button>

              {/* Disclaimer */}
              <p className="text-gray-500 text-[10px] text-center mt-3 px-2">
                ⚠️ Early unlock penalty applies. Funds will be locked for {selectedDuration} days.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
