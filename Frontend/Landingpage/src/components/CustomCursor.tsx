import React, { useEffect, useRef, useState } from 'react';

interface CustomCursorProps {
  theme?: 'landing' | 'app';
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ theme = 'app' }) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isDynamicOpen, setIsDynamicOpen] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const oldPosRef = useRef({ x: 0, y: 0 });
  const prevAngleRef = useRef(0);

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
    // Monitor for Dynamic modal open/close
    const checkDynamicModal = () => {
      const hasDynamicModal = document.querySelector('[role="dialog"]') !== null ||
                             document.querySelector('[data-dynamic-modal]') !== null ||
                             document.querySelector('[class*="dynamic-widget"]') !== null ||
                             document.querySelector('iframe[src*="dynamic"]') !== null;
      setIsDynamicOpen(hasDynamicModal);
      return hasDynamicModal;
    };

    // Initial check
    checkDynamicModal();

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

    // Hide default cursor only on non-Dynamic elements
    const style = document.createElement('style');
    style.id = 'custom-cursor-style';
    style.innerHTML = `
      /* Hide cursor by default */
      html, body {
        cursor: none !important;
      }
      
      /* Hide cursor on all elements EXCEPT Dynamic */
      *:not([class*="dynamic"]):not([id*="dynamic"]):not([role="dialog"]):not(iframe) {
        cursor: none !important;
      }
      
      /* FORCE show cursor on Dynamic elements - HIGHEST PRIORITY */
      [class*="dynamic"],
      [class*="dynamic"] *,
      [id*="dynamic"],
      [id*="dynamic"] *,
      [role="dialog"],
      [role="dialog"] *,
      iframe,
      iframe *,
      [data-dynamic-modal],
      [data-dynamic-modal] *,
      div[class*="Dynamic"],
      div[id*="Dynamic"] {
        cursor: auto !important;
      }
      
      /* Interactive elements in Dynamic */
      [class*="dynamic"] button,
      [class*="dynamic"] a,
      [id*="dynamic"] button,
      [id*="dynamic"] a,
      [role="dialog"] button,
      [role="dialog"] a,
      [data-dynamic-modal] button,
      [data-dynamic-modal] a {
        cursor: pointer !important;
      }
      
      [class*="dynamic"] input,
      [class*="dynamic"] textarea,
      [id*="dynamic"] input,
      [id*="dynamic"] textarea,
      [role="dialog"] input,
      [role="dialog"] textarea,
      [data-dynamic-modal] input,
      [data-dynamic-modal] textarea {
        cursor: text !important;
      }
    `;
    // Remove existing style if present
    const existingStyle = document.getElementById('custom-cursor-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    document.head.appendChild(style);

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
        // Also restore body cursor temporarily
        document.body.style.cursor = 'auto';
        return;
      } else {
        // Hide body cursor when not over Dynamic
        document.body.style.cursor = 'none';
      }
      
      // Use clientX/clientY for fixed positioning (viewport coordinates)
      mouseRef.current = { x: e.clientX, y: e.clientY };
      
      // Show cursor on first move
      if (!isVisible) {
        setIsVisible(true);
      }
      
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

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      // Cancel any pending RAF
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      // Disconnect observer
      observer.disconnect();
      
      // Remove custom cursor style
      const existingStyle = document.getElementById('custom-cursor-style');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // Restore default cursor
      document.body.style.cursor = '';
      document.documentElement.style.cursor = '';
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  // Effect to handle Dynamic modal state
  useEffect(() => {
    if (isDynamicOpen) {
      // Dynamic modal is open - restore all cursors
      document.body.style.cursor = 'auto';
      document.documentElement.style.cursor = 'auto';
      
      // Temporarily disable custom cursor styles
      const style = document.getElementById('custom-cursor-style');
      if (style) {
        style.remove();
      }
    } else {
      // Dynamic modal is closed - reapply custom cursor
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
      className={`cursor fixed pointer-events-none z-[9999] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        width: '40px',
        height: '40px',
        willChange: 'transform',
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
                stroke="url(#lightningGradient)"
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
                stroke="url(#lightningGradient)"
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
      >
        {/* Outer glow */}
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="url(#cursorGlow)"
          opacity={isClicked ? "0.8" : "0.3"}
          className="transition-opacity duration-150"
        />
        
        {/* Click lightning effect */}
        {isClicked && (
          <>
            <circle
              cx="20"
              cy="20"
              r="15"
              stroke="url(#lightningGradient)"
              strokeWidth="2"
              fill="none"
              opacity="0.9"
            />
            <circle
              cx="20"
              cy="20"
              r="12"
              stroke="url(#lightningGradient)"
              strokeWidth="1.5"
              fill="none"
              opacity="0.7"
            />
          </>
        )}
        
        {/* Main cursor shape - arrow pointer */}
        <path
          d="M20 5 L20 35 M20 5 L15 12 M20 5 L25 12"
          stroke="url(#cursorGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Center dot */}
        <circle
          cx="20"
          cy="20"
          r={isClicked ? "4" : "3"}
          fill="url(#cursorGradient)"
          className="transition-all duration-150"
        />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="cursorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.gradient[0]} />
            <stop offset="50%" stopColor={colors.gradient[1]} />
            <stop offset="100%" stopColor={colors.gradient[2]} />
          </linearGradient>
          <linearGradient id="lightningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.lightning[0]} />
            <stop offset="50%" stopColor={colors.lightning[1]} />
            <stop offset="100%" stopColor={colors.lightning[2]} />
          </linearGradient>
          <radialGradient id="cursorGlow">
            <stop offset="0%" stopColor={colors.glow} stopOpacity="0.6" />
            <stop offset="100%" stopColor={colors.gradient[2]} stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};
