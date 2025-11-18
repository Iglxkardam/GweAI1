import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCreditCard, FaMobileAlt } from 'react-icons/fa';
import { showWarningToast, showSuccessToast } from '../../../utils/toastHelper';

interface BuyUSDCModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuyUSDCModal: React.FC<BuyUSDCModalProps> = ({ isOpen, onClose }) => {
  const [inrAmount, setInrAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [exchangeRate] = useState(94); // 1 USDC = 94 INR (admin controlled)
  const [processing, setProcessing] = useState(false);

  // Calculate USDC amount when INR amount changes
  const handleInrAmountChange = (value: string) => {
    const regex = /^[0-9]*\.?[0-9]*$/;
    
    if (regex.test(value) || value === '') {
      setInrAmount(value);
      
      if (value && !isNaN(parseFloat(value))) {
        const usdc = parseFloat(value) / exchangeRate;
        setUsdcAmount(usdc.toFixed(2));
      } else {
        setUsdcAmount('');
      }
    }
  };

  // Quick amount buttons
  const quickAmounts = [500, 1000, 2000, 5000];

  const handleQuickAmount = (amount: number) => {
    setInrAmount(amount.toString());
    setUsdcAmount((amount / exchangeRate).toFixed(2));
  };

  const handlePurchase = async () => {
    if (!inrAmount || parseFloat(inrAmount) <= 0) {
      showWarningToast('Invalid Amount', 'Please enter a valid amount', 'Enter a positive number');
      return;
    }

    if (paymentMethod === 'upi' && !upiId) {
      showWarningToast('UPI ID Required', 'Please enter your UPI ID', 'Enter your UPI ID to continue');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
        showWarningToast('Card Details Required', 'Please fill in all card details', 'Complete all card fields');
        return;
      }
    }

    setProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setProcessing(false);
      showSuccessToast('Purchase Successful', `You will receive ${usdcAmount} USDC`, 'USDC will be credited to your wallet');
      onClose();
      // Reset form
      setInrAmount('');
      setUsdcAmount('');
      setUpiId('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCardName('');
    }, 2000);
  };

  // Format card number
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
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
            <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-white/[0.15] p-4 max-w-md w-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-0.5">Buy USDC</h2>
                  <p className="text-gray-400 text-xs">Pay with INR using UPI or Card</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 flex-shrink-0"
                >
                  <FaTimes className="text-gray-400 hover:text-white text-sm" />
                </button>
              </div>

              {/* Exchange Rate Display */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-3 mb-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-[10px] mb-0.5">Current Rate</p>
                    <p className="text-white text-base font-bold">1 USDC = ₹{exchangeRate}</p>
                  </div>
                  <div className="bg-green-500/20 border border-green-500/30 rounded px-2 py-1">
                    <p className="text-green-400 text-[10px] font-semibold">Live Rate</p>
                  </div>
                </div>
              </motion.div>

              {/* Amount Input */}
              <div className="mb-3">
                <label className="text-xs text-gray-400 mb-1.5 block">Enter INR Amount</label>
                <div className="bg-white/[0.03] backdrop-blur-sm rounded-lg border border-white/[0.08] p-3 hover:border-white/[0.12] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-white">₹</span>
                    <input
                      type="text"
                      value={inrAmount}
                      onChange={(e) => handleInrAmountChange(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent border-none outline-none text-white text-lg font-semibold placeholder-gray-600"
                    />
                  </div>
                  {usdcAmount && (
                    <p className="text-gray-400 text-xs mt-1.5">
                      ≈ {usdcAmount} USDC
                    </p>
                  )}
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickAmount(amount)}
                      className="py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white text-xs font-medium transition-all duration-200"
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-3">
                <label className="text-xs text-gray-400 mb-2 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      paymentMethod === 'upi'
                        ? 'bg-white/[0.08] border-white/[0.2]'
                        : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.12]'
                    }`}
                  >
                    <FaMobileAlt className={`text-lg mb-1.5 mx-auto ${
                      paymentMethod === 'upi' ? 'text-purple-400' : 'text-gray-400'
                    }`} />
                    <p className="text-white font-medium text-xs">UPI</p>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      paymentMethod === 'card'
                        ? 'bg-white/[0.08] border-white/[0.2]'
                        : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.12]'
                    }`}
                  >
                    <FaCreditCard className={`text-lg mb-1.5 mx-auto ${
                      paymentMethod === 'card' ? 'text-blue-400' : 'text-gray-400'
                    }`} />
                    <p className="text-white font-medium text-xs">Card</p>
                  </motion.button>
                </div>
              </div>

              {/* Payment Details */}
              <AnimatePresence mode="wait">
                {paymentMethod === 'upi' ? (
                  <motion.div
                    key="upi"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="mb-3"
                  >
                    <label className="text-xs text-gray-400 mb-1.5 block">UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@upi"
                      className="w-full bg-white/[0.03] backdrop-blur-sm rounded-lg border border-white/[0.08] p-3 text-white placeholder-gray-600 outline-none focus:border-white/[0.2] transition-colors"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="card"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3 mb-3"
                  >
                    {/* Card Number */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '');
                          if (/^\d{0,16}$/.test(value)) {
                            setCardNumber(formatCardNumber(value));
                          }
                        }}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full bg-white/[0.03] backdrop-blur-sm rounded-lg border border-white/[0.08] p-3 text-white placeholder-gray-600 outline-none focus:border-white/[0.2] transition-colors"
                      />
                    </div>

                    {/* Card Name */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        placeholder="JOHN DOE"
                        className="w-full bg-white/[0.03] backdrop-blur-sm rounded-lg border border-white/[0.08] p-3 text-white placeholder-gray-600 outline-none focus:border-white/[0.2] transition-colors"
                      />
                    </div>

                    {/* Expiry & CVV */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Expiry</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            if (value.length <= 5) {
                              setCardExpiry(value);
                            }
                          }}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full bg-white/[0.03] backdrop-blur-sm rounded-lg border border-white/[0.08] p-3 text-white placeholder-gray-600 outline-none focus:border-white/[0.2] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">CVV</label>
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 3) {
                              setCardCvv(value);
                            }
                          }}
                          placeholder="123"
                          maxLength={3}
                          className="w-full bg-white/[0.03] backdrop-blur-sm rounded-lg border border-white/[0.08] p-3 text-white placeholder-gray-600 outline-none focus:border-white/[0.2] transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Transaction Summary */}
              {inrAmount && usdcAmount && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/20 p-3 mb-3 space-y-1.5"
                >
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">You Pay</span>
                    <span className="text-white font-semibold">₹{parseFloat(inrAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Exchange Rate</span>
                    <span className="text-white">1 USDC = ₹{exchangeRate}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Processing Fee</span>
                    <span className="text-white">₹0</span>
                  </div>
                  <div className="h-px bg-white/10 my-1.5"></div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">You Receive</span>
                    <span className="text-green-400 font-bold text-base">{usdcAmount} USDC</span>
                  </div>
                </motion.div>
              )}

              {/* Purchase Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePurchase}
                disabled={!inrAmount || !usdcAmount || processing}
                className="w-full py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 disabled:from-white/[0.03] disabled:to-white/[0.03] disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-all duration-200 border border-white/[0.12] hover:border-white/[0.2] disabled:border-white/[0.05] relative overflow-hidden"
              >
                {processing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span>
                    {!inrAmount || !usdcAmount ? 'Enter Amount' : `Buy ${usdcAmount} USDC`}
                  </span>
                )}
                
                {/* Animated background effect */}
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
              </motion.button>

              {/* Disclaimer */}
              <p className="text-gray-500 text-xs text-center mt-4">
                This is a demo interface. No real transactions will be processed.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
