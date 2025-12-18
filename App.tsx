import React, { useState, useEffect } from 'react';
import { View } from './types';
import { PIXEL_ICONS } from './constants';
import PixelFrame from './components/PixelFrame.tsx';
import PixelButton from './components/PixelButton.tsx';
import PixelArtHero from './components/PixelArtHero.tsx';
import PixelCursor from './components/PixelCursor.tsx';
import DownloaderSection from './components/DownloaderSection.tsx';
import { sounds } from './utils/audio';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [booting, setBooting] = useState(true);
  const [readyToLaunch, setReadyToLaunch] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReadyToLaunch(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleBoot = () => {
    sounds.init();
    sounds.click();
    setBooting(false);
  };

  if (booting) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <PixelCursor />
        <div className="text-2xl mb-4 tracking-tighter italic font-bold">MONO_PIXEL_BOOT</div>
        <div className="w-64 h-8 border-4 border-white p-1 mb-8">
          <div className={`h-full bg-white ${!readyToLaunch ? 'animate-[loading_2s_steps(8)]' : 'w-full'}`}></div>
        </div>

        {readyToLaunch ? (
          <button
            onClick={handleBoot}
            onMouseEnter={() => sounds.hover()}
            className="px-8 py-4 bg-white text-black font-bold uppercase tracking-[0.3em] hover:invert transition-all pixel-border-white"
          >
            START_SYSTEM
          </button>
        ) : (
          <div className="text-[10px] opacity-50 uppercase tracking-[0.3em]">Synching with digital void...</div>
        )}

        <style>{`
          @keyframes loading {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case View.HOME:
        return <DownloaderSection />;
      case View.LOGS:
        return (
          <div className="max-w-2xl mx-auto py-12">
            <PixelFrame variant="white" title="SYSTEM_LOGS.SYS" className="space-y-4 font-mono text-xs">
              <p className="text-black/40">[{new Date().toISOString()}] INITIALIZING...</p>
              <p>{">> PROTOCOL: HTTPS_DOWN_V3"}</p>
              <p>{">> STATUS: STANDBY_MODE"}</p>
              <p>{">> MEMORY: 640KB (SUFFICIENT)"}</p>
              <p className="font-bold underline">{">> ALL SYSTEMS NOMINAL"}</p>
            </PixelFrame>
          </div>
        );
      case View.ABOUT:
        return (
          <div className="max-w-4xl mx-auto py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold uppercase italic border-b-4 border-white pb-2">Philosophy</h2>
              <p className="text-sm opacity-80 leading-relaxed uppercase tracking-tight">
                In a world of excessive noise and color, Mono_Pixel returns to the root of binary logic. One or Zero. Black or White.
              </p>
              <p className="text-sm opacity-80 leading-relaxed uppercase tracking-tight">
                Our tools are crafted with precision, removing all distractions to leave only the function and the pixel.
              </p>
              <PixelButton onClick={() => setCurrentView(View.HOME)}>RETURN_TO_BASE</PixelButton>
            </div>
            <div className="flex justify-center items-center">
              <PixelArtHero />
            </div>
          </div>
        );
      default:
        return <DownloaderSection />;
    }
  };

  const handleNavClick = (view: View) => {
    sounds.click();
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white selection:text-black">
      <PixelCursor />

      {/* Header / Nav */}
      <nav className="sticky top-0 z-50 bg-black border-b-4 border-white px-6 py-6 flex justify-between items-center">
        <div
          className="text-2xl font-bold cursor-pointer italic hover:bg-white hover:text-black transition-colors px-2"
          onClick={() => handleNavClick(View.HOME)}
          onMouseEnter={() => sounds.hover()}
        >
          MONO_PIXEL
        </div>

        <div className="hidden md:flex gap-8">
          {[
            { id: View.HOME, label: 'DOWNLOADER' },
            { id: View.LOGS, label: 'TERMINAL' },
            { id: View.ABOUT, label: 'MANIFESTO' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              onMouseEnter={() => sounds.hover()}
              className={`
                uppercase text-[10px] tracking-[0.4em] transition-all
                ${currentView === item.id ? 'bg-white text-black px-2 py-1' : 'hover:opacity-100 opacity-40'}
              `}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col text-[8px] items-end leading-none opacity-40">
            <span>AUDIO: ENABLED</span>
            <span>BITRATE: 8-BIT</span>
          </div>
          <div className="w-10 h-10 border-2 border-white flex items-center justify-center animate-pulse">
            {PIXEL_ICONS.SMILE}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-white p-8 mt-12">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-start gap-8 opacity-40">
          <div className="max-w-xs space-y-2">
            <div className="text-sm font-bold tracking-widest italic">MONO_PIXEL_CORE</div>
            <div className="text-[10px] uppercase leading-tight">Crafting minimalist digital tools for the minimalist human. Developed in the void.</div>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[10px] uppercase tracking-widest font-bold">
            <a href="#" onMouseEnter={() => sounds.hover()} className="hover:line-through">GitHub</a>
            <a href="#" onMouseEnter={() => sounds.hover()} className="hover:line-through">Signal</a>
            <a href="#" onMouseEnter={() => sounds.hover()} className="hover:line-through">Void_Mail</a>
            <a href="#" onMouseEnter={() => sounds.hover()} className="hover:line-through">Archive</a>
          </div>
          <div className="text-[10px] uppercase text-right">
            System_Time: {new Date().getHours()}:{new Date().getMinutes()} // GMT+0<br />
            © 198X-202X
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
