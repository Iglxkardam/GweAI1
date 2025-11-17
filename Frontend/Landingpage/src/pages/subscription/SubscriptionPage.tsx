import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { StarfieldBackground } from '../../components';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from './config/subscriptionConfig';
import { PlanCard, PurchaseModal, SubscriptionStatus } from './components';
import { useSubscription } from './hooks/useSubscription';
import { PlanType } from './services/contractService';
import { FaSpinner } from 'react-icons/fa';

export const SubscriptionPage: React.FC = () => {
  const {
    isConnected,
    subscription,
    timeRemaining,
    usdcBalance,
    purchasePlan,
    isLoading,
    isPurchasing,
    refetch,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<
    'idle' | 'approving' | 'approved' | 'purchasing' | 'success' | 'error'
  >('idle');
  const [purchaseError, setPurchaseError] = useState<string | undefined>();

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (plan.planType === PlanType.FREE) {
      return;
    }

    // Prevent downgrades
    if (subscription) {
      const planValue = { [PlanType.FREE]: 0, [PlanType.MONTHLY]: 1, [PlanType.YEARLY]: 2 };
      const currentValue = planValue[subscription.planType];
      const targetValue = planValue[plan.planType];
      
      if (targetValue < currentValue) {
        alert('Cannot downgrade to a lower plan. Please wait for your current plan to expire.');
        return;
      }
    }

    setSelectedPlan(plan);
    setIsModalOpen(true);
    setPurchaseStatus('idle');
    setPurchaseError(undefined);
    
    // Refresh balance when opening modal
    refetch();
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPlan) return;

    try {
      // Call the purchase function with progress tracking
      await purchasePlan(selectedPlan.planType, (step) => {
        console.log('[SubscriptionPage] Purchase step:', step);
        setPurchaseStatus(step);
        
        // Auto-close modal on success after 2 seconds
        if (step === 'success') {
          setTimeout(() => {
            refetch();
            setIsModalOpen(false);
            setPurchaseStatus('idle');
          }, 2000);
        }
      });
    } catch (err) {
      // Error already handled by onProgress callback
      setPurchaseError(
        err instanceof Error ? err.message : 'Failed to purchase subscription'
      );
      console.error('[SubscriptionPage] Purchase error:', err);
    }
  };

  const handleCloseModal = () => {
    if (purchaseStatus !== 'approving' && purchaseStatus !== 'purchasing') {
      setIsModalOpen(false);
      setPurchaseStatus('idle');
      setPurchaseError(undefined);
    }
  };

  return (
    <motion.div 
      className="min-h-screen pt-20 pb-8 px-4 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <StarfieldBackground optimized={true} />

      {/* Title Section */}
      <motion.div 
        className="text-center mb-12 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Choose Your Plan
        </h1>
        
      </motion.div>

      {/* Current Subscription Status */}
      {isConnected && subscription && (
        <motion.div 
          className="max-w-3xl mx-auto mb-8 relative z-10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <SubscriptionStatus
            planType={subscription.planType}
            expiryTimestamp={subscription.expiryTimestamp}
            hasAccess={subscription.hasAccess}
            isExpired={subscription.isExpired}
            timeRemaining={timeRemaining}
          />
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12 relative z-10">
          <FaSpinner className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      )}

      {/* Plans Grid */}
      {!isLoading && (
        <motion.section 
          className="grid gap-6 md:gap-8 p-4 md:grid-cols-3 max-w-7xl mx-auto relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {SUBSCRIPTION_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
            >
              <PlanCard
                plan={plan}
                currentPlan={subscription?.planType}
                onSelect={handleSelectPlan}
                isLoading={isPurchasing}
              />
            </motion.div>
          ))}
        </motion.section>
      )}

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        plan={selectedPlan}
        onConfirm={handleConfirmPurchase}
        status={purchaseStatus}
        errorMessage={purchaseError}
        usdcBalance={usdcBalance}
      />
    </motion.div>
  );
};
