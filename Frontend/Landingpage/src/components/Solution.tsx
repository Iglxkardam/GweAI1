import React from 'react';
import { Section } from './Section';
import { AnimatedSection } from './AnimatedSection';
import { FaBolt, FaShieldAlt, FaRobot, FaLock } from 'react-icons/fa';

export const Solution: React.FC = () => {
  const benefits = [
    {
      icon: <FaBolt className="text-3xl" />,
      title: 'Automated Execution',
      description: 'Smart contracts execute your strategy 24/7. No manual intervention needed.',
    },
    {
      icon: <FaRobot className="text-3xl" />,
      title: 'AI-Driven Intelligence',
      description: 'On-chain AI analyzes market conditions and optimizes entry points.',
    },
    {
      icon: <FaLock className="text-3xl" />,
      title: 'Forced Discipline',
      description: 'Optional vault locking prevents emotional panic selling.',
    },
    {
      icon: <FaShieldAlt className="text-3xl" />,
      title: 'Non-Custodial',
      description: 'Your keys, your crypto. Transparent and verifiable on-chain.',
    },
  ];

  return (
    <Section className="bg-gradient-to-b from-gray-950 to-black py-24 md:py-32">
      <AnimatedSection direction="fade">
        <div className="text-center mb-16 md:mb-20">
          <span className="text-xs md:text-sm text-green-400 uppercase tracking-widest mb-4 block font-semibold">
            The Solution
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Systematic Investing,
            <br />
            <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Fully Automated
            </span>
          </h2>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto">
            Remove emotion. Add discipline. Let AI and smart contracts handle execution.
          </p>
        </div>
      </AnimatedSection>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
        {benefits.map((benefit, index) => (
          <AnimatedSection key={index} direction="up" delay={index * 0.1}>
            <div className="relative group h-full">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
              <div className="relative flex items-start gap-4 md:gap-6 p-6 md:p-8 rounded-2xl bg-black border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 h-full">
                <div className="flex-shrink-0 text-green-400 group-hover:text-blue-400 transition-colors">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">{benefit.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </Section>
  );
};
