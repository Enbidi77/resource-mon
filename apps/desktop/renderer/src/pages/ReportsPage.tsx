import React, { useState } from 'react';
import { FileDown, Download, Copy, CheckCircle2, Shield } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { GeneratedReport, ReportConfig } from '@sentinel/contracts';

export const ReportsPage: React.FC = () => {
  const { addToast } = useAppStore();
  const [config, setConfig] = useState<ReportConfig>({
    title: 'Sentinel System & Security Audit Report',
    format: 'html',
    includeMetrics: true,
    includeProcesses: true,
    includeNetwork: true,
    includeSecurity: true,
    includeHardware: true,
    redactSensitiveData: false,
  });

  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);

  const handleGenerate = async () => {
    if (!window.sentinelAPI) return;
    setGenerating(true);
    try {
      const rep = await window.sentinelAPI.generateReport(config);
      setGeneratedReport(rep);
      addToast({ type: 'success', message: `Report generated: ${rep.filename}` });
    } catch {
      addToast({ type: 'error', message: 'Failed to generate report' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedReport) return;
    const blob = new Blob([generatedReport.content], {
      type: generatedReport.format === 'json' ? 'application/json' : 'text/html',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedReport.filename;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'info', message: 'Report download triggered' });
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full select-none">
      <div>
        <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
          <FileDown className="w-5 h-5 text-cyan-400" />
          Audit Reports & Compliance Export
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Generate comprehensive host health, process inventories, network attributions, and security audits
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Configuration Form */}
        <div className="col-span-5 glass-card p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-2">
            Report Parameters
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Report Title</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Export Format</label>
              <div className="flex gap-2">
                {(['html', 'json', 'csv'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setConfig({ ...config, format: fmt })}
                    className={`flex-1 py-1.5 rounded-lg uppercase tracking-wider font-bold text-[10px] transition-colors ${
                      config.format === fmt
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-900 text-slate-400 border border-white/5'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.04] space-y-2">
              <label className="text-slate-400 block">Included Sections</label>
              {[
                { key: 'includeMetrics', label: 'System Overview & Telemetry' },
                { key: 'includeProcesses', label: 'Process Inventory & Hashes' },
                { key: 'includeNetwork', label: 'Network Sockets & Attributions' },
                { key: 'includeSecurity', label: 'Security Alerts & Posture Findings' },
                { key: 'includeHardware', label: 'Hardware & BIOS Inventory' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(config as any)[key]}
                    onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
                    className="accent-cyan-400 rounded"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>{generating ? 'Compiling Report...' : 'Compile Audit Report'}</span>
            </button>
          </div>
        </div>

        {/* Right: Generated Output Preview */}
        <div className="col-span-7 glass-card p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Report Preview & Artifact
              </span>
              {generatedReport && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-mono border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {generatedReport.format.toUpperCase()}</span>
                </button>
              )}
            </div>

            {generatedReport ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs font-mono space-y-1">
                  <div className="text-cyan-400 font-bold">{generatedReport.filename}</div>
                  <div className="text-slate-500">
                    Generated: {generatedReport.generatedAt} • Size: {generatedReport.sizeBytes} bytes
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 font-mono text-[11px] text-slate-400 max-h-72 overflow-y-auto whitespace-pre-wrap select-text">
                  {generatedReport.content.slice(0, 1500)}
                  {generatedReport.content.length > 1500 ? '\n... (truncated for preview)' : ''}
                </div>
              </div>
            ) : (
              <div className="p-16 text-center text-xs text-slate-500 font-mono">
                Configure parameters and click "Compile Audit Report" to generate an auditable workstation document.
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-mono pt-3 border-t border-white/5">
            Report conforms to defensive host compliance logging standards.
          </div>
        </div>
      </div>
    </div>
  );
};
