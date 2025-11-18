import React, { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { FaArrowRight, FaChartLine, FaCheckCircle } from 'react-icons/fa';
import { Button } from './Button';
import { ComingSoonModal } from './ComingSoonModal';

interface HeroProps {
  onStartInvesting?: () => void;
}

export const Hero: React.FC<HeroProps> = memo(({ onStartInvesting }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleStartInvesting = useCallback(() => {
    if (onStartInvesting) {
      onStartInvesting();
    } else {
      setIsModalOpen(true);
    }
  }, [onStartInvesting]);
  
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);
  
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />
      
      {/* Refined grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      {/* Accent glow effects */}
      <motion.div
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-500/30 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.12, 0.22, 0.12],
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[120px]"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-sm text-blue-300 backdrop-blur-sm">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Powered by AI • Built on Abstract
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
              The Future of
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Automated Investing
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
              AI-powered dollar-cost averaging that removes emotion from crypto investing. 
              Set your strategy once, let smart contracts do the rest.
            </p>

            {/* Key benefits list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-white/60"
            >
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 text-lg" />
                <span>Non-custodial</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 text-lg" />
                <span>AI-optimized entries</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 text-lg" />
                <span>24/7 automated</span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
            >
              <Button 
                variant="primary" 
                size="lg"
                onClick={handleStartInvesting}
                className="bg-white text-black hover:bg-gray-100 font-semibold group shadow-2xl px-8 py-4 text-base"
              >
                Start Investing Now
                <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setIsModalOpen(true)}
                className="border-white/20 text-white hover:bg-white/5 backdrop-blur-sm px-8 py-4 text-base"
              >
                <FaChartLine className="mr-2" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-20 max-w-5xl mx-auto"
          >
            {[
              { value: '$2.5M+', label: 'Trading Volume' },
              { value: '500+', label: 'Active Users' },
              { value: '12.4%', label: 'Avg. Annual Return' },
              { value: '24/7', label: 'AI Monitoring' },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-white/50 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-wrap justify-center items-center gap-8 md:gap-12 text-white/40 text-sm"
          >
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:border-blue-500/30 transition-all">
                <span className="text-sm font-bold text-white/70">AB</span>
              </div>
              <span className="font-medium">Abstract</span>
            </div>
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:border-purple-500/30 transition-all">
                <span className="text-sm font-bold text-white/70">AI</span>
              </div>
              <span className="font-medium">Galadriel</span>
            </div>
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:border-blue-500/30 transition-all">
                <span className="text-sm font-bold text-white/70">CL</span>
              </div>
              <span className="font-medium">Chainlink</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Coming Soon Modal */}
      <ComingSoonModal isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  );
});

Hero.displayName = 'Hero';
