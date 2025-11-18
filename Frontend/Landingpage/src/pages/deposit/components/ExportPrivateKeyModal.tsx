import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaKey, FaShieldAlt, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

interface ExportPrivateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  email?: string;
}

export const ExportPrivateKeyModal: React.FC<ExportPrivateKeyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const handleGetKey = () => {
    // Open Abstract's portal for private key export
    window.open('https://portal.abs.xyz/profile', '_blank');
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

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
            className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[100] cursor-pointer"
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
            <div className="bg-[#0a0a0f] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5 max-w-md w-full relative shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-0.5">Export Private Key</h2>
                  <p className="text-gray-400 text-xs">
                    Access your signer wallet key
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 flex-shrink-0"
                >
                  <FaTimes className="text-gray-400 hover:text-white text-sm" />
                </button>
              </div>

            {/* Info Boxes */}
            <div className="space-y-2.5 mb-4">
              {/* Important Notice */}
              <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-2.5">
                <div className="flex items-start gap-2">
                  <FaExclamationTriangle className="text-yellow-500 text-xs mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-bold text-xs mb-0.5">Important Notice</p>
                    <p className="text-gray-400 text-[11px] leading-snug">
                      This key accesses your <span className="text-white font-semibold">signer wallet</span>, not the smart contract wallet.
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Warning */}
              <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-2.5">
                <div className="flex items-start gap-2">
                  <FaShieldAlt className="text-red-400 text-xs mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-300 font-bold text-xs mb-0.5">Security Warning</p>
                    <p className="text-gray-400 text-[11px] leading-snug">
                      Never share this key. Anyone with it can control your wallet.
                    </p>
                  </div>
                </div>
              </div>

              {/* Redirect Info */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-2.5">
                <p className="text-[11px] text-gray-400 leading-snug">
                  You'll be redirected to <span className="text-purple-400 font-semibold">Abstract's portal</span> for secure export with OTP verification.
                </p>
              </div>
            </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={handleGetKey}
                  className="w-full py-3 font-semibold text-sm rounded-lg transition-all duration-200 border bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/30 hover:border-purple-500/50 text-white flex items-center justify-center gap-2"
                >
                  <FaKey className="text-sm" />
                  Open Abstract Portal
                </button>
                
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 text-sm font-medium rounded-lg transition-all text-gray-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.1]"
                >
                  Cancel
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-gray-500 text-[10px] text-center mt-3 px-2">
                ⚠️ This key controls your signer wallet. Never share it with anyone.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
