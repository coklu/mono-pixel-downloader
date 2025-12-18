
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { sounds } from '../utils/audio';

interface CRTTerminalProps {
    onClose: () => void;
}

const MANIFESTO_LINES = [
    { text: "INITIALIZING_BOOT_SEQUENCE...", pause: 400 },
    { text: "LOADING_KERNEL... [OK]", pause: 400 },
    { text: "BYPASSING_SECURITY_NODES... [SUCCESS]", pause: 800 },
    { text: "", pause: 500 },
    { text: "> INFORMATION SHOULD BE FREE.", pause: 600, typing: true },
    { text: "> THE DIGITAL REALM KNOWS NO BORDERS.", pause: 600, typing: true },
    { text: "> WE ARE THE ARCHIVISTS.", pause: 600, typing: true },
    { text: "> COPYING IS NOT THEFT. IT IS PRESERVATION.", pause: 800, typing: true },
    { text: "", pause: 500 },
    { text: "--- ACCESS GRANTED ---", pause: 500 },
];

const LINKS = [
    { label: "EFF_FOUNDATION", url: "https://www.eff.org" },
    { label: "INTERNET_ARCHIVE", url: "https://archive.org" },
    { label: "FREE_SOFTWARE_FOUNDATION", url: "https://www.fsf.org" },
    { label: "TOR_PROJECT", url: "https://torproject.org" },
];

const CRTTerminal: React.FC<CRTTerminalProps> = ({ onClose }) => {
    const [lines, setLines] = useState<string[]>([]);
    const [showLinks, setShowLinks] = useState(false);
    const [powerOn, setPowerOn] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let active = true; // Local cancellation flag

        // Play Click Sound for Power On trigger
        sounds.click();

        // Trigger animation state
        const powerTimer = setTimeout(() => {
            if (active) setPowerOn(true);
            // Play Boot/Hum sound if available or reuse click/type for mechanical feel
            setTimeout(() => { if (active) sounds.type(); }, 200);
        }, 100);

        const runSequence = async () => {
            // Wait initial boot
            await new Promise(r => setTimeout(r, 1000));

            for (const lineData of MANIFESTO_LINES) {
                if (!active) return;

                const { text, pause, typing } = lineData;

                // Add new empty line
                setLines(prev => [...prev, ""]);

                if (typing) {
                    // Type character by character
                    const chars = text.split("");
                    let currentLine = "";

                    for (const char of chars) {
                        if (!active) return;

                        currentLine += char;

                        // Update the last line
                        setLines(prev => {
                            const newLines = [...prev];
                            newLines[newLines.length - 1] = currentLine;
                            return newLines;
                        });

                        // Play sound
                        if (char !== " ") {
                            sounds.keyboard();
                        }

                        // Scroll to bottom
                        if (containerRef.current) {
                            containerRef.current.scrollTop = containerRef.current.scrollHeight;
                        }

                        // Random typing delay
                        await new Promise(r => setTimeout(r, 30 + Math.random() * 40));
                    }
                } else {
                    // Instant line appearances (System messages)
                    if (!active) return;

                    setLines(prev => {
                        const newLines = [...prev];
                        newLines[newLines.length - 1] = text;
                        return newLines;
                    });
                    if (text.trim()) sounds.type();

                    if (containerRef.current) {
                        containerRef.current.scrollTop = containerRef.current.scrollHeight;
                    }
                }

                // Pause between lines
                if (pause) await new Promise(r => setTimeout(r, pause));
            }

            if (active) setShowLinks(true);
        };

        runSequence();

        return () => {
            active = false;
            clearTimeout(powerTimer);
        };
    }, []);

    const terminalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black overflow-hidden pointer-events-auto w-full h-full left-0 top-0">
            <style>{`
        @keyframes turnOn {
          0% { transform: scale(0.001, 0.01); opacity: 1; filter: brightness(30); }
          20% { transform: scale(1, 0.01); opacity: 1; filter: brightness(10); }
          50% { transform: scale(1, 0.01); opacity: 1; filter: brightness(5); }
          60% { transform: scale(1, 1); opacity: 1; filter: brightness(1.5); }
          100% { transform: scale(1, 1); opacity: 1; filter: brightness(1); }
        }
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .crt-container {
          animation: turnOn 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
          background-color: #000;
          position: relative;
        }
        .pixel-border {
          box-shadow: 
            -4px 0 0 0 white,
            4px 0 0 0 white,
            0 -4px 0 0 white,
            0 4px 0 0 white;
          margin: 4px;
        }
      `}</style>

            {/* Container */}
            {powerOn && (
                <div className="crt-container w-full max-w-4xl aspect-[4/3] pixel-border overflow-hidden">

                    {/* Content Layer */}
                    <div
                        ref={containerRef}
                        className="absolute inset-0 p-8 md:p-12 overflow-y-auto font-mono text-white text-lg md:text-xl leading-relaxed z-10 scrollbar-hide"
                        style={{
                            fontFamily: '"Courier New", Courier, monospace',
                            imageRendering: 'pixelated'
                        }}
                    >
                        {/* White flash overlay */}
                        <div className="absolute inset-0 bg-white animate-[fadeOut_0.5s_ease-out_forwards] pointer-events-none mix-blend-hard-light" />

                        {lines.map((line, i) => (
                            <div key={i} className="mb-2 whitespace-pre-wrap">
                                {line}
                            </div>
                        ))}

                        {showLinks && (
                            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-1000">
                                {LINKS.map((link, i) => (
                                    <a
                                        key={i}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 group cursor-pointer hover:bg-white hover:text-black p-1 transition-colors"
                                    >
                                        <span className="font-bold">{'>'}</span>
                                        <span className="uppercase tracking-wider underline decoration-2 underline-offset-4">
                                            {link.label}
                                        </span>
                                    </a>
                                ))}

                                <div className="col-span-1 md:col-span-2 mt-12 text-center">
                                    <button
                                        onClick={() => { sounds.click(); onClose(); }}
                                        className="text-white hover:bg-white hover:text-black px-8 py-3 border-2 border-white uppercase tracking-[0.2em] text-sm font-bold transition-all"
                                    >
                                        [ DISCONNECT ]
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className={`h-5 w-3 bg-white inline-block ml-1 align-middle ${showLinks ? 'animate-pulse' : ''}`} />
                    </div>

                    {/* 1-Bit Style Scanlines */}
                    <div className="absolute inset-0 pointer-events-none z-20"
                        style={{
                            background: 'linear-gradient(rgba(0,0,0,0) 60%, rgba(0,0,0,1) 60%)',
                            backgroundSize: '100% 3px'
                        }}
                    />

                    {/* Vignette */}
                    <div className="absolute inset-0 pointer-events-none z-30"
                        style={{
                            background: 'radial-gradient(circle, transparent 55%, black 140%)'
                        }}
                    />
                </div>
            )}
        </div>
    );

    return createPortal(terminalContent, document.body);
};

export default CRTTerminal;
