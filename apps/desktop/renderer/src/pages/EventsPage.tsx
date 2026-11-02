import React, { useState, useEffect } from 'react';
import { FileText, Search, RefreshCw, Download, AlertCircle, Info } from 'lucide-react';
import type { WindowsEventLogEntry } from '@sentinel/contracts';
import { useAppStore } from '../stores/useAppStore';
import { formatTimestamp } from '@sentinel/shared';

export const EventsPage: React.FC = () => {
  const { addToast } = useAppStore();
  const [logName, setLogName] = useState<'System' | 'Application' | 'Security'>('System');
  const [events, setEvents] = useState<WindowsEventLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchEvents = async () => {
    if (!window.sentinelAPI) return;
    setLoading(true);
    try {
      const data = await window.sentinelAPI.queryEvents({ logName, limit: 60 });
      setEvents(data);
    } catch {
      addToast({ type: 'error', message: 'Failed to query Windows Event Log' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [logName]);

  const filtered = events.filter(
    (e) =>
      e.message.toLowerCase().includes(search.toLowerCase()) ||
      e.source.toLowerCase().includes(search.toLowerCase()) ||
      String(e.eventId).includes(search)
  );

  return (
    <div className="p-6 space-y-4 h-full flex flex-col select-none">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Windows Event Viewer & Audit Logs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time event stream from System, Application, and Security channels
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Channel Selector */}
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-white/10 text-xs font-mono">
            {(['System', 'Application', 'Security'] as const).map((channel) => (
              <button
                key={channel}
                onClick={() => setLogName(channel)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  logName === channel
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {channel}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs w-56">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search event ID, text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-slate-200 placeholder-slate-500 w-full"
            />
          </div>

          <button
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Query</span>
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="glass-card rounded-2xl border border-white/5 flex-1 overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 px-4 py-3 bg-slate-900/80 border-b border-white/5 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          <div className="col-span-1">Level</div>
          <div className="col-span-1">Event ID</div>
          <div className="col-span-3">Provider Source</div>
          <div className="col-span-2">Time Generated</div>
          <div className="col-span-5">Message Summary</div>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-white/[0.04]">
          {filtered.map((evt) => (
            <div
              key={evt.id}
              className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-white/[0.02] text-xs font-mono"
            >
              <div className="col-span-1">
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    evt.level === 'CRITICAL' || evt.level === 'ERROR'
                      ? 'bg-red-500/20 text-red-400'
                      : evt.level === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {evt.level}
                </span>
              </div>
              <div className="col-span-1 text-slate-300 font-bold">{evt.eventId}</div>
              <div className="col-span-3 text-slate-300 truncate">{evt.source}</div>
              <div className="col-span-2 text-slate-400 text-[11px]">{formatTimestamp(evt.timeGenerated)}</div>
              <div className="col-span-5 text-slate-300 truncate pr-2 select-text">{evt.message}</div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No matching Windows events found
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-900/60 border-t border-white/5 text-[11px] font-mono text-slate-400 flex justify-between">
          <span>Active Log Channel: {logName}</span>
          <span>Events Loaded: {events.length}</span>
        </div>
      </div>
    </div>
  );
};

