import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaFaucet, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { StarfieldBackground } from '../../components';
import { useAgwWallet } from '../deposit/hooks/useAgwWallet';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../utils/toastHelper';

const FAUCET_AMOUNT_USDC = '100'; // 100 USDC
const FAUCET_AMOUNT_ETH = '0.001'; // 0.001 ETH

interface ClaimStatus {
  usdcClaimed: boolean;
  ethClaimed: boolean;
  usdcTimestamp?: number;
  ethTimestamp?: number;
}

export const FaucetPage: React.FC = () => {
  const { address, connected, usdcBalance, ethBalance } = useAgwWallet();
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>({
    usdcClaimed: false,
    ethClaimed: false
  });

  // Load claim status from localStorage
  useEffect(() => {
    if (!address) {
      setClaimStatus({ usdcClaimed: false, ethClaimed: false });
      return;
    }

    const storageKey = `faucet_claims_${address.toLowerCase()}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setClaimStatus(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading claim status:', error);
      }
    }
  }, [address]);

  // Save claim status to localStorage
  const saveClaimStatus = (status: ClaimStatus) => {
    if (!address) return;
    const storageKey = `faucet_claims_${address.toLowerCase()}`;
    localStorage.setItem(storageKey, JSON.stringify(status));
    setClaimStatus(status);
  };

  const handleClaim = async (token: 'USDC' | 'ETH') => {
    if (!connected || !address) {
      showErrorToast(new Error('Please connect your wallet first'));
      return;
    }

    const alreadyClaimed = token === 'USDC' ? claimStatus.usdcClaimed : claimStatus.ethClaimed;
    if (alreadyClaimed) {
      showErrorToast(new Error(`You have already claimed ${token} from the faucet`));
      return;
    }

    setClaiming(true);

    try {
      const amount = token === 'USDC' ? '100 USDC' : '0.001 ETH';
      showInfoToast(
        'Processing Faucet Claim',
        `Sending ${amount} to your wallet...`,
        'Please wait...'
      );

      // Call faucet bot API (gasless transaction)
      const apiUrl = import.meta.env.VITE_FAUCET_BOT_URL || 'http://localhost:3003';
      
      const response = await fetch(`${apiUrl}/api/faucet/request-claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address
        })
      });

      // Check if bot is not responding (connection error)
      if (!response.ok && response.status === 0) {
        throw new Error('FAUCET_OFFLINE');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim from faucet');
      }

      console.log('Faucet claim successful:', data);

      // Update claim status for both tokens since contract sends both
      saveClaimStatus({
        ...claimStatus,
        usdcClaimed: true,
        ethClaimed: true,
        usdcTimestamp: Date.now(),
        ethTimestamp: Date.now()
      });

      showSuccessToast(
        'Claim Successful!',
        `Received 100 USDC + 0.001 ETH`,
        `TX: ${data.txHash?.substring(0, 10)}...`
      );

      // Wait a bit then refresh balances
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error: any) {
      console.error('Faucet claim failed:', error);
      
      // Check if faucet bot is offline
      if (error.message === 'FAUCET_OFFLINE' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
        showErrorToast(new Error('Faucet is currently disabled. Please try again later.'));
      } else {
        showErrorToast(error);
      }
    } finally {
      setClaiming(false);
    }
  };



  return (
    <div 
      className="min-h-screen pt-20 pb-8 px-4 relative"
      style={{
        background: '#000',
        backgroundImage: `
          radial-gradient(circle at top right, rgba(121, 68, 154, 0.13), transparent),
          radial-gradient(circle at 20% 80%, rgba(41, 196, 255, 0.13), transparent)
        `
      }}
    >
      <StarfieldBackground optimized={true} />
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <FaFaucet className="text-white text-xl" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Testnet Faucet
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Get free testnet tokens to start using the platform
          </p>
        </motion.div>

        {/* Connection Warning */}
        {!connected && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6"
          >
            <div className="flex items-start space-x-3">
              <FaExclamationTriangle className="text-yellow-400 text-xl flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-yellow-400 font-semibold mb-1">Wallet Not Connected</h3>
                <p className="text-gray-300 text-sm">
                  Please connect your wallet to claim testnet tokens
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Faucet Card */}
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.02] backdrop-blur-sm rounded-xl border border-white/[0.08] p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex -space-x-3">
                <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="USDC" className="w-16 h-16 relative z-10" />
                <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="w-16 h-16" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Claim Testnet Tokens</h3>
              <p className="text-gray-400 text-sm">Receive 100 USDC + 0.001 ETH</p>
            </div>

            {/* Token Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/[0.05] rounded-lg p-4 text-center">
                <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="USDC" className="w-10 h-10 mx-auto mb-2" />
                <div className="text-white font-bold text-xl mb-1">{FAUCET_AMOUNT_USDC}</div>
                <div className="text-gray-400 text-xs mb-2">USDC</div>
                <div className="text-gray-500 text-xs">Balance: {parseFloat(usdcBalance).toFixed(2)}</div>
              </div>
              
              <div className="bg-white/[0.05] rounded-lg p-4 text-center">
                <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="w-10 h-10 mx-auto mb-2" />
                <div className="text-white font-bold text-xl mb-1">{FAUCET_AMOUNT_ETH}</div>
                <div className="text-gray-400 text-xs mb-2">ETH</div>
                <div className="text-gray-500 text-xs">Balance: {parseFloat(ethBalance).toFixed(4)}</div>
              </div>
            </div>

            {/* Claim Button or Status */}
            {claimStatus.usdcClaimed ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <FaCheckCircle className="text-green-400 text-2xl" />
                  <span className="text-green-400 font-semibold text-lg">Tokens Claimed!</span>
                </div>
                <p className="text-gray-400 text-sm">
                  You can claim again in 24 hours
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleClaim('USDC')}
                  disabled={!connected || claiming}
                  className={`w-full px-8 py-5 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                    !connected || claiming
                      ? 'bg-white/[0.05] text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25'
                  }`}
                >
                  {claiming ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaFaucet className="text-xl" />
                      Claim Tokens
                    </>
                  )}
                </button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
