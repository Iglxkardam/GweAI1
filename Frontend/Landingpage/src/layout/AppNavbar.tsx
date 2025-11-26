import React from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaWallet, FaHistory, FaExchangeAlt, FaLock, FaMoneyBillWave, FaCrown, FaChartBar, FaFaucet } from 'react-icons/fa';

type Page = 'landing' | 'dca' | 'market' | 'portfolio' | 'transactions' | 'swap' | 'deposit' | 'vault' | 'subscription' | 'faucet';

interface AppNavbarProps {
  currentPage: 'dca' | 'market' | 'portfolio' | 'transactions' | 'swap' | 'deposit' | 'vault' | 'subscription' | 'faucet';
  setCurrentPage: (page: Page) => void;
  sidebarOpen?: boolean;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ currentPage, setCurrentPage, sidebarOpen = false }) => {
  const isActive = (page: Page) => {
    return currentPage === page;
  };

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 bg-transparent"
      animate={{
        marginLeft: sidebarOpen ? '360px' : '0px'
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Section - with left padding to avoid sidebar overlap */}
          <div className="flex-shrink-0 pl-12">
            <button 
              onClick={() => setCurrentPage('landing')}
              className="flex items-center space-x-3 text-xl font-bold text-white hover:opacity-80 transition-opacity"
            >
              <img 
                src="/igl-sipfi-logo.svg" 
                alt="IGL" 
                className="w-10 h-10 hover:scale-105 transition-transform" 
              />
              <span className="hidden sm:block tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                GweAI
              </span>
            </button>
          </div>

          {/* Center Navigation Group */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-1 bg-white/5 rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setCurrentPage('dca')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm ${
                isActive('dca')
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FaChartLine className="text-sm" />
              <span className="hidden lg:inline">DCA</span>
            </button>

            <button
              onClick={() => setCurrentPage('market')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm ${
                isActive('market')
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FaChartBar className="text-sm" />
              <span className="hidden lg:inline">Market</span>
            </button>

            <button
              onClick={() => setCurrentPage('portfolio')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm ${
                isActive('portfolio')
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FaWallet className="text-sm" />
              <span className="hidden lg:inline">Portfolio</span>
            </button>

            <button
              onClick={() => setCurrentPage('transactions')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm ${
                isActive('transactions')
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FaHistory className="text-sm" />
              <span className="hidden lg:inline">Transactions</span>
            </button>

            <button
              onClick={() => setCurrentPage('swap')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm ${
                isActive('swap')
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FaExchangeAlt className="text-sm" />
              <span className="hidden lg:inline">Swap</span>
            </button>

            <button
              onClick={() => setCurrentPage('vault')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm ${
                isActive('vault')
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FaLock className="text-sm" />
              <span className="hidden lg:inline">Vault</span>
            </button>

            <button
              onClick={() => setCurrentPage('faucet')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm ${
                isActive('faucet')
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FaFaucet className="text-sm" />
              <span className="hidden lg:inline">Faucet</span>
            </button>
          </div>

          {/* Right Action Buttons Group */}
          <div className="flex items-center space-x-2">
            {/* Upgrade Button */}
            <button
              onClick={() => setCurrentPage('subscription')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm ${
                isActive('subscription')
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                  : 'bg-white/5 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/40'
              }`}
            >
              <FaCrown className="text-sm" />
              <span className="hidden sm:inline">Upgrade</span>
            </button>

            {/* Deposit Button */}
            <button 
              onClick={() => setCurrentPage('deposit')}
              className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-blue-500 transition-colors duration-200 text-sm"
            >
              <FaMoneyBillWave className="text-sm" />
              <span className="hidden sm:inline">Deposit</span>
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
