import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { LockedAsset } from '../types/vault.types';

interface EarlyUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: LockedAsset | null;
  onConfirm: (assetId: string) => void;
}

export const EarlyUnlockModal: React.FC<EarlyUnlockModalProps> = ({ 
  isOpen, 
  onClose, 
  asset,
  onConfirm 
}) => {
  const [processing, setProcessing] = useState(false);

  if (!asset) return null;

  // Calculate penalty based on remaining time
  const calculatePenalty = () => {
    const now = Date.now();
    const totalDuration = asset.unlockDate - asset.lockDate;
    const remaining = asset.unlockDate - now;
    
    // Percentage of time remaining
    const remainingPercent = (remaining / totalDuration) * 100;
    
    // Penalty APY calculation: proportional to remaining time
    // If 50% time remaining, penalty is 50% of APY
    const penaltyAPY = (asset.apy * remainingPercent) / 100;
    
    // Penalty amount: (penaltyAPY / APY) * totalYield
    const penaltyAmount = (penaltyAPY / asset.apy) * asset.totalYield;
    
    // Amount user will receive
    const receiveAmount = asset.amount + asset.earnedYield - penaltyAmount;
    
    return {
      penaltyAPY: penaltyAPY.toFixed(2),
      penaltyAmount: penaltyAmount.toFixed(4),
      receiveAmount: receiveAmount.toFixed(4),
      remainingDays: Math.ceil(remaining / (1000 * 60 * 60 * 24)),
      remainingPercent: remainingPercent.toFixed(1)
    };
  };

  const penalty = calculatePenalty();

  const handleUnlock = async () => {
    setProcessing(true);
    
    // Simulate transaction
    setTimeout(() => {
      setProcessing(false);
      onConfirm(asset.id);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[100]"
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
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/[0.15] p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Early Unlock</h2>
                  <p className="text-gray-400 text-sm">Penalty will be applied</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <FaTimes className="text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Warning Banner */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4 mb-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FaExclamationTriangle className="text-red-400 text-xl" />
                    <div>
                      <p className="text-white font-bold text-sm">Early Unlock Penalty</p>
                      <p className="text-gray-400 text-xs">{penalty.remainingDays} days remaining</p>
                    </div>
                  </div>
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-1.5">
                    <p className="text-red-400 text-xs font-semibold">-{penalty.penaltyAPY}% APY</p>
                  </div>
                </div>
              </motion.div>

              {/* Vault Info */}
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl border border-white/[0.08] p-4 hover:border-white/[0.12] transition-colors mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <img src={asset.tokenLogo} alt={asset.token} className="w-8 h-8" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{asset.token} Vault</h3>
                    <p className="text-gray-400 text-sm">{asset.amount.toFixed(4)} {asset.token} locked</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">{asset.apy}%</p>
                    <p className="text-gray-400 text-xs">APY</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-white/[0.05]">
                  <span>{penalty.remainingDays} days left</span>
                  <span>•</span>
                  <span>{penalty.remainingPercent}% remaining</span>
                  <span>•</span>
                  <span>{asset.lockDuration} days total</span>
                </div>
              </div>

              {/* Transaction Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/20 p-4 mb-6 space-y-2"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Locked Amount</span>
                  <span className="text-white font-semibold">{asset.amount.toFixed(4)} {asset.token}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Earned Yield</span>
                  <span className="text-green-400">+{asset.earnedYield.toFixed(4)} {asset.token}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Penalty ({penalty.remainingPercent}% × {asset.apy}%)</span>
                  <span className="text-red-400 font-semibold">-{penalty.penaltyAmount} {asset.token}</span>
                </div>
                <div className="h-px bg-white/10 my-2"></div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">You Receive</span>
                  <span className="text-green-400 font-bold text-lg">{penalty.receiveAmount} {asset.token}</span>
                </div>
              </motion.div>

              {/* Unlock Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleUnlock}
                disabled={processing}
                className="w-full py-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 disabled:from-white/[0.03] disabled:to-white/[0.03] disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl transition-all duration-200 border border-white/[0.12] hover:border-white/[0.2] disabled:border-white/[0.05] relative overflow-hidden"
              >
                {processing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span>Confirm Early Unlock</span>
                )}
                
                {/* Animated background effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-white/10 to-red-500/0"
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
              </motion.button>

              {/* Disclaimer */}
              <p className="text-gray-500 text-xs text-center mt-4">
                You will lose {penalty.penaltyAmount} {asset.token} as penalty. Consider waiting {penalty.remainingDays} days.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
