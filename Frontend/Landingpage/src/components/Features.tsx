import React from 'react';
import { Section } from './Section';
import { AnimatedSection } from './AnimatedSection';
import { FaWallet, FaBrain, FaCalendarAlt, FaLock, FaComments, FaSearch } from 'react-icons/fa';

export const Features: React.FC = () => {
  const features = [
    {
      icon: <FaBrain className="text-3xl" />,
      title: 'On-Chain AI Analysis',
      description: 'Real-time market intelligence powered by Galadriel AI. Fully decentralized, trustless execution.',
    },
    {
      icon: <FaCalendarAlt className="text-3xl" />,
      title: 'Smart DCA Automation',
      description: 'Set your strategy once. AI executes optimal buy orders based on market conditions 24/7.',
    },
    {
      icon: <FaWallet className="text-3xl" />,
      title: 'Account Abstraction',
      description: 'No complex wallet setup. Trade with email or social accounts via smart contract wallets.',
    },
    {
      icon: <FaLock className="text-3xl" />,
      title: 'Self-Custody Control',
      description: 'Your keys, your crypto. Optional vault locking prevents emotional panic selling.',
    },
    {
      icon: <FaComments className="text-3xl" />,
      title: 'Natural Language',
      description: 'Chat with your portfolio. AI understands your intent and executes trades instantly.',
    },
    {
      icon: <FaSearch className="text-3xl" />,
      title: 'Fully Transparent',
      description: 'Every transaction on-chain. Open-source contracts. Auditable on Abstract explorer.',
    },
  ];

  return (
    <Section id="features" className="bg-black py-24 md:py-32">
      <AnimatedSection direction="fade">
        <div className="text-center mb-16 md:mb-20">
          <span className="text-xs md:text-sm text-blue-400 uppercase tracking-widest mb-4 block font-semibold">
            Platform Features
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Everything You Need to
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Invest Smarter
            </span>
          </h2>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto">
            Built with cutting-edge tech to give you institutional-grade trading tools
          </p>
        </div>
      </AnimatedSection>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {features.map((feature, index) => (
          <AnimatedSection key={index} direction="up" delay={index * 0.05}>
            <div className="relative group h-full">
              {/* Gradient border effect */}
              <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
              
              {/* Card content */}
              <div className="relative h-full p-6 md:p-8 rounded-2xl bg-black border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300">
                <div className="mb-4 text-blue-400 group-hover:text-purple-400 transition-colors">
                  {feature.icon}
                </div>
                
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-white/60 text-sm md:text-base leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </Section>
  );
};
