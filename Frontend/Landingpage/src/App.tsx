import { useState, useEffect, memo, lazy, Suspense } from 'react';
import { DynamicUserProfile } from '@dynamic-labs/sdk-react-core';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Problem } from './components/Problem';
import { Solution } from './components/Solution';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { TechStack } from './components/TechStack';
import { Comparison } from './components/Comparison';
import { SocialProof } from './components/SocialProof';
import { FAQ } from './components/FAQ';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { AppNavbar } from './layout/AppNavbar';
import { BackgroundMusic } from './components/BackgroundMusic';
import { LoadingScreen } from './components/LoadingScreen';
import { useWalletStorageManager } from './hooks/useWalletStorageManager';
import ErrorBoundary from './components/ErrorBoundary';
import { PriceProvider } from './context/PriceContext';
import { ToastContainer } from './components/Toast';

// Lazy load pages for better initial load performance (scalable for 100k+ users)
const DCAPage = lazy(() => import('./pages/dca/DCAPage').then(m => ({ default: m.DCAPage })));
const MarketListPage = lazy(() => import('./pages/market').then(m => ({ default: m.MarketListPage })));
const TradingPage = lazy(() => import('./pages/market').then(m => ({ default: m.TradingPage })));
const PortfolioPage = lazy(() => import('./pages/portfolio/PortfolioPage').then(m => ({ default: m.PortfolioPage })));
const TransactionPage = lazy(() => import('./pages/transaction/TransactionPage').then(m => ({ default: m.TransactionPage })));
const SwapPage = lazy(() => import('./pages/swap/SwapPage').then(m => ({ default: m.SwapPage })));
const DepositPage = lazy(() => import('./pages/deposit/DepositPage').then(m => ({ default: m.DepositPage })));
const VaultPage = lazy(() => import('./pages/vault/VaultPage').then(m => ({ default: m.VaultPage })));
const SubscriptionPage = lazy(() => import('./pages/subscription/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })));

type Page = 'landing' | 'dca' | 'market' | 'portfolio' | 'transactions' | 'swap' | 'deposit' | 'vault' | 'subscription';
type TradingPair = 'BTC/USDC' | 'ETH/USDC' | 'XRP/USDC' | 'BNB/USDC' | 'SOL/USDC' | 'DOGE/USDC' | 'ADA/USDC' | 'TRX/USDC' | 'AVAX/USDC' | 'TON/USDC';

const App = () => {
  // Initialize wallet storage manager (handles wallet-specific data isolation)
  useWalletStorageManager();

  // Initialize state from localStorage or default to 'landing'
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const savedPage = localStorage.getItem('currentPage');
    return (savedPage as Page) || 'landing';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTradingPair, setSelectedTradingPair] = useState<TradingPair | null>(null);

  // Save to localStorage whenever the page changes
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
    
    // Close sidebar when changing pages
    setIsSidebarOpen(false);
    
    // Reset selected trading pair when leaving market page
    if (currentPage !== 'market') {
      setSelectedTradingPair(null);
    }
    
    // Update body class based on current page
    if (currentPage === 'landing') {
      document.body.classList.add('landing-page');
    } else {
      document.body.classList.remove('landing-page');
    }
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dca':
      case 'market':
      case 'portfolio':
      case 'transactions':
      case 'swap':
      case 'deposit':
      case 'vault':
      case 'subscription':
        return (
          <>
            <AppNavbar 
              currentPage={currentPage} 
              setCurrentPage={setCurrentPage}
              sidebarOpen={isSidebarOpen}
            />
            <Suspense fallback={<LoadingScreen />}>
              <div style={{ position: 'relative', minHeight: '100vh' }}>
                {currentPage === 'dca' && <DCAPage />}
                {currentPage === 'market' && (
                  selectedTradingPair ? (
                    <TradingPage 
                      pair={selectedTradingPair} 
                      onBack={() => setSelectedTradingPair(null)} 
                    />
                  ) : (
                    <MarketListPage onSelectPair={setSelectedTradingPair} />
                  )
                )}
                {currentPage === 'portfolio' && <PortfolioPage />}
                {currentPage === 'transactions' && <TransactionPage />}
                {currentPage === 'swap' && <SwapPage />}
                {currentPage === 'deposit' && <DepositPage />}
                {currentPage === 'vault' && <VaultPage />}
                {currentPage === 'subscription' && <SubscriptionPage />}
              </div>
            </Suspense>
          </>
        );
      case 'landing':
      default:
        return (
          <>
            <div className="min-h-screen bg-black">
              <Navbar />
              <Hero onStartInvesting={() => setCurrentPage('dca')} />
              <Problem />
              <Solution />
              <HowItWorks />
              <Features />
              <TechStack />
              <Comparison />
              <SocialProof />
              <FAQ />
              <CTA />
              <Footer />
            </div>
          </>
        );
    }
  };

  return (
    <PriceProvider>
      <ErrorBoundary>
        {renderPage()}
        <BackgroundMusic />
        {/* Dynamic User Profile - Required for wallet export functionality */}
        <DynamicUserProfile variant="modal" />
        <ToastContainer />
      </ErrorBoundary>
    </PriceProvider>
  );
};

export default memo(App);
