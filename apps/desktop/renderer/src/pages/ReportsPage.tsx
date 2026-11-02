import React, { useState } from 'react';
import { FileDown, Download } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { GeneratedReport, ReportConfig } from '@sentinel/contracts';
import {
  GlassButton,
  GlassCard,
  GlassInput,
  GlassSegmentedControl,
  GlassSurface,
} from '../components/glass';

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
        <h2 className="text-lg font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
          <FileDown className="w-5 h-5 text-cyan-400" />
          Audit Reports & Compliance Export
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Generate comprehensive host health, process inventories, network attributions, and security audits
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Configuration Form */}
        <GlassCard className="col-span-12 lg:col-span-5 p-5 space-y-4">
          <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--glass-border-subtle)] pb-2">
            Report Parameters
          </div>

          <div className="space-y-3.5 text-xs font-mono">
            <div>
              <label className="text-[var(--text-secondary)] block mb-1.5">Report Title</label>
              <GlassInput
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                inputSize="sm"
              />
            </div>

            <div>
              <label className="text-[var(--text-secondary)] block mb-1.5">Export Format</label>
              <GlassSegmentedControl
                options={[
                  { value: 'html', label: 'HTML' },
                  { value: 'json', label: 'JSON' },
                  { value: 'csv', label: 'CSV' },
                ]}
                value={config.format}
                onChange={(fmt) => setConfig({ ...config, format: fmt as 'html' | 'json' | 'csv' })}
                size="sm"
                className="w-full justify-between"
              />
            </div>

            <div className="pt-2 border-t border-[var(--glass-border-subtle)] space-y-2">
              <label className="text-[var(--text-secondary)] block font-semibold">Included Sections</label>
              {[
                { key: 'includeMetrics', label: 'System Overview & Telemetry' },
                { key: 'includeProcesses', label: 'Process Inventory & Hashes' },
                { key: 'includeNetwork', label: 'Network Sockets & Attributions' },
                { key: 'includeSecurity', label: 'Security Alerts & Posture Findings' },
                { key: 'includeHardware', label: 'Hardware & BIOS Inventory' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-[var(--text-primary)] cursor-pointer py-0.5">
                  <input
                    type="checkbox"
                    checked={(config as any)[key]}
                    onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
                    className="accent-cyan-400 rounded w-4 h-4 cursor-pointer"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <GlassButton
              variant="primary"
              size="md"
              onClick={handleGenerate}
              loading={generating}
              icon={<FileDown className="w-4 h-4" />}
              className="w-full mt-4"
            >
              {generating ? 'Compiling Report...' : 'Compile Audit Report'}
            </GlassButton>
          </div>
        </GlassCard>

        {/* Right: Generated Output Preview */}
        <GlassCard className="col-span-12 lg:col-span-7 p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-[var(--glass-border-subtle)] pb-2 mb-3">
              <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Report Preview & Artifact
              </span>
              {generatedReport && (
                <GlassButton
                  variant="glass"
                  size="xs"
                  onClick={handleDownload}
                  icon={<Download className="w-3.5 h-3.5 text-emerald-400" />}
                >
                  Download {generatedReport.format.toUpperCase()}
                </GlassButton>
              )}
            </div>

            {generatedReport ? (
              <div className="space-y-3">
                <GlassSurface elevation="subtle" rounded="xl" className="p-3 text-xs font-mono space-y-1">
                  <div className="text-cyan-400 font-bold">{generatedReport.filename}</div>
                  <div className="text-[var(--text-tertiary)]">
                    Generated: {generatedReport.generatedAt} • Size: {generatedReport.sizeBytes} bytes
                  </div>
                </GlassSurface>

                <div className="p-3 rounded-xl bg-black/20 dark:bg-black/40 border border-[var(--glass-border-subtle)] font-mono text-[11px] text-[var(--text-secondary)] max-h-72 overflow-y-auto whitespace-pre-wrap select-text">
                  {generatedReport.content.slice(0, 1500)}
                  {generatedReport.content.length > 1500 ? '\n... (truncated for preview)' : ''}
                </div>
              </div>
            ) : (
              <div className="p-16 text-center text-xs text-[var(--text-tertiary)] font-mono">
                Configure parameters and click "Compile Audit Report" to generate an auditable workstation document.
              </div>
            )}
          </div>

          <div className="text-[11px] text-[var(--text-tertiary)] font-mono pt-3 border-t border-[var(--glass-border-subtle)]">
            Report conforms to defensive host compliance logging standards.
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
