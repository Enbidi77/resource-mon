import React, { useState } from 'react';
import { Settings, Shield, Sliders, Monitor, Database, CheckCircle2 } from 'lucide-react';
import { useMetricsStore } from '../stores/useMetricsStore';
import { useAppStore } from '../stores/useAppStore';

export const SettingsPage: React.FC = () => {
  const { intervalMs, setIntervalMs } = useMetricsStore();
  const { overview, addToast } = useAppStore();

  const [unsignedDetection, setUnsignedDetection] = useState(true);
  const [suspiciousPaths, setSuspiciousPaths] = useState(true);
  const [confirmDestructive, setConfirmDestructive] = useState(true);

  const handleSave = () => {
    addToast({ type: 'success', message: 'Preferences updated successfully' });
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full select-none">
      <div>
        <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Workstation Configuration & Settings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Tune high-frequency telemetry intervals, defensive heuristic rules, and native bridge parameters
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Monitoring & Telemetry Settings */}
        <div className="col-span-6 glass-card p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Telemetry Sampling Rates</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Fast Metrics Interval (CPU, Memory, Bandwidth)</label>
              <div className="flex gap-2">
                {[
                  { ms: 500, label: '500ms (High)' },
                  { ms: 1000, label: '1000ms (Standard)' },
                  { ms: 3000, label: '3000ms (Eco)' },
                ].map(({ ms, label }) => (
                  <button
                    key={ms}
                    onClick={() => {
                      setIntervalMs(ms);
                      handleSave();
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono transition-colors ${
                      intervalMs === ms
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                        : 'bg-slate-900 text-slate-400 border border-white/5'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security Rule Toggles */}
        <div className="col-span-6 glass-card p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            <span>Heuristic Defensive Rules</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-white/5 cursor-pointer">
              <span className="text-slate-300">Unsigned Executable Warning</span>
              <input
                type="checkbox"
                checked={unsignedDetection}
                onChange={(e) => {
                  setUnsignedDetection(e.target.checked);
                  handleSave();
                }}
                className="accent-cyan-400 w-4 h-4 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-white/5 cursor-pointer">
              <span className="text-slate-300">Temp / AppData Path Auditing</span>
              <input
                type="checkbox"
                checked={suspiciousPaths}
                onChange={(e) => {
                  setSuspiciousPaths(e.target.checked);
                  handleSave();
                }}
                className="accent-cyan-400 w-4 h-4 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-white/5 cursor-pointer">
              <span className="text-slate-300">Confirm Process Terminations</span>
              <input
                type="checkbox"
                checked={confirmDestructive}
                onChange={(e) => {
                  setConfirmDestructive(e.target.checked);
                  handleSave();
                }}
                className="accent-cyan-400 w-4 h-4 rounded"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Workstation Diagnostics & Architecture */}
      <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-3">
        <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Workstation Diagnostics & Runtime Architecture</span>
        </div>

        <div className="grid grid-cols-4 gap-4 pt-2 text-xs font-mono">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
            <div className="text-slate-500 text-[10px]">OS Platform</div>
            <div className="text-white font-bold mt-0.5">{overview?.osName || 'Microsoft Windows'}</div>
            <div className="text-slate-500 text-[11px]">{overview?.osRelease || '11 Pro'} ({overview?.arch || 'x64'})</div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
            <div className="text-slate-500 text-[10px]">Native Bridge</div>
            <div className="text-cyan-400 font-bold mt-0.5">Koffi C FFI v3.3</div>
            <div className="text-slate-500 text-[11px]">Win32 Direct Dispatch</div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
            <div className="text-slate-500 text-[10px]">Persistence Store</div>
            <div className="text-purple-400 font-bold mt-0.5">better-sqlite3</div>
            <div className="text-slate-500 text-[11px]">WAL Journaling Mode</div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
            <div className="text-slate-500 text-[10px]">Privilege Security</div>
            <div className={`font-bold mt-0.5 ${overview?.isElevated ? 'text-emerald-400' : 'text-slate-300'}`}>
              {overview?.isElevated ? 'ELEVATED (Token Admin)' : 'RESTRICTED (User Token)'}
            </div>
            <div className="text-slate-500 text-[11px]">Safe Isolation Enforced</div>
          </div>
        </div>
      </div>
    </div>
  );
};
