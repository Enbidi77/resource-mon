import React, { useEffect, useState } from 'react';
import { Shield, Search, Minus, Square, Copy, X, Cpu, Sun, Moon } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { GlassBadge, GlassButton } from '../glass';

export const TitleBar: React.FC = () => {
  const { overview, setIsCommandPaletteOpen, theme, toggleTheme } = useAppStore();
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
    <header className="titlebar-drag-region h-12 w-full bg-[var(--glass-surface)] backdrop-blur-2xl backdrop-saturate-180 border-b border-[var(--glass-border)] flex items-center justify-between px-3.5 z-50 select-none shadow-[var(--glass-specular)]">
      {/* Left: Branding & Host Info */}
      <div className="flex items-center gap-3 no-drag">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-white/20">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-xs tracking-wider text-[var(--text-primary)] font-mono">
            SENTINEL<span className="text-cyan-400">.DESKTOP</span>
          </span>
        </div>

        <div className="h-4 w-px bg-[var(--glass-border)]" />

        {/* Machine Name Badge */}
        <GlassBadge variant="default" size="sm" className="hidden sm:inline-flex items-center gap-1.5 font-mono">
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span>{overview?.hostname || 'LOCAL-NODE'}</span>
          <span className="text-[var(--text-tertiary)]">•</span>
          <span className="text-[var(--text-secondary)]">{overview?.osName?.split(' ')[0] || 'Windows'}</span>
        </GlassBadge>

        {/* Privilege Indicator */}
        <GlassBadge
          variant={overview?.isElevated ? 'success' : 'default'}
          size="sm"
          dot
          pulsing={Boolean(overview?.isElevated)}
        >
          {overview?.isElevated ? 'ELEVATED' : 'USER'}
        </GlassBadge>
      </div>

      {/* Center: Search / Command Palette Floating Pill */}
      <button
        onClick={() => setIsCommandPaletteOpen(true)}
        className="no-drag flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[var(--glass-surface-subtle)] hover:bg-[var(--glass-surface-elevated)] border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 w-64 md:w-80 justify-between shadow-sm shadow-[var(--glass-specular)] cursor-pointer group"
      >
        <span className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-cyan-400 transition-colors" />
          <span className="truncate">Search commands, processes, ports...</span>
        </span>
        <kbd className="px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-[10px] font-mono border border-[var(--glass-border-subtle)] text-[var(--text-secondary)]">
          Ctrl K
        </kbd>
      </button>

      {/* Right: Theme Toggle & Window Controls */}
      <div className="flex items-center gap-2 no-drag">
        {/* Light / Dark Mode Liquid Glass Toggle */}
        <button
          onClick={toggleTheme}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-surface-elevated)] border border-transparent hover:border-[var(--glass-border)] transition-all cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light Frosted' : 'Dark Liquid'} Glass`}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
        </button>

        <div className="h-4 w-px bg-[var(--glass-border)]" />

        {/* Window Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors cursor-pointer"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-red-500/80 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
