
import React from 'react';

const PixelArtHero: React.FC = () => {
  // A simple 16x16 pixel cat face representated as a 1D array of 0 (white) and 1 (black)
  const catPixels = [
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,
    0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,0,
    0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,
    0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,
    0,1,1,0,0,1,1,1,1,1,1,0,0,1,1,0,
    0,1,1,0,0,1,1,1,1,1,1,0,0,1,1,0,
    0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,
    0,1,1,1,1,0,0,1,1,0,0,1,1,1,1,0,
    0,1,1,1,1,0,0,1,1,0,0,1,1,1,1,0,
    0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,
    0,0,1,1,1,1,1,0,0,1,1,1,1,1,0,0,
    0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,
    0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,
    0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  ];

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white pixel-border-sm pixel-bounce">
      <div className="grid grid-cols-16 gap-0 w-32 h-32" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
        {catPixels.map((p, i) => (
          <div 
            key={i} 
            className={`w-full h-full ${p === 1 ? 'bg-black' : 'bg-transparent'}`} 
          />
        ))}
      </div>
      <div className="mt-4 text-black text-xs">STATUS: PURRING...</div>
    </div>
  );
};

export default PixelArtHero;
