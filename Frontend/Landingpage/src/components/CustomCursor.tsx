import React, { useEffect, useRef, useState } from 'react';

interface CustomCursorProps {
  theme?: 'landing' | 'app';
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ theme = 'app' }) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true); // Start visible
  const [isClicked, setIsClicked] = useState(false);
  const [isDynamicOpen, setIsDynamicOpen] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const oldPosRef = useRef({ x: 0, y: 0 });
  const prevAngleRef = useRef(0);
  
  // Unique IDs for gradients to avoid conflicts
  const gradientId = `cursorGradient-${theme}`;
  const lightningId = `lightningGradient-${theme}`;
  const glowId = `cursorGlow-${theme}`;

  // Theme colors
  const themeColors = {
    landing: {
      gradient: ['#8B5CF6', '#3B82F6', '#1E40AF'], // Purple to Blue
      lightning: ['#8B5CF6', '#6366F1', '#3B82F6'], // Purple lightning
      glow: '#8B5CF6'
    },
    app: {
      gradient: ['#10b981', '#3b82f6', '#8b5cf6'], // Emerald to Purple
      lightning: ['#7C3AED', '#2DD4BF', '#10B981'], // Purple-Teal-Emerald
      glow: '#3b82f6'
    }
  };

  const colors = themeColors[theme];

  useEffect(() => {
    console.log('🎨 CustomCursor mounted, theme:', theme);
    
    // Monitor for Dynamic modal open/close
    const checkDynamicModal = () => {
      const hasDynamicModal = document.querySelector('[role="dialog"]') !== null ||
                             document.querySelector('[data-dynamic-modal]') !== null ||
                             document.querySelector('[class*="dynamic"]') !== null ||
                             document.querySelector('iframe[src*="dynamic"]') !== null;
      
      const wasOpen = isDynamicOpen;
      setIsDynamicOpen(hasDynamicModal);
      
      // If modal just closed, force cursor to reappear
      if (wasOpen && !hasDynamicModal) {
        console.log('🎯 Dynamic modal closed - restoring cursor');
        setTimeout(() => {
          setIsVisible(true);
          if (cursorRef.current) {
            cursorRef.current.style.opacity = '1';
            cursorRef.current.style.display = 'block';
          }
        }, 100);
      }
      
      return hasDynamicModal;
    };

    // Initial check
    checkDynamicModal();
    
    // Show cursor immediately on mount and set initial position to center of screen
    setIsVisible(true);
    const initialX = window.innerWidth / 2;
    const initialY = window.innerHeight / 2;
    mouseRef.current = { x: initialX, y: initialY };
    oldPosRef.current = { x: initialX, y: initialY };
    
    if (cursorRef.current) {
      cursorRef.current.style.left = `${initialX}px`;
      cursorRef.current.style.top = `${initialY}px`;
      cursorRef.current.style.transform = 'translate(-50%, -50%) rotate(0deg)';
    }

    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      checkDynamicModal();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'role']
    });

    // Check if mouse is over Dynamic modal/widget
    const isOverDynamicElement = (element: Element | null): boolean => {
      if (!element) return false;
      
      // Check if element or any parent is Dynamic-related
      let current: Element | null = element;
      while (current) {
        const id = current.id || '';
        const className = typeof current.className === 'string' ? current.className : '';
        const role = current.getAttribute('role') || '';
        
        // Check for Dynamic SDK elements
        if (
          id.toLowerCase().includes('dynamic') ||
          className.toLowerCase().includes('dynamic') ||
          role === 'dialog' ||
          current.tagName === 'IFRAME' ||
          current.getAttribute('data-dynamic-modal') !== null
        ) {
          return true;
        }
        
        current = current.parentElement;
      }
      return false;
    };

    // No need for custom cursor style injection - handled by index.css globally
    const calculateAngle = (
      prevPos: { x: number; y: number },
      newPos: { x: number; y: number }
    ): number => {
      const radians = Math.atan2(
        newPos.x - prevPos.x,
        -(newPos.y - prevPos.y)
      );
      const degree = radians * (180 / Math.PI);
      
      if (newPos.x - prevPos.x === 0 || newPos.y - prevPos.y === 0) {
        return prevAngleRef.current;
      }
      
      return degree;
    };

    const updateCursor = (newPos: { x: number; y: number }, angle: number) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${newPos.x}px`;
        cursorRef.current.style.top = `${newPos.y}px`;
        cursorRef.current.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        
        // Debug log (remove after testing)
        if (Math.random() < 0.01) { // Log 1% of the time to avoid spam
          console.log('🎯 Cursor position:', newPos, 'visible:', isVisible);
        }
      }
    };

    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      // Check if mouse is over Dynamic element
      const target = e.target as Element;
      const overDynamic = isOverDynamicElement(target);
      
      // Hide custom cursor when over Dynamic elements
      if (overDynamic) {
        setIsVisible(false);
        document.body.style.cursor = 'auto';
        return;
      } else {
        // Show custom cursor
        if (!isVisible) {
          setIsVisible(true);
        }
        document.body.style.cursor = 'none';
      }
      
      // Use clientX/clientY for fixed positioning (viewport coordinates)
      mouseRef.current = { x: e.clientX, y: e.clientY };
      
      // Throttle with RAF for 60fps max
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          const degreesToRotate = calculateAngle(oldPosRef.current, mouseRef.current);
          prevAngleRef.current = degreesToRotate;
          
          updateCursor(mouseRef.current, degreesToRotate);
          oldPosRef.current = { x: mouseRef.current.x, y: mouseRef.current.y };
          rafId = null;
        });
      }
    };

    const handleMouseDown = () => {
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 300);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };
    
    // Force restore cursor visibility on any click (helps after modal close)
    const handleClick = () => {
      if (!isDynamicOpen) {
        setTimeout(() => {
          setIsVisible(true);
          if (cursorRef.current) {
            cursorRef.current.style.opacity = '1';
            cursorRef.current.style.display = 'block';
          }
          document.body.style.cursor = 'none';
        }, 50);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      // Cancel any pending RAF
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      // Disconnect observer
      observer.disconnect();
      
      // Restore default cursor
      document.body.style.cursor = '';
      document.documentElement.style.cursor = '';
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('click', handleClick);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible, isDynamicOpen]);

  // Effect to handle Dynamic modal state
  useEffect(() => {
    if (isDynamicOpen) {
      // Dynamic modal is open - restore cursor for modal
      document.body.style.cursor = 'auto';
      document.documentElement.style.cursor = 'auto';
    } else {
      // Dynamic modal is closed - use custom cursor
      document.body.style.cursor = 'none';
      document.documentElement.style.cursor = 'none';
    }
  }, [isDynamicOpen]);

  // Don't render custom cursor when Dynamic modal is open
  if (isDynamicOpen) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      className="cursor-wrapper"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '40px',
        height: '40px',
        pointerEvents: 'none',
        zIndex: 999999,
        opacity: isVisible ? 1 : 0,
        display: isVisible ? 'block' : 'none',
        willChange: 'transform',
        transition: 'opacity 0.2s',
      }}
    >
      {/* Click effect - Lightning rings */}
      {isClicked && (
        <>
          <div className="absolute inset-0 animate-ping">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke={`url(#${lightningId})`}
                strokeWidth="3"
                fill="none"
                opacity="0.8"
              />
            </svg>
          </div>
          <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.05s' }}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="20"
                cy="20"
                r="15"
                stroke={`url(#${lightningId})`}
                strokeWidth="2"
                fill="none"
                opacity="0.6"
              />
            </svg>
          </div>
        </>
      )}

      {/* Cursor design - Arrow/Pointer shape */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-transform duration-150 ${isClicked ? 'scale-90' : 'scale-100'}`}
        style={{ opacity: 1, display: 'block' }}
      >
        {/* Visible outer circle for debugging */}
        <circle
          cx="20"
          cy="20"
          r="19"
          stroke="#8B5CF6"
          strokeWidth="2"
          fill="none"
          opacity="0.8"
        />
        
        {/* Outer glow - more visible */}
        <circle
          cx="20"
          cy="20"
          r="18"
          fill={`url(#${glowId})`}
          opacity={isClicked ? "0.9" : "0.7"}
          className="transition-opacity duration-150"
        />
        
        {/* Click lightning effect */}
        {isClicked && (
          <>
            <circle
              cx="20"
              cy="20"
              r="15"
              stroke={`url(#${lightningId})`}
              strokeWidth="2"
              fill="none"
              opacity="0.9"
            />
            <circle
              cx="20"
              cy="20"
              r="12"
              stroke={`url(#${lightningId})`}
              strokeWidth="1.5"
              fill="none"
              opacity="0.7"
            />
          </>
        )}
        
        {/* Main cursor shape - arrow pointer with thicker stroke */}
        <path
          d="M20 5 L20 35 M20 5 L15 12 M20 5 L25 12"
          stroke="#8B5CF6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="1"
        />
        
        {/* Center dot - bigger and more visible with solid color */}
        <circle
          cx="20"
          cy="20"
          r={isClicked ? "6" : "5"}
          fill="#8B5CF6"
          className="transition-all duration-150"
          opacity="1"
        />
        
        {/* Gradient definitions with unique IDs */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.gradient[0]} />
            <stop offset="50%" stopColor={colors.gradient[1]} />
            <stop offset="100%" stopColor={colors.gradient[2]} />
          </linearGradient>
          <linearGradient id={lightningId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.lightning[0]} />
            <stop offset="50%" stopColor={colors.lightning[1]} />
            <stop offset="100%" stopColor={colors.lightning[2]} />
          </linearGradient>
          <radialGradient id={glowId}>
            <stop offset="0%" stopColor={colors.glow} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colors.gradient[2]} stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};
