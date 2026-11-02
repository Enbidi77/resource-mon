import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { ProcessInfo } from '@sentinel/contracts';
import { formatBytes, formatPercentage } from '@sentinel/shared';

export const ProcessesPage: React.FC = () => {
  const { setSelectedProcess, addToast } = useAppStore();
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'cpuPercent' | 'memoryBytes' | 'pid' | 'name'>('cpuPercent');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchProcesses = async () => {
    if (!window.sentinelAPI) return;
    setLoading(true);
    try {
      const list = await window.sentinelAPI.listProcesses();
      setProcesses(list);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to retrieve process list' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSort = (field: 'cpuPercent' | 'memoryBytes' | 'pid' | 'name') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filtered = processes
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        String(p.pid).includes(search) ||
        (p.user && p.user.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

  return (
    <div className="p-6 space-y-4 h-full flex flex-col select-none">
      {/* Header & Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Process Explorer & Authenticode Inspector
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active Windows processes, memory footprints, digital signatures, and handle attributes
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs w-64">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by name, PID, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-slate-200 placeholder-slate-500 w-full"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchProcesses}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Process Table */}
      <div className="glass-card rounded-2xl border border-white/5 flex-1 overflow-hidden flex flex-col">
        {/* Table Head */}
        <div className="grid grid-cols-12 px-4 py-3 bg-slate-900/80 border-b border-white/5 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          <div
            className="col-span-4 flex items-center gap-1 cursor-pointer hover:text-white"
            onClick={() => handleSort('name')}
          >
            <span>Process Name</span>
            {sortField === 'name' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
          </div>
          <div
            className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-white"
            onClick={() => handleSort('pid')}
          >
            <span>PID</span>
            {sortField === 'pid' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
          </div>
          <div
            className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-white"
            onClick={() => handleSort('cpuPercent')}
          >
            <span>CPU %</span>
            {sortField === 'cpuPercent' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
          </div>
          <div
            className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-white"
            onClick={() => handleSort('memoryBytes')}
          >
            <span>Working Set</span>
            {sortField === 'memoryBytes' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
          </div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Table Body (Scrollable) */}
        <div className="overflow-y-auto flex-1 divide-y divide-white/[0.04]">
          {filtered.map((proc) => (
            <div
              key={proc.pid}
              onClick={() => setSelectedProcess(proc)}
              className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-cyan-500/[0.04] cursor-pointer transition-colors text-xs group"
            >
              <div className="col-span-4 flex items-center gap-2.5">
                <span className="font-mono font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                  {proc.name}
                </span>
                {proc.isCriticalSystem && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                    SYS
                  </span>
                )}
              </div>

              <div className="col-span-2 font-mono text-slate-400">{proc.pid}</div>

              <div className="col-span-2 font-mono text-cyan-400 font-semibold">
                {formatPercentage(proc.cpuPercent)}
              </div>

              <div className="col-span-2 font-mono text-purple-300">
                {formatBytes(proc.memoryBytes)}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProcess(proc);
                  }}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400"
                  title="Inspect Process Details"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching running processes found
            </div>
          )}
        </div>

        {/* Footer Count */}
        <div className="px-4 py-2 bg-slate-900/60 border-t border-white/5 text-[11px] font-mono text-slate-400 flex justify-between">
          <span>Active Processes: {processes.length}</span>
          <span>Showing: {filtered.length}</span>
        </div>
      </div>
    </div>
  );
};

