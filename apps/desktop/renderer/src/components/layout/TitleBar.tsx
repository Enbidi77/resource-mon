import React, { useEffect, useState } from 'react';
import { Shield, Search, Minus, Square, Copy, X, Terminal, Cpu } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const TitleBar: React.FC = () => {
  const { overview, setIsCommandPaletteOpen } = useAppStore();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.sentinelAPI) {
      window.sentinelAPI.isWindowMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => window.sentinelAPI?.minimizeWindow();
  const handleMaximize = async () => {
    const max = await window.sentinelAPI?.maximizeWindow();
    setIsMaximized(max);
  };
  const handleClose = () => window.sentinelAPI?.closeWindow();

  return (
    <header className="titlebar-drag-region h-11 w-full bg-[#0a0d14]/90 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between px-3 z-50 select-none">
      {/* Left: Branding & Hostname */}
      <div className="flex items-center gap-3 no-drag">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide text-white font-mono">
            SENTINEL<span className="text-cyan-400">.DESKTOP</span>
          </span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* Machine Name Badge */}
        <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-white/5 text-xs text-slate-300">
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span className="font-mono">{overview?.hostname || 'LOCAL-NODE'}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{overview?.osName?.split(' ')[0] || 'Windows'}</span>
        </div>

        {/* Privilege Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${
            overview?.isElevated
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-700/40 text-slate-400 border border-white/5'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${overview?.isElevated ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
          {overview?.isElevated ? 'ELEVATED (ADMIN)' : 'USER'}
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <button
        onClick={() => setIsCommandPaletteOpen(true)}
        className="no-drag flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs text-slate-400 transition-colors w-64 justify-between"
      >
        <span className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search processes, ports, alerts...</span>
        </span>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-white/10">
          Ctrl K
        </kbd>
      </button>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={handleMinimize}
          className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Minimize"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Copy className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/80 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

