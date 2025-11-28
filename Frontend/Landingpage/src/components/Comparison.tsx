import React from 'react';
import { Section } from './Section';
import { AnimatedSection } from './AnimatedSection';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export const Comparison: React.FC = () => {
  const comparisons = [
    {
      feature: 'Setup Complexity',
      traditional: 'Wallet, KYC, seed phrases',
      iglFinance: 'Email or social login',
      better: true,
    },
    {
      feature: 'Trading Discipline',
      traditional: 'Manual, emotional',
      iglFinance: 'Automated, systematic',
      better: true,
    },
    {
      feature: 'AI Intelligence',
      traditional: 'None or centralized',
      iglFinance: 'On-chain, decentralized',
      better: true,
    },
    {
      feature: 'Transparency',
      traditional: 'Black box operations',
      iglFinance: 'Fully auditable on-chain',
      better: true,
    },
  ];

  return (
    <Section className="bg-gradient-to-b from-gray-900 to-black">
      <AnimatedSection direction="fade">
        <div className="text-center mb-20">
          <span className="text-sm text-white/50 uppercase tracking-wider mb-4 block">Comparison</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why Choose <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">GweAI</span>
          </h2>
        </div>
      </AnimatedSection>

      <AnimatedSection direction="up" delay={0.3}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 p-6 bg-white/5 border-b border-white/10">
              <div className="text-white/80 font-semibold text-sm">Feature</div>
              <div className="text-center text-white/60 font-medium text-sm">Traditional</div>
              <div className="text-center text-blue-400 font-semibold text-sm">GweAI</div>
            </div>

            {/* Rows */}
            {comparisons.map((item, index) => (
              <div
                key={index}
                className={`grid grid-cols-3 gap-4 p-6 ${
                  index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
                }`}
              >
                <div className="text-white font-medium text-sm">{item.feature}</div>
                
                <div className="text-center flex flex-col items-center gap-2">
                  <FaTimesCircle className="text-xl text-red-400/80" />
                  <span className="text-xs text-white/50">{item.traditional}</span>
                </div>
                
                <div className="text-center flex flex-col items-center gap-2">
                  <FaCheckCircle className="text-xl text-green-400" />
                  <span className="text-xs text-white/50">{item.iglFinance}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>
    </Section>
  );
};
