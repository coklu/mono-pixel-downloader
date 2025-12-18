import React from 'react';
import { sounds } from '../utils/audio';

interface PixelButtonProps {
    onClick?: () => void;
    children: React.ReactNode;
    active?: boolean;
    className?: string;
}

const PixelButton: React.FC<PixelButtonProps> = ({ onClick, children, active, className = '' }) => {
    const handleClick = () => {
        sounds.click();
        if (onClick) onClick();
    };

    return (
        <button
            onClick={handleClick}
            onMouseEnter={() => sounds.hover()}
            className={`
        relative px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold
        transition-all duration-75
        ${active ? 'bg-white text-black translate-x-1 translate-y-1' : 'bg-black text-white hover:bg-white hover:text-black border-2 border-white pixel-button-shadow-white'}
        ${className}
      `}
        >
            {children}
        </button>
    );
};

export default PixelButton;
