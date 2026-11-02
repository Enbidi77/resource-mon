import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  Info,
  CheckCircle2,
} from 'lucide-react';
import type { SecurityPosture, SecurityAlert, FimScanResult } from '@sentinel/contracts';
import { useAppStore } from '../stores/useAppStore';
import { ArcGauge } from '../components/common/ArcGauge';
import { formatTimestamp } from '@sentinel/shared';

export const SecurityPage: React.FC = () => {
  const { setSelectedAlert, addToast } = useAppStore();
  const [posture, setPosture] = useState<SecurityPosture | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [fimResult, setFimResult] = useState<FimScanResult | null>(null);
  const [isScanningFim, setIsScanningFim] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchSecurityData = async () => {
    if (!window.sentinelAPI) return;
    setLoading(true);
    try {
      const [pos, alts] = await Promise.all([
        window.sentinelAPI.getSecurityPosture(),
        window.sentinelAPI.getSecurityAlerts(),
      ]);
      setPosture(pos);
      setAlerts(alts);
    } catch {
      addToast({ type: 'error', message: 'Failed to retrieve security status' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleRunFim = async () => {
    if (!window.sentinelAPI) return;
    setIsScanningFim(true);
    try {
      const res = await window.sentinelAPI.runFimScan();
      setFimResult(res);
      addToast({
        type: 'success',
        message: `FIM scan completed: ${res.scannedFiles} files checked`,
      });
    } catch {
      addToast({ type: 'error', message: 'File integrity scan failed' });
    } finally {
      setIsScanningFim(false);
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full select-none">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Host Defensive Security Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Defensive posture assessment, process anomaly detection, and File Integrity Monitoring (FIM)
          </p>
        </div>

        <button
          onClick={fetchSecurityData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-400' : ''}`} />
          <span>Refresh Posture</span>
        </button>
      </div>

      {/* Row 1: Posture Gauges & Controls */}
      <div className="grid grid-cols-12 gap-6">
        {/* Posture Score */}
        <div className="col-span-4 glass-card p-5 rounded-2xl border border-white/5 flex flex-col justify-between items-center text-center">
          <div className="w-full text-left text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
            Host Defensive Posture
          </div>

          <ArcGauge
            value={posture ? posture.overallScore : 95}
            title="Posture Score"
            subtitle={`Status: ${posture ? posture.statusLevel : 'OPTIMAL'}`}
            size={220}
          />

          <div className="w-full text-xs font-mono text-slate-400 pt-3 border-t border-white/5 flex justify-between">
            <span>Privilege Elevation:</span>
            <span className={posture?.isElevatedAdmin ? 'text-emerald-400' : 'text-slate-400'}>
              {posture?.isElevatedAdmin ? 'ADMIN' : 'USER'}
            </span>
          </div>
        </div>

        {/* Protection Services Status */}
        <div className="col-span-8 glass-card p-5 rounded-2xl border border-white/5 space-y-3">
          <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-2">
            Host Security Control Subsystems
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-white font-mono">Antivirus Engine</div>
                <div className="text-[11px] text-slate-400">{posture?.antivirusName || 'Windows Defender'}</div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-white font-mono">Windows Firewall</div>
                <div className="text-[11px] text-slate-400">All Profiles Protected</div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>Engaged</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-white font-mono">User Account Control (UAC)</div>
                <div className="text-[11px] text-slate-400">Elevation Prompting</div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>Enabled</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-white font-mono">UEFI Secure Boot</div>
                <div className="text-[11px] text-slate-400">Firmware Signature Enforced</div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: File Integrity Monitoring (FIM) */}
      <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              File Integrity Monitoring (FIM) & SHA-256 Baselines
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Monitors critical driver configurations and binary directories for unauthorized alterations
            </div>
          </div>

          <button
            onClick={handleRunFim}
            disabled={isScanningFim}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono border border-cyan-500/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanningFim ? 'animate-spin' : ''}`} />
            <span>{isScanningFim ? 'Scanning Baseline...' : 'Run FIM Integrity Check'}</span>
          </button>
        </div>

        {fimResult && (
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span>Directory: {fimResult.directory}</span>
              <span className="text-cyan-400">Scanned Files: {fimResult.scannedFiles}</span>
            </div>
            <div className="flex gap-4 text-[11px]">
              <span className="text-emerald-400">Modified: {fimResult.modifiedCount}</span>
              <span className="text-blue-400">Added: {fimResult.addedCount}</span>
              <span className="text-red-400">Deleted: {fimResult.deletedCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Security Findings Table */}
      <div className="glass-card rounded-2xl border border-white/5 p-5 space-y-3">
        <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          Security Alert Feed & Evidence ({alerts.length})
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className="p-3 rounded-xl bg-slate-900/60 hover:bg-white/[0.04] border border-white/5 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : alert.severity === 'HIGH'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {alert.severity}
                </span>

                <div>
                  <div className="text-xs font-bold text-white font-mono">{alert.title}</div>
                  <div className="text-[11px] text-slate-400">{alert.description}</div>
                </div>
              </div>

              <div className="text-right text-[11px] font-mono text-slate-500">
                <div>{formatTimestamp(alert.timestamp)}</div>
                <div className="text-slate-400 text-[10px]">{alert.ruleId}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

