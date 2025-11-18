import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  id?: string;
}

export const Section: React.FC<SectionProps> = ({ 
  children, 
  className = '', 
  gradient = false,
  id 
}) => {
  const baseStyles = 'px-4 sm:px-6 lg:px-8';
  const backgroundStyles = gradient ? 'bg-gradient-hero animate-gradient' : '';
  
  return (
    <section id={id} className={`${baseStyles} ${backgroundStyles} ${className}`}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </section>
  );
};
