import React, { useState } from 'react';
import { Section } from './Section';
import { AnimatedSection } from './AnimatedSection';
import { Button } from './Button';
import { FaRocket, FaCheckCircle } from 'react-icons/fa';
import { ComingSoonModal } from './ComingSoonModal';

export const CTA: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
    setEmail('');
  };

  return (
    <Section className="bg-black relative overflow-hidden py-24 md:py-32">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <AnimatedSection direction="fade">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-sm text-blue-300 backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Limited Early Access Available
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
            Ready to Start
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Investing Smarter?
            </span>
          </h2>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl mb-10 text-white/70 max-w-2xl mx-auto">
            Join early adopters building wealth with AI-powered DCA strategies
          </p>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-10">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-6 py-4 rounded-xl text-white text-base bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm placeholder:text-white/40"
              />
              <Button 
                type="submit" 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 font-semibold px-8 whitespace-nowrap group"
              >
                <FaRocket className="mr-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                Get Started
              </Button>
            </div>
          </form>

          {/* Benefits list */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-400" />
              <span>3 months free for early users</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <ComingSoonModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </Section>
  );
};
