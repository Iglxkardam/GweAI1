import { useState, useEffect, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { CustomCursor } from './components/CustomCursor';
import { BackgroundMusic } from './components/BackgroundMusic';
import { useWalletStorageManager } from './hooks/useWalletStorageManager';
import ErrorBoundary from './components/ErrorBoundary';

// Import all pages directly - no lazy loading for instant page switching
import { DCAPage } from './pages/dca/DCAPage';
import { MarketPage } from './pages/market';
import { PortfolioPage } from './pages/portfolio/PortfolioPage';
import { TransactionPage } from './pages/transaction/TransactionPage';
import { SwapPage } from './pages/swap/SwapPage';
import { DepositPage } from './pages/deposit/DepositPage';
import { VaultPage } from './pages/vault/VaultPage';
import { SubscriptionPage } from './pages/subscription/SubscriptionPage';

type Page = 'landing' | 'dca' | 'market' | 'portfolio' | 'transactions' | 'swap' | 'deposit' | 'vault' | 'subscription';

const App = () => {
  // Initialize wallet storage manager (handles wallet-specific data isolation)
  useWalletStorageManager();

  // Initialize state from localStorage or default to 'landing'
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const savedPage = localStorage.getItem('currentPage');
    return (savedPage as Page) || 'landing';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Save to localStorage whenever the page changes
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
    
    // Close sidebar when changing pages
    setIsSidebarOpen(false);
    
    // Update body class based on current page
    if (currentPage === 'landing') {
      document.body.classList.add('landing-page');
    } else {
      document.body.classList.remove('landing-page');
    }
  }, [currentPage]);

  const renderPage = () => {
    const pageVariants = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    };

    const pageTransition = {
      type: "tween",
      ease: "easeInOut",
      duration: 0.3
    };

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
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                {currentPage === 'dca' && <DCAPage onSidebarToggle={setIsSidebarOpen} />}
                {currentPage === 'market' && <MarketPage />}
                {currentPage === 'portfolio' && <PortfolioPage />}
                {currentPage === 'transactions' && <TransactionPage />}
                {currentPage === 'swap' && <SwapPage />}
                {currentPage === 'deposit' && <DepositPage />}
                {currentPage === 'vault' && <VaultPage />}
                {currentPage === 'subscription' && <SubscriptionPage />}
              </motion.div>
            </AnimatePresence>
            <CustomCursor theme="app" />
          </>
        );
      case 'landing':
      default:
        return (
          <motion.div
            className="min-h-screen bg-black"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
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
          </motion.div>
        );
    }
  };

  return (
    <ErrorBoundary>
      {renderPage()}
      <BackgroundMusic />
    </ErrorBoundary>
  );
};

export default memo(App);
