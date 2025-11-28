/**
 * Network Switching Component
 * 
 * Allows users to switch between different EVM networks
 * Currently configured for Base Sepolia, but can be extended to support multiple networks
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaNetworkWired, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useComprehensiveWallet } from '../hooks/useComprehensiveWallet';

// Network configurations
const NETWORKS = [
  {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://base-sepolia.g.alchemy.com/v2/-mGklZw8tTiO9fg9sRGQP',
    blockExplorer: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    icon: '🔵',
    color: 'blue',
  },
  {
    id: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    icon: '⟠',
    color: 'purple',
    disabled: true, // Not configured yet
  },
  {
    id: 8453,
    name: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    icon: '🔷',
    color: 'blue',
    disabled: true, // Not configured yet
  },
] as const;

export const NetworkSwitcher: React.FC = () => {
  const { chainId, connected, primaryWallet } = useComprehensiveWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  
  const currentNetwork = NETWORKS.find(n => n.id === chainId) || NETWORKS[0];
  
  // Switch network using wallet connector
  const switchNetwork = async (networkId: number) => {
    if (!primaryWallet) return;
    
    try {
      setIsSwitching(true);
      
      const network = NETWORKS.find(n => n.id === networkId);
      if (!network) {
        throw new Error('Network not found');
      }
      
      // Use Dynamic's wallet connector to switch network
      const connector: any = primaryWallet.connector;
      
      if (typeof connector.switchNetwork === 'function') {
        await connector.switchNetwork({ networkChainId: networkId });
      } else {
        // Fallback to manual network switch using eth_switchEthereumChain
        try {
          await connector.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${networkId.toString(16)}` }],
          });
        } catch (switchError: any) {
          // If network doesn't exist, try to add it
          if (switchError.code === 4902) {
            await connector.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${networkId.toString(16)}`,
                  chainName: network.name,
                  rpcUrls: [network.rpcUrl],
                  nativeCurrency: network.nativeCurrency,
                  blockExplorerUrls: [network.blockExplorer],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }
      
      setIsOpen(false);
    } catch (err: any) {
      console.error('Network switch error:', err);
    } finally {
      setIsSwitching(false);
    }
  };
  
  if (!connected) {
    return null;
  }
  
  return (
    <div className="relative">
      {/* Network Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all ${
          chainId !== 84532 ? 'border-yellow-500/50' : ''
        }`}
      >
        <span className="text-xl">{currentNetwork.icon}</span>
        <div className="text-left">
          <p className="text-xs text-gray-400">Network</p>
          <p className="text-sm font-semibold text-white">{currentNetwork.name}</p>
        </div>
        {chainId !== 84532 && (
          <FaExclamationTriangle className="text-yellow-400 text-sm" />
        )}
      </motion.button>
      
      {/* Network Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[280px]"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <FaNetworkWired className="text-purple-400" />
                <h3 className="font-semibold text-white">Select Network</h3>
              </div>
            </div>
            
            {/* Error Message */}

            
            {/* Network List */}
            <div className="p-2">
              {NETWORKS.map((network) => {
                const isDisabled = 'disabled' in network && network.disabled;
                return (
                <button
                  key={network.id}
                  onClick={() => !isDisabled && switchNetwork(network.id)}
                  disabled={isDisabled || isSwitching}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                    network.id === chainId
                      ? 'bg-purple-600/20 border border-purple-500/50'
                      : isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{network.icon}</span>
                    <div className="text-left">
                      <p className="font-semibold text-white">{network.name}</p>
                      <p className="text-xs text-gray-400">
                        Chain ID: {network.id}
                        {isDisabled && ' • Coming Soon'}
                      </p>
                    </div>
                  </div>
                  
                  {network.id === chainId && (
                    <FaCheck className="text-green-400" />
                  )}
                </button>
              );
              })}
            </div>
            
            {/* Footer */}
            {chainId !== 84532 && (
              <div className="px-4 py-3 bg-yellow-500/10 border-t border-yellow-500/20">
                <p className="text-xs text-yellow-400">
                  ⚠️ Please switch to Base Sepolia for full functionality
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
