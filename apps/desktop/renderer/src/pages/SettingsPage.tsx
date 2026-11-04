import React, { useState } from 'react';
import { Settings, Shield, Sliders, Database, Sparkles, Sun, Moon, Info } from 'lucide-react';
import appIcon from '../../assets/icon.png';
import { useMetricsStore } from '../stores/useMetricsStore';
import { useAppStore, type AppTheme } from '../stores/useAppStore';
import {
  GlassBadge,
  GlassCard,
  GlassSegmentedControl,
  GlassSurface,
} from '../components/glass';

export const SettingsPage: React.FC = () => {
  const { intervalMs, setIntervalMs } = useMetricsStore();
  const { overview, addToast, theme, setTheme } = useAppStore();

  const [unsignedDetection, setUnsignedDetection] = useState(true);
  const [suspiciousPaths, setSuspiciousPaths] = useState(true);
  const [confirmDestructive, setConfirmDestructive] = useState(true);

  const handleSave = () => {
    addToast({ type: 'success', message: 'Preferences updated successfully' });
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    addToast({
      type: 'info',
      message: `Appearance updated to ${newTheme === 'dark' ? 'Liquid Glass (Dark)' : 'Frosted Glass (Light)'}`,
    });
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full select-none">
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Workstation Configuration & Apple Glass Settings
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Tune Liquid Glass appearance, high-frequency telemetry intervals, and defensive heuristic rules
        </p>
      </div>

      {/* Apple Glass Appearance Configuration */}
      <GlassCard className="p-5 space-y-4">
        <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--glass-border-subtle)] pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Apple Glass Material Appearance</span>
          </div>
          <GlassBadge variant="cyan" size="sm">
            Adaptive Liquid Glass
          </GlassBadge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dark Liquid Glass Card */}
          <div
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              theme === 'dark'
                ? 'bg-slate-900/80 border-cyan-400/50 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-400/30'
                : 'bg-slate-900/40 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-white font-mono">Dark Liquid Glass</span>
              </div>
              {theme === 'dark' && (
                <GlassBadge variant="cyan" size="sm" dot>
                  Active
                </GlassBadge>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Dark translucent surfaces, luminous specular borders, deep ambient shadow, and controlled highlight refraction.
            </p>
          </div>

          {/* Light Frosted Glass Card */}
          <div
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              theme === 'light'
                ? 'bg-white/80 border-cyan-500/50 shadow-lg shadow-cyan-500/15 ring-2 ring-cyan-500/30 text-slate-900'
                : 'bg-white/10 border-white/10 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-sm font-mono text-[var(--text-primary)]">Light Frosted Glass</span>
              </div>
              {theme === 'light' && (
                <GlassBadge variant="cyan" size="sm" dot>
                  Active
                </GlassBadge>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
              Frosted white surfaces, crisp reflections, soft highlights, bright clean backgrounds, and readable contrast.
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-12 gap-6">
        {/* Monitoring & Telemetry Settings */}
        <GlassCard className="col-span-12 lg:col-span-6 p-5 space-y-4">
          <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--glass-border-subtle)] pb-2 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Telemetry Sampling Rates</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-[var(--text-secondary)] block mb-2">Fast Metrics Interval (CPU, Memory, Bandwidth)</label>
              <GlassSegmentedControl
                options={[
                  { value: '500', label: '500ms (High)' },
                  { value: '1000', label: '1000ms (Standard)' },
                  { value: '3000', label: '3000ms (Eco)' },
                ]}
                value={String(intervalMs)}
                onChange={(val) => {
                  setIntervalMs(Number(val));
                  handleSave();
                }}
                className="w-full justify-between"
              />
            </div>
          </div>
        </GlassCard>

        {/* Security Rule Toggles */}
        <GlassCard className="col-span-12 lg:col-span-6 p-5 space-y-4">
          <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--glass-border-subtle)] pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            <span>Heuristic Defensive Rules</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border-subtle)] cursor-pointer">
              <span className="text-[var(--text-primary)]">Unsigned Executable Warning</span>
              <input
                type="checkbox"
                checked={unsignedDetection}
                onChange={(e) => {
                  setUnsignedDetection(e.target.checked);
                  handleSave();
                }}
                className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border-subtle)] cursor-pointer">
              <span className="text-[var(--text-primary)]">Temp / AppData Path Auditing</span>
              <input
                type="checkbox"
                checked={suspiciousPaths}
                onChange={(e) => {
                  setSuspiciousPaths(e.target.checked);
                  handleSave();
                }}
                className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border-subtle)] cursor-pointer">
              <span className="text-[var(--text-primary)]">Confirm Process Terminations</span>
              <input
                type="checkbox"
                checked={confirmDestructive}
                onChange={(e) => {
                  setConfirmDestructive(e.target.checked);
                  handleSave();
                }}
                className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
              />
            </label>
          </div>
        </GlassCard>
      </div>

      {/* About Sentinel Desktop */}
      <GlassCard className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/20 border border-black/10 dark:border-white/20 shrink-0">
            <img
              src={appIcon}
              alt="Sentinel Desktop"
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[var(--text-primary)] font-mono">
                Sentinel Desktop Workstation
              </h3>
              <GlassBadge variant="cyan" size="sm">v1.0.0 Enterprise</GlassBadge>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              High-performance Win32 hardware telemetry & cybersecurity monitoring engine with Apple Glass UI
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Workstation Diagnostics & Architecture */}
      <GlassCard className="p-5 space-y-3">
        <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--glass-border-subtle)] pb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Workstation Diagnostics & Runtime Architecture</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 text-xs font-mono">
          <GlassSurface elevation="subtle" rounded="xl" className="p-3">
            <div className="text-[var(--text-tertiary)] text-[10px]">OS Platform</div>
            <div className="text-[var(--text-primary)] font-bold mt-0.5">{overview?.osName || 'Microsoft Windows'}</div>
            <div className="text-[var(--text-secondary)] text-[11px]">{overview?.osRelease || '11 Pro'} ({overview?.arch || 'x64'})</div>
          </GlassSurface>

          <GlassSurface elevation="subtle" rounded="xl" className="p-3">
            <div className="text-[var(--text-tertiary)] text-[10px]">Native Bridge</div>
            <div className="text-cyan-400 font-bold mt-0.5">Koffi C FFI v3.3</div>
            <div className="text-[var(--text-secondary)] text-[11px]">Win32 Direct Dispatch</div>
          </GlassSurface>

          <GlassSurface elevation="subtle" rounded="xl" className="p-3">
            <div className="text-[var(--text-tertiary)] text-[10px]">Persistence Store</div>
            <div className="text-purple-400 font-bold mt-0.5">better-sqlite3</div>
            <div className="text-[var(--text-secondary)] text-[11px]">WAL Journaling Mode</div>
          </GlassSurface>

          <GlassSurface elevation="subtle" rounded="xl" className="p-3">
            <div className="text-[var(--text-tertiary)] text-[10px]">Privilege Security</div>
            <div className={`font-bold mt-0.5 ${overview?.isElevated ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>
              {overview?.isElevated ? 'ELEVATED (Token Admin)' : 'RESTRICTED (User Token)'}
            </div>
            <div className="text-[var(--text-tertiary)] text-[11px]">Safe Isolation Enforced</div>
          </GlassSurface>
        </div>
      </GlassCard>
    </div>
  );
};
