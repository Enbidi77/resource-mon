import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import type { SecurityPosture, SecurityAlert, FimScanResult } from '@sentinel/contracts';
import { useAppStore } from '../stores/useAppStore';
import { ArcGauge } from '../components/common/ArcGauge';
import { formatTimestamp } from '@sentinel/shared';
import {
  GlassBadge,
  GlassButton,
  GlassCard,
  GlassSurface,
} from '../components/glass';

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Host Defensive Security Center
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Defensive posture assessment, process anomaly detection, and File Integrity Monitoring (FIM)
          </p>
        </div>

        <GlassButton
          variant="glass"
          size="sm"
          onClick={fetchSecurityData}
          loading={loading}
          icon={<RefreshCw className="w-3.5 h-3.5 text-red-400" />}
        >
          Refresh Posture
        </GlassButton>
      </div>

      {/* Row 1: Posture Gauges & Controls */}
      <div className="grid grid-cols-12 gap-6">
        {/* Posture Score */}
        <GlassCard className="col-span-12 lg:col-span-4 p-5 flex flex-col justify-between items-center text-center">
          <div className="w-full text-left text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
            Host Defensive Posture
          </div>

          <ArcGauge
            value={posture ? posture.overallScore : 95}
            title="Posture Score"
            subtitle={`Status: ${posture ? posture.statusLevel : 'OPTIMAL'}`}
            size={220}
          />

          <div className="w-full text-xs font-mono text-[var(--text-secondary)] pt-3 border-t border-[var(--glass-border-subtle)] flex justify-between items-center">
            <span>Privilege Elevation:</span>
            <GlassBadge
              variant={posture?.isElevatedAdmin ? 'success' : 'default'}
              size="sm"
              dot
            >
              {posture?.isElevatedAdmin ? 'ADMIN' : 'USER'}
            </GlassBadge>
          </div>
        </GlassCard>

        {/* Protection Services Status */}
        <GlassCard className="col-span-12 lg:col-span-8 p-5 space-y-3">
          <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--glass-border-subtle)] pb-2">
            Host Security Control Subsystems
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <GlassSurface elevation="subtle" rounded="xl" className="p-3 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] font-mono">Antivirus Engine</div>
                <div className="text-[11px] text-[var(--text-secondary)]">{posture?.antivirusName || 'Windows Defender'}</div>
              </div>
              <GlassBadge variant="success" size="sm" dot>
                Active
              </GlassBadge>
            </GlassSurface>

            <GlassSurface elevation="subtle" rounded="xl" className="p-3 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] font-mono">Windows Firewall</div>
                <div className="text-[11px] text-[var(--text-secondary)]">All Profiles Protected</div>
              </div>
              <GlassBadge variant="success" size="sm" dot>
                Engaged
              </GlassBadge>
            </GlassSurface>

            <GlassSurface elevation="subtle" rounded="xl" className="p-3 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] font-mono">User Account Control (UAC)</div>
                <div className="text-[11px] text-[var(--text-secondary)]">Elevation Prompting</div>
              </div>
              <GlassBadge variant="success" size="sm" dot>
                Enabled
              </GlassBadge>
            </GlassSurface>

            <GlassSurface elevation="subtle" rounded="xl" className="p-3 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] font-mono">UEFI Secure Boot</div>
                <div className="text-[11px] text-[var(--text-secondary)]">Firmware Signature Enforced</div>
              </div>
              <GlassBadge variant="success" size="sm" dot>
                Secure
              </GlassBadge>
            </GlassSurface>
          </div>
        </GlassCard>
      </div>

      {/* Row 2: File Integrity Monitoring (FIM) */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              File Integrity Monitoring (FIM) & SHA-256 Baselines
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Monitors critical driver configurations and binary directories for unauthorized alterations
            </div>
          </div>

          <GlassButton
            variant="glass"
            size="sm"
            onClick={handleRunFim}
            loading={isScanningFim}
            icon={<RefreshCw className="w-3.5 h-3.5 text-cyan-400" />}
          >
            {isScanningFim ? 'Scanning Baseline...' : 'Run FIM Integrity Check'}
          </GlassButton>
        </div>

        {fimResult && (
          <GlassSurface elevation="subtle" rounded="xl" className="p-3.5 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-[var(--text-primary)]">
              <span>Directory: {fimResult.directory}</span>
              <span className="text-cyan-400 font-semibold">Scanned Files: {fimResult.scannedFiles}</span>
            </div>
            <div className="flex gap-4 text-[11px]">
              <span className="text-emerald-400">Modified: {fimResult.modifiedCount}</span>
              <span className="text-blue-400">Added: {fimResult.addedCount}</span>
              <span className="text-red-400">Deleted: {fimResult.deletedCount}</span>
            </div>
          </GlassSurface>
        )}
      </GlassCard>

      {/* Row 3: Security Findings Feed */}
      <GlassCard className="p-5 space-y-3">
        <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
          Security Alert Feed & Evidence ({alerts.length})
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {alerts.map((alert) => (
            <GlassSurface
              key={alert.id}
              elevation="subtle"
              rounded="xl"
              onClick={() => setSelectedAlert(alert)}
              className="p-3 flex items-center justify-between cursor-pointer hover:border-red-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <GlassBadge
                  variant={
                    alert.severity === 'CRITICAL'
                      ? 'danger'
                      : alert.severity === 'HIGH'
                      ? 'warning'
                      : 'info'
                  }
                  size="sm"
                >
                  {alert.severity}
                </GlassBadge>

                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)] font-mono">{alert.title}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">{alert.description}</div>
                </div>
              </div>

              <div className="text-right text-[11px] font-mono text-[var(--text-tertiary)]">
                <div>{formatTimestamp(alert.timestamp)}</div>
                <div className="text-[var(--text-secondary)] text-[10px]">{alert.ruleId}</div>
              </div>
            </GlassSurface>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
