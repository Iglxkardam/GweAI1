/**
 * WalletConnectButton Component
 * 
 * Privy Embedded Wallet - Login with Email, Google, or Twitter
 * Wallet is created automatically after authentication
 */

import React from 'react';
import { FaWallet } from 'react-icons/fa';
import { useAgwWallet } from '../hooks/useAgwWallet';

interface WalletConnectButtonProps {
  onConnect?: (address: string) => void;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ onConnect }) => {
  const { connected, address, loading, signIn, signOut } = useAgwWallet();

  const handleConnect = async () => {
    try {
      await signIn();
      if (onConnect && address) {
        onConnect(address);
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  if (connected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
          <p className="text-white font-mono text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
        <button
          onClick={signOut}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg transition-all duration-200"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 backdrop-blur-md border border-white/20 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
    >
      <FaWallet />
      <span>{loading ? 'Loading...' : 'Login & Create Wallet'}</span>
    </button>
  );
};
