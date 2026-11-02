import React, { useState, useEffect } from 'react';
import { Cog, Play, Square, RotateCcw, Search, RefreshCw } from 'lucide-react';
import type { WindowsService } from '@sentinel/contracts';
import { useAppStore } from '../stores/useAppStore';
import {
  GlassBadge,
  GlassButton,
  GlassInput,
  GlassTableContainer,
} from '../components/glass';

export const ServicesPage: React.FC = () => {
  const { addToast } = useAppStore();
  const [services, setServices] = useState<WindowsService[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchServices = async () => {
    if (!window.sentinelAPI) return;
    setLoading(true);
    try {
      const list = await window.sentinelAPI.listServices();
      setServices(list);
    } catch {
      addToast({ type: 'error', message: 'Failed to query Windows services' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleControlService = async (name: string, action: 'start' | 'stop' | 'restart') => {
    if (!window.sentinelAPI) return;
    setActionInProgress(name);
    try {
      const res = await window.sentinelAPI.controlService({ serviceName: name, action });
      if (res.success) {
        addToast({ type: 'success', message: `Service ${name} ${action}ed successfully` });
        fetchServices();
      } else {
        addToast({ type: 'error', message: `Failed: ${res.error}` });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Service operation failed' });
    } finally {
      setActionInProgress(null);
    }
  };

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-4 h-full flex flex-col select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
            <Cog className="w-5 h-5 text-amber-400" />
            Windows Services Manager
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Query, start, stop, and inspect Windows System Services and background daemons
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-64">
            <GlassInput
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-3.5 h-3.5" />}
              clearable
              onClear={() => setSearch('')}
              inputSize="sm"
            />
          </div>

          <GlassButton
            variant="glass"
            size="sm"
            onClick={fetchServices}
            loading={loading}
            icon={<RefreshCw className="w-3.5 h-3.5 text-amber-400" />}
          >
            Refresh
          </GlassButton>
        </div>
      </div>

      {/* Services Table Container - Clean Solid Body with Apple Glass Frame */}
      <GlassTableContainer
        className="flex-1"
        header={
          <div className="grid grid-cols-12 text-[11px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">
            <div className="col-span-4">Service Name & Display Name</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Startup Type</div>
            <div className="col-span-2">Log On Account</div>
            <div className="col-span-2 text-right">Control</div>
          </div>
        }
        footer={
          <div className="flex justify-between items-center">
            <span>Total Services: {services.length}</span>
            <span>Showing: {filtered.length}</span>
          </div>
        }
      >
        <div className="divide-y divide-[var(--glass-border-subtle)]">
          {filtered.map((svc) => (
            <div
              key={svc.name}
              className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-black/[0.02] dark:hover:bg-white/[0.02] text-xs font-mono group transition-colors"
            >
              <div className="col-span-4 pr-3">
                <div className="font-semibold text-[var(--text-primary)] truncate">{svc.displayName}</div>
                <div className="text-[10px] text-[var(--text-tertiary)] truncate">{svc.name}</div>
              </div>

              <div className="col-span-2">
                <GlassBadge
                  variant={svc.status === 'RUNNING' ? 'success' : 'default'}
                  size="sm"
                  dot
                  pulsing={svc.status === 'RUNNING'}
                >
                  {svc.status}
                </GlassBadge>
              </div>

              <div className="col-span-2 text-[var(--text-secondary)] text-[11px]">{svc.startupType}</div>

              <div className="col-span-2 text-[var(--text-secondary)] text-[11px] truncate">
                {svc.serviceAccount || 'LocalSystem'}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-1.5">
                {svc.status === 'RUNNING' ? (
                  <>
                    <button
                      onClick={() => handleControlService(svc.name, 'restart')}
                      disabled={actionInProgress === svc.name}
                      className="p-1.5 rounded-lg bg-[var(--glass-surface-subtle)] hover:bg-[var(--glass-surface-elevated)] border border-[var(--glass-border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      title="Restart Service"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleControlService(svc.name, 'stop')}
                      disabled={actionInProgress === svc.name}
                      className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-400 transition-colors cursor-pointer"
                      title="Stop Service"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleControlService(svc.name, 'start')}
                    disabled={actionInProgress === svc.name}
                    className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 transition-colors cursor-pointer"
                    title="Start Service"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-[var(--text-tertiary)] font-mono">
              No matching Windows services found
            </div>
          )}
        </div>
      </GlassTableContainer>
    </div>
  );
};
