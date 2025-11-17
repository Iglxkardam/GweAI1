import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCopy, FaCheck } from 'react-icons/fa';
import QRCode from 'react-qr-code';
import { generateQRValue, copyToClipboard } from '../utils/format';

interface DepositCardProps {
  address: string;
  name?: string;
  email?: string;
  balance: string;
  symbol?: string;
  chainId?: number;
  usdValue?: number;
  onRefresh?: () => void;
  selectedToken?: 'ETH' | 'USDC';
  onTokenChange?: (token: 'ETH' | 'USDC') => void;
  onShowAssets?: () => void;
  onExportKey?: () => void;
  onDisconnect?: () => void;
}

// USDC contract address on Base Sepolia
const USDC_CONTRACT_ADDRESS = '0x1ac7A0ebf13a996D5915e212900bE2d074f94988'; // Base Sepolia USDC

export const DepositCard: React.FC<DepositCardProps> = ({ 
  address, 
  name, 
  email, 
  balance, 
  symbol = 'ETH', 
  chainId = 11124,
  selectedToken = 'ETH',
  onShowAssets,
  onExportKey,
  onDisconnect
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Generate QR value with proper EIP-681 format
  // For USDC, include the token contract address
  const tokenContract = selectedToken === 'USDC' ? USDC_CONTRACT_ADDRESS : undefined;
  const qrValue = generateQRValue(address, chainId, tokenContract);

  const handleCopyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    if (await copyToClipboard(address)) {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  return (
    <div style={{ perspective: '1500px' }} className="w-full max-w-lg mx-auto px-4">
      <motion.div
        className="relative w-full aspect-[1.586/1]"
        style={{ 
          transformStyle: 'preserve-3d',
          cursor: 'pointer',
          willChange: 'transform'
        }}
        initial={{ opacity: 1, y: 0, rotateY: 0 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          rotateY: isFlipped ? 180 : 0 
        }}
        transition={{ 
          duration: 0.8, 
          ease: [0.175, 0.885, 0.32, 1.275],
          opacity: { duration: 0 }
        }}
        onClick={() => {
          setIsFlipped(!isFlipped);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileTap={{ scale: 0.98 }}
      >
        {/* FRONT SIDE */}
        <div 
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            fontSmooth: 'always',
            textRendering: 'optimizeLegibility'
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            {/* Animated Bubbles on Hover */}
            {isHovered && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-white/20"
                    style={{
                      left: `${Math.random() * 100}%`,
                      bottom: '-20px',
                      width: `${15 + Math.random() * 30}px`,
                      height: `${15 + Math.random() * 30}px`,
                    }}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ 
                      y: -400,
                      opacity: [0, 0.6, 0],
                      x: Math.random() * 40 - 20
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </>
            )}
            
            {/* Header */}
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <img 
                  src="/igl-sipfi-logo.svg" 
                  alt="IGL SIPfi Logo" 
                  className="h-12 w-12"
                />
                <div>
                  <p className="text-white/90 text-xs font-bold tracking-wide uppercase" style={{ fontSmooth: 'always' }}>DEPOSIT CARD</p>
                  <p className="text-white text-xl font-black" style={{ fontSmooth: 'always' }}>Wallet</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {/* Disconnect Button */}
                {onDisconnect && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to disconnect your wallet?')) {
                        onDisconnect();
                      }
                    }}
                    className="bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-200 active:scale-95 border border-red-500/30"
                    title="Disconnect Wallet"
                  >
                    <p className="text-red-300 text-xs font-bold tracking-wider" style={{ fontSmooth: 'always' }}>DISCONNECT</p>
                  </button>
                )}
                {/* Assets Button */}
                {onShowAssets && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowAssets();
                    }}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-200 active:scale-95"
                  >
                    <p className="text-white text-xs font-bold tracking-wider" style={{ fontSmooth: 'always' }}>ASSETS</p>
                  </button>
                )}
              </div>
            </div>
            
            {/* Wallet Address Section */}
            <div className="relative z-10 space-y-2">
              <p className="text-white/90 text-l font-semibold tracking-widest mb-1.5 uppercase" style={{ fontSmooth: 'always' }}>WALLET ADDRESS</p>
              <p className="text-white text-sm font-mono font-medium break-all leading-tight" style={{ fontSmooth: 'always', letterSpacing: '-0.01em' }}>{address}</p>
            </div>
            
            {/* Footer */}
            <div className="flex items-end justify-between relative z-10">
              <div className="flex-1">
                <p className="text-white/90 text-l font-semibold tracking-widest mb-1.5 uppercase" style={{ fontSmooth: 'always' }}>CARDHOLDER</p>
                <p className="text-white text-sm font-bold uppercase tracking-wide" style={{ fontSmooth: 'always' }}>
                  {name || `${address.slice(0, 6)}...${address.slice(-4)}`}
                </p>
                {email && (
                  <p className="text-white/80 text-sm font-normal mt-1 tracking-wide" style={{ fontSmooth: 'always' }}>
                    {email}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                {/* Export Key Button */}
                {onExportKey && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportKey();
                    }}
                    className="p-3 bg-yellow-600/20 rounded-xl hover:bg-yellow-600/30 transition-all duration-200 active:scale-95 backdrop-blur-sm border border-yellow-500/30"
                    title="Export Private Key - Backup your wallet"
                  >
                    <svg className="text-yellow-400 text-lg w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </button>
                )}
                
                {/* Copy Button */}
                <button 
                  onClick={handleCopyAddress} 
                  className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-200 active:scale-95 backdrop-blur-sm"
                >
                  {copiedAddress ? <FaCheck className="text-white text-lg" /> : <FaCopy className="text-white text-lg" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div 
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden', 
            transform: 'rotateY(180deg)',
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            fontSmooth: 'always',
            textRendering: 'optimizeLegibility'
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 translate-x-1/2"></div>
            
            {/* Animated Bubbles on Hover */}
            {isHovered && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`back-${i}`}
                    className="absolute rounded-full bg-white/15"
                    style={{
                      left: `${Math.random() * 100}%`,
                      bottom: '-20px',
                      width: `${15 + Math.random() * 30}px`,
                      height: `${15 + Math.random() * 30}px`,
                    }}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ 
                      y: -400,
                      opacity: [0, 0.6, 0],
                      x: Math.random() * 40 - 20
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      delay: i * 0.15,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </>
            )}
            
            {/* Logo - Top */}
            <div className="absolute top-6 left-6 z-10">
              <img 
                src="/igl-sipfi-logo.svg" 
                alt="IGL SIPfi Logo" 
                className="h-10 w-10"
              />
            </div>
            
            {/* Content Container */}
            <div className="flex flex-col items-center gap-6 relative z-10 w-full max-w-md">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <QRCode 
                  value={qrValue}
                  size={140} 
                  level="H"
                />
              </div>
              
              {/* Wallet Address with Copy */}
              <div className="w-full space-y-2.5" onClick={(e) => e.stopPropagation()}>
                <p className="text-white/80 text-xs font-semibold text-center tracking-widest uppercase" style={{ fontSmooth: 'always' }}>
                  Wallet Address
                </p>
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 bg-white/15 rounded-xl px-4 py-3 border border-white/20 backdrop-blur-sm">
                    <p className="text-white text-sm font-mono font-medium truncate" style={{ fontSmooth: 'always', letterSpacing: '-0.01em' }}>{address}</p>
                  </div>
                  <button 
                    onClick={handleCopyAddress}
                    className="p-3 bg-white/25 rounded-xl hover:bg-white/35 transition-all duration-200 active:scale-95 flex-shrink-0 backdrop-blur-sm"
                  >
                    {copiedAddress ? <FaCheck className="text-green-400 text-lg" /> : <FaCopy className="text-white text-lg" />}
                  </button>
                </div>
                <p className="text-white/60 text-[10px] text-center tracking-wide" style={{ fontSmooth: 'always' }}>
                  ✓ All deposits verified for Abstract Testnet
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <span className="sr-only">Balance: {balance} {symbol}</span>
    </div>
  );
};
