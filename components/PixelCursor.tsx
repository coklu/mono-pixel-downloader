
import React, { useState, useEffect } from 'react';

const PixelCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      // Check if hovering over interactive elements
      const target = e.target as HTMLElement;
      const isClickable =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('cursor-pointer');

      setIsInteractive(!!isClickable);
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <div
      className="fixed pointer-events-none z-[100000] mix-blend-difference"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Outer Square Frame */}
      <div className="w-6 h-6 border-2 border-white relative flex items-center justify-center">
        {/* Filling Inner Square */}
        <div
          className={`
            bg-white transition-all duration-300 ease-in-out
            ${isInteractive ? 'w-full h-full opacity-100' : 'w-0 h-0 opacity-0'}
          `}
        />
      </div>
    </div>
  );
};

export default PixelCursor;
