/**
 * AI Trade Confirmation Modal
 * Shows parsed trade details and asks for user confirmation before execution
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaTimes, FaExclamationTriangle, FaRobot } from 'react-icons/fa';
import type { ParsedTradeCommand } from '../services/aiTradeService';

interface AITradeConfirmationModalProps {
  isOpen: boolean;
  parsedCommand: ParsedTradeCommand;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

export const AITradeConfirmationModal: React.FC<AITradeConfirmationModalProps> = ({
  isOpen,
  parsedCommand,
  onConfirm,
  onCancel,
  isExecuting = false,
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy':
        return 'emerald';
      case 'sell':
        return 'red';
      case 'swap':
        return 'blue';
      case 'stake':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy':
        return '📈';
      case 'sell':
        return '📉';
      case 'swap':
        return '🔄';
      case 'stake':
        return '🔒';
      default:
        return '❓';
    }
  };

  const color = getActionColor(parsedCommand.action);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onCancel}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-gray-900 rounded-2xl border border-white/10 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r from-${color}-600 to-${color}-700 p-6 rounded-t-2xl relative`}>
                <button
                  onClick={onCancel}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                  disabled={isExecuting}
                >
                  <FaTimes size={20} />
                </button>

                <div className="flex items-center space-x-3">
                  <div className="text-4xl">{getActionIcon(parsedCommand.action)}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-white capitalize">
                      {parsedCommand.action} Confirmation
                    </h2>
                    <p className="text-white/80 text-sm">
                      Review your transaction before executing
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* AI Confidence Badge */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center space-x-2">
                    <FaRobot className="text-blue-400" />
                    <span className="text-gray-300 text-sm font-medium">AI Confidence</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${parsedCommand.confidence}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full ${
                          parsedCommand.confidence >= 80
                            ? 'bg-green-500'
                            : parsedCommand.confidence >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      />
                    </div>
                    <span className="text-white font-bold text-sm">{parsedCommand.confidence}%</span>
                  </div>
                </div>

                {/* Parsed Intent */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-blue-400 font-semibold mb-2 flex items-center space-x-2">
                    <span>🤖</span>
                    <span>AI Understood</span>
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {parsedCommand.parsed_intent}
                  </p>
                </div>

                {/* Transaction Details */}
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center space-x-2">
                    <FaCheckCircle className="text-green-400" />
                    <span>Transaction Details</span>
                  </h3>

                  <div className="bg-white/5 rounded-lg border border-white/10 divide-y divide-white/10">
                    {/* Action */}
                    <div className="p-3 flex justify-between">
                      <span className="text-gray-400 text-sm">Action</span>
                      <span className={`text-${color}-400 font-semibold capitalize`}>
                        {parsedCommand.action}
                      </span>
                    </div>

                    {/* Amount */}
                    {parsedCommand.amount && (
                      <div className="p-3 flex justify-between">
                        <span className="text-gray-400 text-sm">Amount</span>
                        <span className="text-white font-semibold">
                          {parsedCommand.amount_type === 'usd'
                            ? `$${parsedCommand.amount.toFixed(2)}`
                            : `${parsedCommand.amount} tokens`}
                        </span>
                      </div>
                    )}

                    {/* From Token */}
                    {parsedCommand.from_token && (
                      <div className="p-3 flex justify-between">
                        <span className="text-gray-400 text-sm">From</span>
                        <span className="text-white font-semibold">{parsedCommand.from_token}</span>
                      </div>
                    )}

                    {/* To Token */}
                    {parsedCommand.to_token && (
                      <div className="p-3 flex justify-between">
                        <span className="text-gray-400 text-sm">To</span>
                        <span className="text-white font-semibold">{parsedCommand.to_token}</span>
                      </div>
                    )}

                    {/* Duration (for staking) */}
                    {parsedCommand.duration && (
                      <div className="p-3 flex justify-between">
                        <span className="text-gray-400 text-sm">Lock Period</span>
                        <span className="text-white font-semibold">{parsedCommand.duration} days</span>
                      </div>
                    )}

                    {/* Slippage */}
                    {parsedCommand.slippage && (
                      <div className="p-3 flex justify-between">
                        <span className="text-gray-400 text-sm">Slippage Tolerance</span>
                        <span className="text-white font-semibold">{parsedCommand.slippage}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warnings */}
                {parsedCommand.warnings && parsedCommand.warnings.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <h4 className="text-yellow-400 font-semibold mb-2 flex items-center space-x-2">
                      <FaExclamationTriangle />
                      <span>Warnings</span>
                    </h4>
                    <ul className="space-y-1">
                      {parsedCommand.warnings.map((warning, index) => (
                        <li key={index} className="text-yellow-300/90 text-sm flex items-start space-x-2">
                          <span className="mt-1">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Original Command */}
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <p className="text-gray-400 text-xs mb-1">Your Command:</p>
                  <p className="text-gray-300 text-sm italic">"{parsedCommand.raw_command}"</p>
                </div>

                {/* Terms Agreement */}
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                    disabled={isExecuting}
                  />
                  <span className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                    I confirm that I have reviewed the transaction details and understand that blockchain
                    transactions are irreversible once executed.
                  </span>
                </label>
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-gray-800/50 rounded-b-2xl flex space-x-3">
                <button
                  onClick={onCancel}
                  disabled={isExecuting}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={!agreedToTerms || isExecuting}
                  className={`flex-1 px-6 py-3 bg-gradient-to-r from-${color}-600 to-${color}-700 hover:from-${color}-700 hover:to-${color}-800 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
                >
                  {isExecuting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      <span>Confirm & Execute</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
