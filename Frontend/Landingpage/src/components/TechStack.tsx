import React from 'react';
import { Section } from './Section';
import { AnimatedSection } from './AnimatedSection';

export const TechStack: React.FC = () => {
  const technologies = [
    {
      name: 'Base Sepolia',
      description: 'L2 blockchain for fast transactions',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Groq AI',
      description: 'Fast AI inference for trading signals',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Dynamic',
      description: 'Smart wallet integration',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      name: 'Viem',
      description: 'Type-safe blockchain interactions',
      gradient: 'from-pink-500 to-rose-600',
    },
  ];

  return (
    <Section id="tech-stack" className="bg-black">
      <AnimatedSection direction="fade">
        <div className="text-center mb-20">
          <span className="text-sm text-white/50 uppercase tracking-wider mb-4 block">Technology</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Built on <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Best-in-Class</span> Infrastructure
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto mt-4">
            Leveraging cutting-edge Web3 protocols for security, automation, and intelligence
          </p>
        </div>
      </AnimatedSection>

      <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {technologies.map((tech, index) => (
          <AnimatedSection key={index} direction="up" delay={index * 0.1}>
            <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group h-full">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${tech.gradient} flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform`}>
                {tech.name[0]}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">
                {tech.name}
              </h3>
              
              <p className="text-sm text-white/60">
                {tech.description}
              </p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </Section>
  );
};
