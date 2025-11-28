import React from 'react';
import { Section } from './Section';
import { AnimatedSection } from './AnimatedSection';
import { FaQuoteLeft } from 'react-icons/fa';

export const SocialProof: React.FC = () => {
  const stats = [
    { value: '10+', label: 'Supported Tokens' },
    { value: 'Beta', label: 'Testing Phase' },
    { value: 'AI', label: 'Powered Trading' },
    { value: 'Web3', label: 'Non-Custodial' },
  ];

  const testimonials = [
    {
      name: 'Smart Trading',
      role: 'AI-Powered',
      content: 'Advanced AI analytics help you make informed trading decisions with real-time market insights.',
      avatar: '🤖',
    },
    {
      name: 'Secure & Safe',
      role: 'Non-Custodial',
      content: 'Your keys, your crypto. All transactions are on-chain and verifiable on Base Sepolia testnet.',
      avatar: '🔐',
    },
    {
      name: 'Easy to Use',
      role: 'User-Friendly',
      content: 'Simple interface with chat-based trading. Connect wallet and start trading in seconds.',
      avatar: '✨',
    },
  ];

  return (
    <Section className="bg-gradient-to-b from-black to-gray-900">
      {/* Stats */}
      <AnimatedSection direction="fade">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* Testimonials */}
      <AnimatedSection direction="fade">
        <div className="text-center mb-16">
          <span className="text-sm text-white/50 uppercase tracking-wider mb-4 block">Platform Highlights</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">GweAI</span>
          </h2>
        </div>
      </AnimatedSection>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((testimonial, index) => (
          <AnimatedSection key={index} direction="up" delay={index * 0.15}>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all h-full">
              <FaQuoteLeft className="text-2xl text-blue-400/50 mb-4" />
              <p className="text-white/80 mb-6 leading-relaxed text-sm italic">
                "{testimonial.content}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-white/50 text-xs">{testimonial.role}</div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </Section>
  );
};
