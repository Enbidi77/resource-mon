import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { formatBytes, formatPercentage } from '@sentinel/shared';
import { GlassBadge, GlassButton, GlassCard, GlassSurface } from '../glass';

export const RightDrawer: React.FC = () => {
  const {
    isRightDrawerOpen,
    setIsRightDrawerOpen,
    selectedProcess,
    selectedConnection,
    selectedAlert,
    addToast,
  } = useAppStore();

  const [isVerifying, setIsVerifying] = useState(false);
  const [sigResult, setSigResult] = useState<{ status: string; signer?: string | null } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isRightDrawerOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    addToast({ type: 'info', message: `Copied ${label} to clipboard` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleVerifySignature = async () => {
    if (!selectedProcess?.executablePath || !window.sentinelAPI) return;
    setIsVerifying(true);
    try {
      const res = await window.sentinelAPI.verifyProcessSignature(selectedProcess.executablePath);
      setSigResult(res);
      addToast({
        type: res.status === 'VALID' ? 'success' : 'warning',
        message: `Authenticode Signature: ${res.status}`,
      });
    } catch {
      addToast({ type: 'error', message: 'Failed to verify signature' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTerminateProcess = async () => {
    if (!selectedProcess || !window.sentinelAPI) return;
    if (confirm(`Are you sure you want to terminate "${selectedProcess.name}" (PID ${selectedProcess.pid})?`)) {
      const res = await window.sentinelAPI.controlProcess({
        pid: selectedProcess.pid,
        action: 'terminate',
      });
      if (res.success) {
        addToast({ type: 'success', message: `Terminated process PID ${selectedProcess.pid}` });
        setIsRightDrawerOpen(false);
      } else {
        addToast({ type: 'error', message: `Failed: ${res.error}` });
      }
    }
  };

  return (
    <aside className="w-84 h-full bg-[var(--glass-surface-elevated)] backdrop-blur-2xl backdrop-saturate-200 border-l border-[var(--glass-border)] flex flex-col justify-between p-4 z-40 select-none overflow-y-auto shadow-2xl shadow-[var(--glass-specular)]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
              Deep Inspector
            </span>
          </div>
          <button
            onClick={() => setIsRightDrawerOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Process Inspection Mode */}
        {selectedProcess && (
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <div className="text-[10px] uppercase font-mono text-[var(--text-tertiary)]">Process Name</div>
              <div className="text-sm font-bold text-[var(--text-primary)] mt-0.5 break-all font-mono">
                {selectedProcess.name}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <GlassSurface elevation="subtle" rounded="xl" className="p-2.5">
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono">PID</div>
                <div className="text-sm font-bold text-cyan-400 font-mono">{selectedProcess.pid}</div>
              </GlassSurface>
              <GlassSurface elevation="subtle" rounded="xl" className="p-2.5">
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono">Parent PID</div>
                <div className="text-sm font-bold text-[var(--text-secondary)] font-mono">
                  {selectedProcess.ppid ?? 'N/A'}
                </div>
              </GlassSurface>
              <GlassSurface elevation="subtle" rounded="xl" className="p-2.5">
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono">CPU Usage</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {formatPercentage(selectedProcess.cpuPercent)}
                </div>
              </GlassSurface>
              <GlassSurface elevation="subtle" rounded="xl" className="p-2.5">
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono">Working Set</div>
                <div className="text-sm font-bold text-cyan-400 font-mono">
                  {formatBytes(selectedProcess.memoryBytes)}
                </div>
              </GlassSurface>
            </div>

            {/* Path */}
            <div>
              <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-tertiary)]">
                <span>Executable Path</span>
                {selectedProcess.executablePath && (
                  <button
                    onClick={() => copyToClipboard(selectedProcess.executablePath!, 'Path')}
                    className="hover:text-cyan-400 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="p-2 mt-1 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border-subtle)] font-mono text-[11px] text-[var(--text-secondary)] break-all select-text">
                {selectedProcess.executablePath || 'Path unavailable (restricted privilege)'}
              </div>
            </div>

            {/* Command Line */}
            {selectedProcess.commandLine && (
              <div>
                <div className="text-[10px] font-mono text-[var(--text-tertiary)]">Command Line Arguments</div>
                <div className="p-2 mt-1 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border-subtle)] font-mono text-[11px] text-[var(--text-tertiary)] break-all select-text max-h-24 overflow-y-auto">
                  {selectedProcess.commandLine}
                </div>
              </div>
            )}

            {/* Digital Signature & Authenticode Check */}
            <GlassCard variant="subtle" className="p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-[var(--text-primary)]">Authenticode Signature</span>
                <GlassButton
                  variant="glass"
                  size="xs"
                  loading={isVerifying}
                  disabled={!selectedProcess.executablePath}
                  onClick={handleVerifySignature}
                >
                  Verify
                </GlassButton>
              </div>

              {sigResult && (
                <div className="flex items-center gap-2 text-xs pt-1">
                  {sigResult.status === 'VALID' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                  )}
                  <span
                    className={`font-semibold ${
                      sigResult.status === 'VALID' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {sigResult.status}
                  </span>
                  {sigResult.signer && (
                    <span className="text-[var(--text-tertiary)] text-[11px] truncate">
                      ({sigResult.signer})
                    </span>
                  )}
                </div>
              )}
            </GlassCard>

            {/* Destructive Action */}
            <GlassButton
              variant="danger"
              size="md"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={handleTerminateProcess}
              className="w-full mt-4"
            >
              Terminate Process
            </GlassButton>
          </div>
        )}

        {/* Security Alert Inspection Mode */}
        {selectedAlert && (
          <div className="mt-4 space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <GlassBadge variant="danger" size="sm">
                {selectedAlert.severity}
              </GlassBadge>
              <span className="font-mono text-[var(--text-tertiary)] text-[11px]">{selectedAlert.ruleId}</span>
            </div>

            <div className="text-sm font-bold text-[var(--text-primary)] mt-1">{selectedAlert.title}</div>
            <div className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
              {selectedAlert.description}
            </div>

            <GlassSurface elevation="subtle" rounded="xl" className="p-2.5 space-y-1">
              <div className="text-[10px] font-mono text-[var(--text-tertiary)]">Affected Resource</div>
              <div className="text-cyan-400 font-mono break-all">{selectedAlert.affectedResource}</div>
            </GlassSurface>

            <GlassSurface elevation="subtle" rounded="xl" className="p-2.5 border-cyan-500/20 space-y-1">
              <div className="text-[10px] font-mono text-cyan-400">Recommendation</div>
              <div className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                {selectedAlert.recommendation}
              </div>
            </GlassSurface>
          </div>
        )}
      </div>

      <div className="text-[10px] text-[var(--text-tertiary)] text-center font-mono pt-4 border-t border-[var(--glass-border-subtle)]">
        Sentinel Workstation FFI Inspector
      </div>
    </aside>
  );
};
