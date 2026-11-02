import React, { useState, useEffect } from 'react';
import { FileText, Search, RefreshCw } from 'lucide-react';
import type { WindowsEventLogEntry } from '@sentinel/contracts';
import { useAppStore } from '../stores/useAppStore';
import { formatTimestamp } from '@sentinel/shared';
import {
  GlassBadge,
  GlassButton,
  GlassInput,
  GlassSegmentedControl,
  GlassTableContainer,
} from '../components/glass';

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Windows Event Viewer & Audit Logs
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time event stream from System, Application, and Security channels
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Apple Glass Segmented Control Channel Selector */}
          <GlassSegmentedControl
            options={[
              { value: 'System', label: 'System' },
              { value: 'Application', label: 'Application' },
              { value: 'Security', label: 'Security' },
            ]}
            value={logName}
            onChange={(val) => setLogName(val as 'System' | 'Application' | 'Security')}
            size="sm"
          />

          <div className="w-56">
            <GlassInput
              placeholder="Search event ID, text..."
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
            onClick={fetchEvents}
            loading={loading}
            icon={<RefreshCw className="w-3.5 h-3.5 text-cyan-400" />}
          >
            Query
          </GlassButton>
        </div>
      </div>

      {/* Events Table Container */}
      <GlassTableContainer
        className="flex-1"
        header={
          <div className="grid grid-cols-12 text-[11px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">
            <div className="col-span-1">Level</div>
            <div className="col-span-1">Event ID</div>
            <div className="col-span-3">Provider Source</div>
            <div className="col-span-2">Time Generated</div>
            <div className="col-span-5">Message Summary</div>
          </div>
        }
        footer={
          <div className="flex justify-between items-center">
            <span>Active Log Channel: {logName}</span>
            <span>Events Loaded: {events.length}</span>
          </div>
        }
      >
        <div className="divide-y divide-[var(--glass-border-subtle)]">
          {filtered.map((evt) => (
            <div
              key={evt.id}
              className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-black/[0.02] dark:hover:bg-white/[0.02] text-xs font-mono transition-colors"
            >
              <div className="col-span-1">
                <GlassBadge
                  variant={
                    evt.level === 'CRITICAL' || evt.level === 'ERROR'
                      ? 'danger'
                      : evt.level === 'WARNING'
                      ? 'warning'
                      : 'info'
                  }
                  size="sm"
                >
                  {evt.level}
                </GlassBadge>
              </div>
              <div className="col-span-1 text-[var(--text-primary)] font-bold">{evt.eventId}</div>
              <div className="col-span-3 text-[var(--text-primary)] truncate">{evt.source}</div>
              <div className="col-span-2 text-[var(--text-secondary)] text-[11px]">{formatTimestamp(evt.timeGenerated)}</div>
              <div className="col-span-5 text-[var(--text-secondary)] truncate pr-2 select-text">{evt.message}</div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-[var(--text-tertiary)] font-mono">
              No matching Windows events found
            </div>
          )}
        </div>
      </GlassTableContainer>
    </div>
  );
};
