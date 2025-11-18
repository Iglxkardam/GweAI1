import React from 'react';
import { Section } from './Section';
import { AnimatedSection } from './AnimatedSection';
import { FaCreditCard, FaComments, FaChartBar } from 'react-icons/fa';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      icon: <FaCreditCard className="text-4xl" />,
      title: 'Connect & Fund',
      description: 'Sign in with email or wallet. Deposit USDC or use supported fiat ramps.',
      detail: 'No seed phrases needed',
    },
    {
      number: '02',
      icon: <FaComments className="text-4xl" />,
      title: 'Define Strategy',
      description: 'Tell AI your investment plan in plain English. Get optimized DCA parameters.',
      detail: '"Buy $100 BTC weekly when RSI < 40"',
    },
    {
      number: '03',
      icon: <FaChartBar className="text-4xl" />,
      title: 'Auto-Execute',
      description: 'Smart contracts execute trades automatically 24/7 with AI monitoring.',
      detail: 'Non-custodial & verifiable on-chain',
    },
  ];

  return (
    <Section id="how-it-works" className="bg-black py-24 md:py-32">
      <AnimatedSection direction="fade">
        <div className="text-center mb-16 md:mb-20">
          <span className="text-xs md:text-sm text-blue-400 uppercase tracking-widest mb-4 block font-semibold">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Start Investing in
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              3 Simple Steps
            </span>
          </h2>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto">
            From signup to automated DCA in under 5 minutes
          </p>
        </div>
      </AnimatedSection>

      <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
        {/* Connection line */}
        <div className="hidden md:block absolute top-8 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />

        {steps.map((step, index) => (
          <AnimatedSection key={index} direction="up" delay={index * 0.1}>
            <div className="relative z-10 text-center h-full group">
              {/* Step number badge */}
              <div className="mb-6 relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-white/20 flex items-center justify-center text-white font-mono text-lg backdrop-blur-sm group-hover:border-blue-400 transition-colors">
                  {step.number}
                </div>
              </div>
              
              {/* Icon */}
              <div className="mb-6 flex justify-center text-blue-400 group-hover:text-purple-400 transition-colors">
                {step.icon}
              </div>
              
              {/* Title */}
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                {step.title}
              </h3>
              
              {/* Description */}
              <p className="text-white/60 mb-4 leading-relaxed text-sm">
                {step.description}
              </p>
              
              {/* Detail badge */}
              <div className="inline-block px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-white/50 text-xs">{step.detail}</p>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </Section>
  );
};
