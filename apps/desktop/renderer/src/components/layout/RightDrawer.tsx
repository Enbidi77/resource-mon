import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  FolderOpen,
  Copy,
  Trash2,
  CheckCircle2,
  Hash,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { formatBytes, formatPercentage } from '@sentinel/shared';

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
    <aside className="w-80 h-full bg-[#0c0f17]/95 backdrop-blur-2xl border-l border-white/[0.08] flex flex-col justify-between p-4 z-40 select-none overflow-y-auto">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
              Inspection Inspector
            </span>
          </div>
          <button
            onClick={() => setIsRightDrawerOpen(false)}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Process Inspection Mode */}
        {selectedProcess && (
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-500">Process Name</div>
              <div className="text-sm font-bold text-white mt-0.5 break-all font-mono">
                {selectedProcess.name}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                <div className="text-[10px] text-slate-500 font-mono">PID</div>
                <div className="text-sm font-bold text-cyan-400 font-mono">{selectedProcess.pid}</div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                <div className="text-[10px] text-slate-500 font-mono">Parent PID</div>
                <div className="text-sm font-bold text-slate-300 font-mono">
                  {selectedProcess.ppid ?? 'N/A'}
                </div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                <div className="text-[10px] text-slate-500 font-mono">CPU Usage</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {formatPercentage(selectedProcess.cpuPercent)}
                </div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                <div className="text-[10px] text-slate-500 font-mono">Working Set</div>
                <div className="text-sm font-bold text-cyan-400 font-mono">
                  {formatBytes(selectedProcess.memoryBytes)}
                </div>
              </div>
            </div>

            {/* Path */}
            <div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>Executable Path</span>
                {selectedProcess.executablePath && (
                  <button
                    onClick={() => copyToClipboard(selectedProcess.executablePath!, 'Path')}
                    className="hover:text-cyan-400"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="p-2 mt-1 rounded bg-slate-900/80 border border-white/5 font-mono text-[11px] text-slate-300 break-all select-text">
                {selectedProcess.executablePath || 'Path unavailable (restricted privilege)'}
              </div>
            </div>

            {/* Command Line */}
            {selectedProcess.commandLine && (
              <div>
                <div className="text-[10px] font-mono text-slate-500">Command Line Arguments</div>
                <div className="p-2 mt-1 rounded bg-slate-900/80 border border-white/5 font-mono text-[11px] text-slate-400 break-all select-text max-h-24 overflow-y-auto">
                  {selectedProcess.commandLine}
                </div>
              </div>
            )}

            {/* Digital Signature & Authenticode Check */}
            <div className="p-3 rounded-lg bg-slate-900/70 border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300">Authenticode Signature</span>
                <button
                  onClick={handleVerifySignature}
                  disabled={isVerifying || !selectedProcess.executablePath}
                  className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-mono border border-cyan-500/30 transition-colors disabled:opacity-50"
                >
                  {isVerifying ? 'Checking...' : 'Verify Signature'}
                </button>
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
                    <span className="text-slate-400 text-[11px] truncate">
                      ({sigResult.signer})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Destructive Action */}
            <button
              onClick={handleTerminateProcess}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-semibold transition-colors mt-4"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Terminate Process</span>
            </button>
          </div>
        )}

        {/* Security Alert Inspection Mode */}
        {selectedAlert && (
          <div className="mt-4 space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 font-mono font-bold text-[10px]">
                {selectedAlert.severity}
              </span>
              <span className="font-mono text-slate-400 text-[11px]">{selectedAlert.ruleId}</span>
            </div>

            <div className="text-sm font-bold text-white mt-1">{selectedAlert.title}</div>
            <div className="text-slate-400 text-[11px] leading-relaxed">
              {selectedAlert.description}
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5 space-y-1">
              <div className="text-[10px] font-mono text-slate-500">Affected Resource</div>
              <div className="text-cyan-400 font-mono break-all">{selectedAlert.affectedResource}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 space-y-1">
              <div className="text-[10px] font-mono text-cyan-400">Recommendation</div>
              <div className="text-slate-300 text-[11px] leading-relaxed">
                {selectedAlert.recommendation}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-[10px] text-slate-500 text-center font-mono">
        Sentinel Workstation FFI Inspector
      </div>
    </aside>
  );
};
