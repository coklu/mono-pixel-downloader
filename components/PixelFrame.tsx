import React from 'react';

interface PixelFrameProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'black' | 'white';
    title?: string;
}

const PixelFrame: React.FC<PixelFrameProps> = ({ children, className = '', variant = 'black', title }) => {
    // 'black' variant means Black BG with White borders
    // 'white' variant means White BG with Black borders
    const bgClass = variant === 'black' ? 'bg-black text-white' : 'bg-white text-black';
    const borderClass = variant === 'black' ? 'pixel-border-white' : 'pixel-border-black';

    return (
        <div className={`relative ${bgClass} ${borderClass} p-6 ${className}`}>
            {title && (
                <div className={`absolute -top-4 left-4 px-2 py-1 text-[8px] uppercase tracking-widest font-bold ${variant === 'black' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                    {title}
                </div>
            )}
            {children}
        </div>
    );
};

export default PixelFrame;
