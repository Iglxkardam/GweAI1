import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { SubscriptionPlan } from '../config/subscriptionConfig';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  onConfirm: () => Promise<void>;
  status: 'idle' | 'approving' | 'approved' | 'purchasing' | 'success' | 'error';
  errorMessage?: string;
  usdcBalance?: string;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  plan,
  onConfirm,
  status,
  errorMessage,
  usdcBalance,
}) => {
  if (!plan) return null;

  const handleConfirm = async () => {
    if (status === 'idle') {
      await onConfirm();
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'approving':
      case 'purchasing':
        return <FaSpinner className="w-12 h-12 text-blue-500 animate-spin" />;
      case 'approved':
        return <FaCheckCircle className="w-12 h-12 text-green-500" />;
      case 'success':
        return <FaCheckCircle className="w-12 h-12 text-green-500" />;
      case 'error':
        return <FaExclamationTriangle className="w-12 h-12 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'approving':
        return 'Step 1/2: Approving USDC spending...';
      case 'approved':
        return 'Approval confirmed! Preparing purchase...';
      case 'purchasing':
        return 'Step 2/2: Purchasing subscription...';
      case 'success':
        return 'Subscription purchased successfully!';
      case 'error':
        return errorMessage || 'Purchase failed. Please try again.';
      default:
        return 'Confirm your purchase';
    }
  };

  const hasInsufficientBalance =
    usdcBalance && parseFloat(usdcBalance) < parseFloat(plan.priceUSDC);

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
            <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-white/[0.15] p-4 max-w-md w-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-0.5">
                    {status === 'success' ? 'Success!' : 'Confirm Purchase'}
                  </h2>
                  <p className="text-gray-400 text-xs">Review and confirm your subscription</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 flex-shrink-0"
                  disabled={status === 'approving' || status === 'purchasing'}
                >
                  <FaTimes className="text-gray-400 hover:text-white text-sm" />
                </button>
              </div>

              {/* Status Icon */}
              {status !== 'idle' && (
                <div className="flex justify-center mb-4">
                  {getStatusIcon()}
                </div>
              )}

              {/* Content */}
              <div className="mb-6">
                {status === 'idle' && (
                  <>
                    {/* Plan Details */}
                    <div className="bg-white/[0.03] backdrop-blur-sm rounded-lg border border-white/[0.08] p-3 mb-3">
                      <div className="mb-2">
                        <h3 className="text-lg font-bold text-white mb-0.5">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {plan.description}
                        </p>
                      </div>
                      <div className="border-t border-white/10 pt-2 mt-2 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Price:</span>
                          <span className="text-white font-semibold">
                            ${plan.priceUSDC} USDC
                          </span>
                        </div>
                        {plan.period && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Duration:</span>
                            <span className="text-white">
                              {plan.period.replace('/', '')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Balance Info */}
                    <div className="bg-white/[0.03] backdrop-blur-sm rounded-lg border border-white/[0.08] p-3 mb-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">
                            Your USDC Balance:
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              hasInsufficientBalance
                                ? 'text-red-400'
                                : 'text-green-400'
                            }`}
                          >
                            {usdcBalance ? parseFloat(usdcBalance).toFixed(6) : '0.000000'} USDC
                          </span>
                        </div>
                        {usdcBalance && parseFloat(usdcBalance) > 0 && (
                          <div className="text-xs text-gray-500 text-right">
                            ≈ ${parseFloat(usdcBalance).toFixed(2)} USD
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Warning for insufficient balance */}
                    {hasInsufficientBalance && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <FaExclamationTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-300">
                            Insufficient USDC balance. Please add more USDC to
                            your wallet.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Chrome Pop-up Warning */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3">
                      <p className="text-xs text-blue-300 text-center leading-relaxed">
                        💡 <strong>Note:</strong> You'll be prompted <strong>twice</strong> - once to approve USDC, then to confirm purchase. If wallet popup doesn't appear, check your browser's address bar for blocked pop-ups.
                      </p>
                    </div>
                    
                    {/* Info */}
                    <p className="text-xs text-gray-400 text-center">
                      Step 1: Approve USDC → Step 2: Confirm Purchase
                    </p>
                  </>
                )}

                {status !== 'idle' && (
                  <>
                    <p className="text-center text-white/70 text-sm mb-3">
                      {getStatusMessage()}
                    </p>
                    
                    {/* Wallet popup blocked warning for approving/purchasing */}
                    {(status === 'approving' || status === 'approved' || status === 'purchasing') && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-3">
                        <p className="text-xs text-yellow-300 text-center leading-relaxed">
                          {status === 'approved' 
                            ? '✅ Step 1 complete! Preparing Step 2...' 
                            : '⚠️ Wallet popup not appearing? Check your browser\'s address bar (top-left) for a blocked popup icon 🚫. Click it and select "Always allow pop-ups for this site".'
                          }
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {status === 'idle' && (
                  <>
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg font-medium text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={!!hasInsufficientBalance}
                      className={`relative flex-1 py-3 px-4 rounded-lg font-medium text-sm overflow-hidden transition-all ${
                        hasInsufficientBalance
                          ? 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10'
                          : 'bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-500 hover:to-purple-500 border border-white/20'
                      }`}
                    >
                      {!hasInsufficientBalance && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                          animate={{ x: ["-200%", "200%"] }}
                          transition={{
                            repeat: Infinity,
                            duration: 3,
                            ease: "linear",
                          }}
                        />
                      )}
                      <span className="relative z-10">Confirm Purchase</span>
                    </button>
                  </>
                )}
                {status === 'success' && (
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 transition-all font-medium text-sm"
                  >
                    Done
                  </button>
                )}
                {status === 'error' && (
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-all font-medium text-sm"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
