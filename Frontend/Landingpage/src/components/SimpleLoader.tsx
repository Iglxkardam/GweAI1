import React from 'react';
import { motion } from 'framer-motion';

interface SimpleLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  fullScreen?: boolean;
}

export const SimpleLoader: React.FC<SimpleLoaderProps> = ({ 
  size = 'md', 
  color = '#a855f7',
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4'
  };

  const Spinner = (
    <motion.div
      className={`${sizeClasses[size]} rounded-full border-t-transparent`}
      style={{ borderColor: color }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
        {Spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {Spinner}
    </div>
  );
};

// Export for backward compatibility
export default SimpleLoader;
