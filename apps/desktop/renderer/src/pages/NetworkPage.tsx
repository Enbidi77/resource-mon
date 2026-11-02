import React, { useState, useEffect } from 'react';
import { Wifi, Search, RefreshCw, Globe, ArrowDown, ArrowUp, Activity } from 'lucide-react';
import type { NetworkConnection, NetworkInterface } from '@sentinel/contracts';
import { formatBytes, formatSpeed } from '@sentinel/shared';
import { useAppStore } from '../stores/useAppStore';

export const NetworkPage: React.FC = () => {
  const { setSelectedConnection, addToast } = useAppStore();
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchNetworkData = async () => {
    if (!window.sentinelAPI) return;
    setLoading(true);
    try {
      const [conns, ifaces] = await Promise.all([
        window.sentinelAPI.getNetworkConnections(),
        window.sentinelAPI.getNetworkInterfaces(),
      ]);
      setConnections(conns);
      setInterfaces(ifaces);
    } catch {
      addToast({ type: 'error', message: 'Failed to retrieve network telemetry' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
    const interval = setInterval(fetchNetworkData, 4000);
    return () => clearInterval(interval);
  }, []);

  const filtered = connections.filter(
    (c) =>
      c.localAddress.includes(search) ||
      String(c.localPort).includes(search) ||
      (c.remoteAddress && c.remoteAddress.includes(search)) ||
      (c.processName && c.processName.toLowerCase().includes(search.toLowerCase())) ||
      String(c.pid).includes(search)
  );

  return (
    <div className="p-6 space-y-5 h-full flex flex-col select-none">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Wifi className="w-5 h-5 text-blue-400" />
            Network Monitor & Active Socket Attribution
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active TCP/UDP connections mapped directly to owning PIDs, listening ports, and adapter statistics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs w-64">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search IP, port, or process..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-slate-200 placeholder-slate-500 w-full"
            />
          </div>

          <button
            onClick={fetchNetworkData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Network Adapters Cards */}
      <div className="grid grid-cols-3 gap-4">
        {interfaces.slice(0, 3).map((iface) => (
          <div key={iface.iface} className="glass-card p-4 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono font-bold text-white truncate max-w-[180px]">
                {iface.ifaceName || iface.iface}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                {iface.type || 'Ethernet'}
              </span>
            </div>

            <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
              <div>IPv4: <span className="text-cyan-400">{iface.ip4 || 'N/A'}</span></div>
              <div>MAC: <span className="text-slate-300">{iface.mac}</span></div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono pt-1 text-slate-400 border-t border-white/[0.04]">
              <span className="flex items-center gap-1 text-emerald-400">
                <ArrowDown className="w-3 h-3" /> {formatSpeed(iface.rxSec || 0)}
              </span>
              <span className="flex items-center gap-1 text-blue-400">
                <ArrowUp className="w-3 h-3" /> {formatSpeed(iface.txSec || 0)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Socket Table */}
      <div className="glass-card rounded-2xl border border-white/5 flex-1 overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-4 py-3 bg-slate-900/80 border-b border-white/5 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          <div className="col-span-1">Proto</div>
          <div className="col-span-3">Local Address : Port</div>
          <div className="col-span-3">Remote Address : Port</div>
          <div className="col-span-2">State</div>
          <div className="col-span-1">PID</div>
          <div className="col-span-2 text-right">Process Name</div>
        </div>

        {/* Socket Rows */}
        <div className="overflow-y-auto flex-1 divide-y divide-white/[0.04]">
          {filtered.map((conn) => (
            <div
              key={conn.id}
              onClick={() => setSelectedConnection(conn)}
              className="grid grid-cols-12 px-4 py-2 items-center hover:bg-blue-500/[0.04] cursor-pointer transition-colors text-xs font-mono group"
            >
              <div className="col-span-1 text-blue-400 font-semibold">{conn.protocol}</div>
              <div className="col-span-3 text-slate-200">
                {conn.localAddress}:{conn.localPort}
              </div>
              <div className="col-span-3 text-slate-400 truncate">
                {conn.remoteAddress ? `${conn.remoteAddress}:${conn.remotePort}` : '0.0.0.0:0 (Any)'}
              </div>
              <div className="col-span-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    conn.state === 'ESTABLISHED'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : conn.state === 'LISTEN'
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      : 'bg-slate-700/40 text-slate-400'
                  }`}
                >
                  {conn.state}
                </span>
              </div>
              <div className="col-span-1 text-slate-400">{conn.pid || '--'}</div>
              <div className="col-span-2 text-right text-slate-300 font-medium truncate group-hover:text-cyan-300">
                {conn.processName || '--'}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No matching network connections found
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-900/60 border-t border-white/5 text-[11px] font-mono text-slate-400 flex justify-between">
          <span>Active Connections: {connections.length}</span>
          <span>Filtered: {filtered.length}</span>
        </div>
      </div>
    </div>
  );
};
