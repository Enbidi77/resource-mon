import React, { useState, useEffect } from 'react';
import { Cog, Play, Square, RotateCcw, Search, RefreshCw, AlertCircle } from 'lucide-react';
import type { WindowsService } from '@sentinel/contracts';
import { useAppStore } from '../stores/useAppStore';

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Cog className="w-5 h-5 text-yellow-400" />
            Windows Services Manager
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Query, start, stop, and inspect Windows System Services and background daemons
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs w-64">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-slate-200 placeholder-slate-500 w-full"
            />
          </div>

          <button
            onClick={fetchServices}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-yellow-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="glass-card rounded-2xl border border-white/5 flex-1 overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 px-4 py-3 bg-slate-900/80 border-b border-white/5 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          <div className="col-span-4">Service Name & Display Name</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Startup Type</div>
          <div className="col-span-2">Log On Account</div>
          <div className="col-span-2 text-right">Control</div>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-white/[0.04]">
          {filtered.map((svc) => (
            <div
              key={svc.name}
              className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-white/[0.02] text-xs font-mono group"
            >
              <div className="col-span-4 pr-3">
                <div className="font-semibold text-slate-200 truncate">{svc.displayName}</div>
                <div className="text-[10px] text-slate-500 truncate">{svc.name}</div>
              </div>

              <div className="col-span-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    svc.status === 'RUNNING'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-700/40 text-slate-400'
                  }`}
                >
                  {svc.status}
                </span>
              </div>

              <div className="col-span-2 text-slate-400 text-[11px]">{svc.startupType}</div>

              <div className="col-span-2 text-slate-400 text-[11px] truncate">
                {svc.serviceAccount || 'LocalSystem'}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-1.5">
                {svc.status === 'RUNNING' ? (
                  <>
                    <button
                      onClick={() => handleControlService(svc.name, 'restart')}
                      disabled={actionInProgress === svc.name}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Restart Service"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleControlService(svc.name, 'stop')}
                      disabled={actionInProgress === svc.name}
                      className="p-1 rounded bg-red-500/15 hover:bg-red-500/25 text-red-400"
                      title="Stop Service"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleControlService(svc.name, 'start')}
                    disabled={actionInProgress === svc.name}
                    className="p-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400"
                    title="Start Service"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No matching Windows services found
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-900/60 border-t border-white/5 text-[11px] font-mono text-slate-400 flex justify-between">
          <span>Total Services: {services.length}</span>
          <span>Showing: {filtered.length}</span>
        </div>
      </div>
    </div>
  );
};

