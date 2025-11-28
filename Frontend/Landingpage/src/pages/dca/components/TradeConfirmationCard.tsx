import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaExchangeAlt, FaArrowRight, FaLock } from 'react-icons/fa';
import { TOKENS } from '../../../config/tokens';
import { VERIFIED_TOKENS } from '../../../config/contracts';
import { useSwapContract } from '../../swap/hooks/useSwapContract';

export interface BuyTradeParams {
  type: 'buy';
  amount: number;
  token: string;
  fromToken?: string;
  slippage?: number;
  isTokenAmount?: boolean; // true if amount is in token (0.1 BTC), false if USD ($100)
}

export interface SellTradeParams {
  type: 'sell';
  amount: number;
  token: string;
  toToken?: string;
  slippage?: number;
  isTokenAmount?: boolean; // true if amount is in token (0.1 BTC), false if USD ($100)
}

export interface SwapTradeParams {
  type: 'swap';
  amount: number;
  fromToken: string;
  toToken: string;
  slippage?: number;
  isTokenAmount?: boolean; // true = token amount (0.5 BTC), false = USD amount ($100)
}

export interface VaultTradeParams {
  type: 'vault' | 'stake';
  action: 'stake' | 'unstake';
  amount: number;
  token: string;
  duration?: number;
}

export type TradeParams = BuyTradeParams | SellTradeParams | SwapTradeParams | VaultTradeParams;

interface TradeConfirmationCardProps {
  parameters: TradeParams;
  onApprove: (params: TradeParams) => void;
  onCancel: () => void;
  estimatedOutput?: string;
  priceImpact?: string;
  gasEstimate?: string;
  isExecuted?: boolean; // Track if order has been executed
}

const tokenIcons: Record<string, string> = {
  'BTC': TOKENS.BTC.logo,
  'ETH': TOKENS.ETH.logo,
  'SOL': TOKENS.SOL.logo,
  'USDC': TOKENS.USDC.logo,
  'BNB': TOKENS.BNB.logo,
  'XRP': TOKENS.XRP.logo,
  'TON': TOKENS.TON.logo,
  'AVAX': TOKENS.AVAX.logo,
  'DOGE': TOKENS.DOGE.logo,
  'ADA': TOKENS.ADA.logo,
  'TRX': TOKENS.TRX.logo,
};

