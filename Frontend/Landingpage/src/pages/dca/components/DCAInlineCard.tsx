import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import { TOKENS } from '../../../config/tokens';

export interface DCAParameters {
  amount: number;
  token: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  duration: number;
  startDay?: string;
}

interface DCAInlineCardProps {
  parameters: DCAParameters;
  onApprove: (params: DCAParameters) => void;
  onCancel: () => void;
}

const tokenIcons: Record<string, React.ReactNode> = {
  'BTC': <img src={TOKENS.BTC.logo} alt="BTC" className="w-8 h-8" />,
  'ETH': <img src={TOKENS.ETH.logo} alt="ETH" className="w-8 h-8" />,
  'SOL': <img src={TOKENS.SOL.logo} alt="SOL" className="w-8 h-8" />,
};

const frequencyLabels: Record<string, string> = {
  'daily': 'Daily',
  'weekly': 'Weekly',
  'monthly': 'Monthly',
};

export const DCAInlineCard: React.FC<DCAInlineCardProps> = ({
  parameters,
  onApprove,
  onCancel,
}) => {
  const totalInvestment = parameters.amount * parameters.duration * (
    parameters.frequency === 'daily' ? 30 :
    parameters.frequency === 'weekly' ? 4 :
    1
  );

  const handleApprove = () => {
    onApprove(parameters);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-full max-w-md"
    >
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-blue-5000/20 px-5 py-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 bg-emerald-400/20 rounded-full flex items-center justify-center">
                <FaCheckCircle className="text-emerald-400 text-lg" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm DCA Plan</h3>
                <p className="text-xs text-gray-400">Review your investment details</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          

          {/* Investment Details */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            {/* Amount Row */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <p className="text-xs text-gray-400 mb-1">Investment Amount</p>
                <p className="text-2xl font-bold text-white">${parameters.amount}</p>
              </div>
              <div className="text-3xl">
                {tokenIcons[parameters.token] || '💰'}
              </div>
            </div>

            {/* Token Row */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <p className="text-sm text-gray-400">Token</p>
              <div className="flex items-center space-x-2">
                <span className="text-base font-semibold text-white">{parameters.token}</span>
                <span className="text-xs text-gray-500">
                  {parameters.token === 'BTC' ? 'Bitcoin' :
                   parameters.token === 'ETH' ? 'Ethereum' :
                   parameters.token === 'SOL' ? 'Solana' : ''}
                </span>
              </div>
            </div>

            {/* Frequency Row */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <p className="text-sm text-gray-400">Frequency</p>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-white">
                  {frequencyLabels[parameters.frequency]}
                </span>
                {parameters.startDay && (
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {parameters.startDay}
                  </span>
                )}
              </div>
            </div>

            {/* Duration Row */}
            <div className="flex items-center justify-between p-3">
              <p className="text-sm text-gray-400">Duration</p>
              <p className="text-sm font-semibold text-white">
                {parameters.duration} month{parameters.duration > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Total Investment Summary */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-300">Total Investment</p>
              <p className="text-xs text-emerald-400">
                {parameters.frequency === 'daily' ? `${parameters.duration * 30} days` :
                 parameters.frequency === 'weekly' ? `${parameters.duration * 4} weeks` :
                 `${parameters.duration} months`}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-white">${totalInvestment.toLocaleString()}</p>
              <p className="text-xs text-gray-400">
                ${parameters.amount} × {parameters.frequency === 'daily' ? parameters.duration * 30 :
                                         parameters.frequency === 'weekly' ? parameters.duration * 4 :
                                         parameters.duration}
              </p>
            </div>
          </div>

          {/* Risk Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-xs text-yellow-200/80 leading-relaxed">
              ⚠️ <span className="font-semibold">Risk:</span> Crypto is volatile. Only invest what you can afford to lose.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 pb-5 flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all duration-200 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            className="flex-1 px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-blue-5000 hover:from-emerald-500 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
          >
            <FaCheckCircle />
            <span>Approve Plan</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
