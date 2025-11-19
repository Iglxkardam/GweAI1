/**
 * Sell Panel Component
 * Handles token sale for USDC
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTradingContract } from '../hooks/useTradingContract';
import { useAMMQuote } from '../hooks/useAMMQuote';
import { showWarningToast } from '../../../utils/toastHelper';

interface SellPanelProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  currentPrice: number;
  tokenBalance: string;
  onSuccess?: (txHash: string) => void;
}

export const SellPanel: React.FC<SellPanelProps> = ({
  tokenAddress,
  tokenSymbol,
  tokenDecimals,
  currentPrice,
  tokenBalance,
  onSuccess,
}) => {
  const { sellToken, loading } = useTradingContract();
  const { getSellQuote } = useAMMQuote();
  const [tokenAmount, setTokenAmount] = useState('');
  const [expectedUsdc, setExpectedUsdc] = useState('0');
  const [slippage, setSlippage] = useState('1'); // 1% default slippage
  const [priceImpact, setPriceImpact] = useState(0);
  const [protocolFee, setProtocolFee] = useState('0');

  // Get AMM quote (real-time from contract) with debounce + auto-refresh
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;
    
    const fetchQuote = async () => {
      if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
        setExpectedUsdc('0');
        setPriceImpact(0);
        setProtocolFee('0');
        return;
      }

      const quote = await getSellQuote(tokenAddress as `0x${string}`, tokenAmount, tokenDecimals);
      if (quote) {
        setExpectedUsdc(quote.amountOut);
        setPriceImpact(quote.priceImpact);
        setProtocolFee(quote.protocolFee);
      }
    };

    // Debounce quote fetching to 150ms for ultra-fast response
    timeout = setTimeout(fetchQuote, 150);
    
    // Auto-refresh every 30 seconds if amount is entered
    if (tokenAmount && parseFloat(tokenAmount) > 0) {
      interval = setInterval(fetchQuote, 30000); // 30 seconds
    }
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [tokenAmount, tokenAddress, tokenDecimals, getSellQuote]);

  const handleSell = async () => {
    if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
      showWarningToast('Invalid Amount', 'Please enter a valid amount greater than 0', 'Enter an amount to continue');
      return;
    }

    if (parseFloat(tokenAmount) > parseFloat(tokenBalance)) {
      showWarningToast(
        `Insufficient ${tokenSymbol} Balance`,
        `You don't have enough ${tokenSymbol} in your wallet.\n\nYour Balance: ${parseFloat(tokenBalance).toFixed(8)} ${tokenSymbol}\nRequired: ${parseFloat(tokenAmount).toFixed(8)} ${tokenSymbol}`,
        'Add more tokens to continue'
      );
      return;
    }

    // Calculate minUsdcOut with slippage
    const expectedOut = parseFloat(expectedUsdc);
    const minOut = (expectedOut * (1 - parseFloat(slippage) / 100)).toFixed(2);

    const txHash = await sellToken({
      tokenAddress,
      amount: tokenAmount,
      tokenDecimals,
      minAmountOut: minOut,
    });

    if (txHash && onSuccess) {
      onSuccess(txHash);
      setTokenAmount('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Token Input */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-300">You Sell</label>
          <span className="text-xs text-gray-400">
            Balance: {parseFloat(tokenBalance).toFixed(tokenDecimals > 8 ? 8 : tokenDecimals === 6 ? 2 : tokenDecimals === 9 ? 4 : 8)} {tokenSymbol}
          </span>
        </div>
        <div className="relative">
          <input
            type="number"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-4 bg-black/40 border border-white/20 rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
            {tokenSymbol}
          </div>
        </div>

        {/* Quick amount buttons */}
        <div className="flex gap-2 mt-2">
          {['25%', '50%', '75%', '100%'].map((pct) => (
            <button
              key={pct}
              onClick={() => {
                const amount = (parseFloat(tokenBalance) * parseFloat(pct) / 100).toFixed(tokenDecimals > 8 ? 8 : tokenDecimals === 6 ? 2 : tokenDecimals === 9 ? 4 : 8);
                setTokenAmount(amount);
              }}
              className="flex-1 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-all"
            >
              {pct}
            </button>
          ))}
        </div>
      </div>

      {/* USDC Output */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">You Receive (estimated)</label>
        <div className="relative">
          <input
            type="text"
            value={expectedUsdc}
            readOnly
            className="w-full px-4 py-4 bg-black/20 border border-white/10 rounded-xl text-white text-lg"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
            USDC
          </div>
        </div>
      </div>

      {/* Slippage */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Slippage Tolerance</span>
        <div className="flex gap-2">
          {['0.5', '1', '2'].map((s) => (
            <button
              key={s}
              onClick={() => setSlippage(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                slippage === s
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {s}%
            </button>
          ))}
        </div>
      </div>

      {/* Price Info - Only show when user has input */}
      {tokenAmount && parseFloat(tokenAmount) > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-3 bg-black/20 rounded-lg space-y-1 text-sm"
        >
          <div className="flex justify-between text-gray-400">
            <span>Market Price</span>
            <span className="text-white">
              ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: currentPrice > 1000 ? 2 : 6 })}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Protocol Fee</span>
            <span className="text-white">${parseFloat(protocolFee).toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Price Impact</span>
            <span className={`${priceImpact > 5 ? 'text-red-400' : priceImpact > 1 ? 'text-yellow-400' : 'text-green-400'}`}>
              {priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Min. Received</span>
            <span className="text-white">
              ${(parseFloat(expectedUsdc) * (1 - parseFloat(slippage) / 100)).toFixed(2)} USDC
            </span>
          </div>
        </motion.div>
      )}

      {/* Sell Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSell}
        disabled={loading || !tokenAmount || parseFloat(tokenAmount) <= 0}
        className="w-full py-4 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.15] hover:border-white/[0.25] disabled:bg-gray-600/20 disabled:border-gray-600/20 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
      >
        {loading ? '⏳ Selling...' : `Sell ${tokenSymbol}`}
      </motion.button>
    </div>
  );
};
