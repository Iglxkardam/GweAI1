import React from 'react';
import { Section } from './Section';
import { AnimatedSection } from './AnimatedSection';
import { FaFrown, FaSadCry, FaRedoAlt } from 'react-icons/fa';

export const Problem: React.FC = () => {
  const problems = [
    {
      icon: <FaFrown className="text-4xl" />,
      title: 'Emotional Trading',
      description: 'FOMO drives buying at peaks. Fear triggers panic selling at lows. Human psychology works against you.',
      stat: '78%',
      statLabel: 'lose money',
    },
    {
      icon: <FaSadCry className="text-4xl" />,
      title: 'Timing the Market',
      description: 'Even professionals struggle to predict short-term price movements consistently.',
      stat: '90%',
      statLabel: 'miss optimal entry',
    },
    {
      icon: <FaRedoAlt className="text-4xl" />,
      title: 'No Strategy',
      description: 'Random decisions and poor risk management lead to consistent losses.',
      stat: '95%',
      statLabel: 'quit within a year',
    },
  ];

  return (
    <Section className="bg-gradient-to-b from-black to-gray-950 py-24 md:py-32">
      <AnimatedSection direction="fade">
        <div className="text-center mb-16 md:mb-20">
          <span className="text-xs md:text-sm text-red-400 uppercase tracking-widest mb-4 block font-semibold">
            The Problem
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Why Most Traders
            <br />
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Lose Money
            </span>
          </h2>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto">
            Traditional trading is broken. Emotions and poor timing destroy capital.
          </p>
        </div>
      </AnimatedSection>

      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        {problems.map((problem, index) => (
          <AnimatedSection key={index} direction="up" delay={index * 0.1}>
            <div className="relative group h-full">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
              <div className="relative text-center p-6 md:p-8 rounded-2xl bg-black border border-red-500/20 h-full backdrop-blur-sm">
                <div className="mb-4 flex justify-center text-red-400">
                  {problem.icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">
                  {problem.title}
                </h3>
                <p className="text-white/60 leading-relaxed text-sm mb-4">
                  {problem.description}
                </p>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-2xl font-bold text-red-400">{problem.stat}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">{problem.statLabel}</div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </Section>
  );
};