export const TradeConfirmationCard: React.FC<TradeConfirmationCardProps> = ({
  parameters,
  onApprove,
  isExecuted = false,
  onCancel,
  estimatedOutput: providedOutput,
  priceImpact: providedImpact,
  gasEstimate = '~$0.50'
}) => {
  const { getSwapQuote } = useSwapContract();
  const [estimatedOutput, setEstimatedOutput] = useState(providedOutput || '...');
  const [priceImpact, setPriceImpact] = useState(providedImpact || '<0.1%');
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [actualInputAmount, setActualInputAmount] = useState<number | null>(null); // Token amount after USD conversion

  // Fetch real quote on mount
  useEffect(() => {
    const fetchQuote = async () => {
      setIsLoadingQuote(true);
      try {
        let tokenIn: string;
        let tokenOut: string;
        let amountToSwap: number;
        
        // Determine tokens and amounts based on trade type
        if (parameters.type === 'buy') {
          tokenIn = 'USDC';
          tokenOut = parameters.token;
          
          // If isTokenAmount=true, user wants to buy X tokens (need to calculate USDC cost)
          // If isTokenAmount=false, user wants to spend $X USDC
          if (parameters.isTokenAmount) {
            // User wants exact token amount - calculate USDC needed
            const tokenPrice = await fetchTokenPrice(parameters.token);
            const usdcNeeded = (parameters.amount as number) * tokenPrice;
            
            // Set display values directly (no blockchain quote needed)
            setActualInputAmount(usdcNeeded);
            setEstimatedOutput((parameters.amount as number).toFixed(8));
            setIsLoadingQuote(false);
            return; // Skip blockchain quote fetch
          } else {
            // User specified USD amount - need to calculate token output
            amountToSwap = parameters.amount as number;
          }
        } else if (parameters.type === 'sell') {
          tokenIn = parameters.token;
          tokenOut = 'USDC';
          
          if (parameters.isTokenAmount) {
            // User specified token amount to sell
            amountToSwap = parameters.amount as number;
          } else {
            // User specified USD worth to sell (need token amount)
            const tokenPrice = await fetchTokenPrice(parameters.token);
            amountToSwap = (parameters.amount as number) / tokenPrice;
          }
        } else if (parameters.type === 'swap') {
          tokenIn = parameters.fromToken;
          tokenOut = parameters.toToken;
          
          if (parameters.isTokenAmount) {
            // User specified token amount
            amountToSwap = parameters.amount as number;
          } else {
            // User specified USD worth (need to convert to token amount)
            const tokenPrice = await fetchTokenPrice(parameters.fromToken);
            amountToSwap = (parameters.amount as number) / tokenPrice;
          }
        } else {
          setIsLoadingQuote(false);
          return;
        }
        
        // Store the actual input amount (after USD conversion)
        setActualInputAmount(amountToSwap);
        
        // Get contract addresses and token data
        const tokenInAddress = VERIFIED_TOKENS[tokenIn as keyof typeof VERIFIED_TOKENS];
        const tokenOutAddress = VERIFIED_TOKENS[tokenOut as keyof typeof VERIFIED_TOKENS];
        const tokenInData = TOKENS[tokenIn];
        const tokenOutData = TOKENS[tokenOut];
        
        // Debug logging
        console.log('Token lookup:', {
          tokenIn,
          tokenOut,
          tokenInAddress,
          tokenOutAddress,
          tokenInData: tokenInData ? 'Found' : 'Not found',
          tokenOutData: tokenOutData ? 'Found' : 'Not found',
          availableVerifiedTokens: Object.keys(VERIFIED_TOKENS),
          availableTokens: Object.keys(TOKENS)
        });
        
        if (!tokenInAddress || !tokenOutAddress || !tokenInData || !tokenOutData) {
          console.error('Token data not found:', { 
            tokenIn, 
            tokenOut,
            missingTokenInAddress: !tokenInAddress,
            missingTokenOutAddress: !tokenOutAddress,
            missingTokenInData: !tokenInData,
            missingTokenOutData: !tokenOutData
          });
          setEstimatedOutput('Error: Token config missing');
          setIsLoadingQuote(false);
          return;
        }
        
        // Fetch real quote from blockchain
        const quote = await getSwapQuote({
          tokenInAddress,
          tokenOutAddress,
          amountIn: amountToSwap.toString(),
          tokenInDecimals: tokenInData.decimals,
          tokenOutDecimals: tokenOutData.decimals,
        });
        
        if (quote) {
          const decimals = tokenOutData.decimals === 6 ? 2 : tokenOutData.decimals === 8 ? 8 : 4;
          setEstimatedOutput(parseFloat(quote.amountOut).toFixed(decimals));
          setPriceImpact(quote.priceImpact);
          console.log('✅ Real-time quote fetched (Binance + Blockchain):', {
            amountIn: amountToSwap,
            tokenIn,
            tokenOut,
            amountOut: quote.amountOut,
            priceImpact: quote.priceImpact,
            source: 'Binance API + Router Contract'
          });
        }
      } catch (error) {
        console.error('❌ Failed to fetch quote:', error);
        setEstimatedOutput('0.00');
      } finally {
        setIsLoadingQuote(false);
      }
    };
    
    // Helper to fetch token price from Binance
    const fetchTokenPrice = async (tokenSymbol: string): Promise<number> => {
      try {
        // Convert token symbol to Binance format (e.g., BTC -> BTCUSDT)
        const binanceSymbol = `${tokenSymbol}USDT`;
        
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`
        );
        
        if (!response.ok) {
          console.error(`Binance API error for ${binanceSymbol}:`, response.status);
          return 0;
        }
        
        const data = await response.json();
        return parseFloat(data.price) || 0;
      } catch (error) {
        console.error(`Failed to fetch ${tokenSymbol} price from Binance:`, error);
        return 0;
      }
    };
    
    fetchQuote();
  }, [parameters, getSwapQuote]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onApprove(parameters);
    } finally {
      setIsConfirming(false);
    }
  };
  const getTradeTitle = () => {
    switch (parameters.type) {
      case 'buy':
        return 'Confirm Buy Order';
      case 'sell':
        return 'Confirm Sell Order';
      case 'swap':
        return 'Confirm Swap';
      case 'vault':
      case 'stake':
        return parameters.action === 'stake' ? 'Confirm Staking' : 'Confirm Unstaking';
      default:
        return 'Confirm Trade';
    }
  };

  const getTradeIcon = () => {
    switch (parameters.type) {
      case 'swap':
        return <FaExchangeAlt className="text-blue-400 text-lg" />;
      case 'vault':
      case 'stake':
        return <FaLock className="text-purple-400 text-lg" />;
      default:
        return <FaCheckCircle className="text-emerald-400 text-lg" />;
    }
  };

  const renderBuyDetails = (params: BuyTradeParams) => (
    <>
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <p className="text-xs text-gray-400 mb-1">You Pay {params.isTokenAmount ? '(Est.)' : ''}</p>
            <p className="text-2xl font-bold text-white">
              {params.isTokenAmount ? (
                isLoadingQuote ? (
                  <span className="animate-pulse">Loading...</span>
                ) : actualInputAmount ? (
                  `$${actualInputAmount.toFixed(2)}`
                ) : (
                  '$0.00'
                )
              ) : (
                `$${params.amount}`
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <img src={tokenIcons['USDC']} alt="USDC" className="w-10 h-10" />
            <span className="text-lg font-semibold text-white">USDC</span>
          </div>
        </div>
        <div className="flex justify-center py-2 bg-white/5">
          <FaArrowRight className="text-emerald-400 text-xl" />
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">You Receive {!params.isTokenAmount ? '(Est.)' : ''}</p>
            <p className="text-2xl font-bold text-emerald-400">
              {params.isTokenAmount ? (
                `${params.amount} ${params.token}`
              ) : (
                isLoadingQuote ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  `${estimatedOutput || '~0.0000'} ${params.token}`
                )
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <img src={tokenIcons[params.token]} alt={params.token} className="w-10 h-10" />
            <span className="text-lg font-semibold text-white">{params.token}</span>
          </div>
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Price Impact</span>
          <span className={`font-semibold ${parseFloat(priceImpact || '0') > 1 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {priceImpact || '<0.1%'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Slippage Tolerance</span>
          <span className="text-white">{params.slippage || 0.5}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Network Fee</span>
          <span className="text-white">{gasEstimate}</span>
        </div>
      </div>
    </>
  );

  const renderSellDetails = (params: SellTradeParams) => (
    <>
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <p className="text-xs text-gray-400 mb-1">You Sell</p>
            {params.isTokenAmount === false ? (
              <div>
                <p className="text-2xl font-bold text-white">${params.amount} worth</p>
                <p className="text-sm text-gray-400 mt-1">
                  {isLoadingQuote ? (
                    <span className="animate-pulse">Calculating...</span>
                  ) : actualInputAmount ? (
                    `≈ ${actualInputAmount.toFixed(6)} ${params.token}`
                  ) : (
                    'Loading...'
                  )}
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-white">
                {typeof params.amount === 'string' && params.amount === 'MAX' ? 'All' : params.amount} {params.token}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <img src={tokenIcons[params.token]} alt={params.token} className="w-10 h-10" />
            <span className="text-lg font-semibold text-white">{params.token}</span>
          </div>
        </div>
        <div className="flex justify-center py-2 bg-white/5">
          <FaArrowRight className="text-emerald-400 text-xl" />
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">You Receive (Est.)</p>
            <p className="text-2xl font-bold text-emerald-400">
              {isLoadingQuote ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `${estimatedOutput || '0.00'} USDC`
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <img src={tokenIcons['USDC']} alt="USDC" className="w-10 h-10" />
            <span className="text-lg font-semibold text-white">USDC</span>
          </div>
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Price Impact</span>
          <span className={`font-semibold ${parseFloat(priceImpact || '0') > 1 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {priceImpact || '<0.1%'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Slippage Tolerance</span>
          <span className="text-white">{params.slippage || 0.5}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Network Fee</span>
          <span className="text-white">{gasEstimate}</span>
        </div>
      </div>
    </>
  );

  const renderSwapDetails = (params: SwapTradeParams) => (
    <>
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <p className="text-xs text-gray-400 mb-1">From</p>
            {params.isTokenAmount === false ? (
              <div>
                <p className="text-2xl font-bold text-white">${params.amount}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {isLoadingQuote ? (
                    <span className="animate-pulse">Calculating...</span>
                  ) : actualInputAmount ? (
                    `≈ ${actualInputAmount.toFixed(6)} ${params.fromToken}`
                  ) : (
                    'Loading...'
                  )}
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-white">{params.amount} {params.fromToken}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <img src={tokenIcons[params.fromToken]} alt={params.fromToken} className="w-10 h-10" />
            <span className="text-lg font-semibold text-white">{params.fromToken}</span>
          </div>
        </div>
        <div className="flex justify-center py-2 bg-white/5">
          <FaExchangeAlt className="text-blue-400 text-xl" />
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">To (Est.)</p>
            <p className="text-2xl font-bold text-blue-400">
              {isLoadingQuote ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                estimatedOutput || '~0.0000'
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <img src={tokenIcons[params.toToken]} alt={params.toToken} className="w-10 h-10" />
            <span className="text-lg font-semibold text-white">{params.toToken}</span>
          </div>
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Exchange Rate</span>
          <span className="text-white">
            {isLoadingQuote ? (
              <span className="animate-pulse">Loading...</span>
            ) : actualInputAmount && estimatedOutput ? (
              `1 ${params.fromToken} ≈ ${(parseFloat(estimatedOutput) / actualInputAmount).toFixed(4)} ${params.toToken}`
            ) : (
              'Calculating...'
            )}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Price Impact</span>
          <span className={`font-semibold ${parseFloat(priceImpact || '0') > 1 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {isLoadingQuote ? <span className="animate-pulse">...</span> : (priceImpact || '<0.1%')}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Slippage Tolerance</span>
          <span className="text-white">{params.slippage || 0.5}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Network Fee</span>
          <span className="text-white">{gasEstimate}</span>
        </div>
      </div>
    </>
  );

  const renderVaultDetails = (params: VaultTradeParams) => (
    <>
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <p className="text-xs text-gray-400 mb-1">
              {params.action === 'stake' ? 'Staking Amount' : 'Unstaking Amount'}
            </p>
            <p className="text-2xl font-bold text-white">{params.amount}</p>
          </div>
          <div className="flex items-center space-x-2">
            <img src={tokenIcons[params.token]} alt={params.token} className="w-10 h-10" />
            <span className="text-lg font-semibold text-white">{params.token}</span>
          </div>
        </div>
        {params.action === 'stake' && params.duration && (
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <p className="text-sm text-gray-400">Lock Duration</p>
            <p className="text-sm font-semibold text-white">{params.duration} days</p>
          </div>
        )}
        <div className="flex items-center justify-between p-3">
          <p className="text-sm text-gray-400">
            {params.action === 'stake' ? 'Estimated APY' : 'Rewards Earned'}
          </p>
          <p className="text-sm font-semibold text-emerald-400">
            {params.action === 'stake' ? '8-12%' : estimatedOutput || '0.00'}
          </p>
        </div>
      </div>
      {params.action === 'unstake' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          <p className="text-xs text-yellow-200/80 leading-relaxed">
            ⚠️ <span className="font-semibold">Note:</span> Early unstaking may incur a penalty. 
            Your rewards will be calculated based on the staking duration.
          </p>
        </div>
      )}
      {params.action === 'stake' && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <p className="text-xs text-purple-200/80 leading-relaxed">
            💎 <span className="font-semibold">Benefits:</span> Earn rewards while supporting the network. 
            Longer lock periods may yield higher APY.
          </p>
        </div>
      )}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-full max-w-md"
    >
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 px-5 py-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 bg-emerald-400/20 rounded-full flex items-center justify-center">
                {getTradeIcon()}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{getTradeTitle()}</h3>
                <p className="text-xs text-gray-400">Review transaction details</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {parameters.type === 'buy' && renderBuyDetails(parameters)}
          {parameters.type === 'sell' && renderSellDetails(parameters)}
          {parameters.type === 'swap' && renderSwapDetails(parameters)}
          {(parameters.type === 'vault' || parameters.type === 'stake') && renderVaultDetails(parameters)}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-xs text-red-200/80 leading-relaxed">
              ⚠️ <span className="font-semibold">Risk:</span> Crypto is volatile. 
              Prices can change rapidly. Only trade what you can afford to lose.
            </p>
          </div>
        </div>
        <div className="px-5 pb-5 flex space-x-3">
          {isExecuted ? (
            <div className="w-full px-5 py-3 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30 text-center font-medium text-sm">
              ✅ Order Executed Successfully
            </div>
          ) : (
            <>
              <button
                onClick={onCancel}
                disabled={isConfirming}
                className="flex-1 px-5 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl border border-white/10 transition-all duration-200 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoadingQuote || isConfirming}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-blue-500 hover:from-emerald-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
              >
                {isConfirming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    <span>Confirm</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
