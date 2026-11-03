import React, { useState, useEffect } from "react";
import {
  Layers,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAppStore } from "../stores/useAppStore";
import type { ProcessInfo } from "@sentinel/contracts";
import { formatBytes, formatPercentage } from "@sentinel/shared";
import {
  GlassBadge,
  GlassButton,
  GlassInput,
  GlassTableContainer,
} from "../components/glass";

export const ProcessesPage: React.FC = () => {
  const { setSelectedProcess, addToast } = useAppStore();
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<
    "cpuPercent" | "memoryBytes" | "pid" | "name"
  >("cpuPercent");
  const [sortAsc, setSortAsc] = useState(false);

  const fetchProcesses = async () => {
    if (!window.sentinelAPI) return;
    setLoading(true);
    try {
      const list = await window.sentinelAPI.listProcesses();
      setProcesses(list);
    } catch {
      addToast({ type: "error", message: "Failed to retrieve process list" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSort = (field: "cpuPercent" | "memoryBytes" | "pid" | "name") => {
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
        (p.user && p.user.toLowerCase().includes(search.toLowerCase())),
    )
    .sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      if (typeof valA === "string" && typeof valB === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

  return (
    <div className="p-6 space-y-4 h-full flex flex-col select-none">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Process Explorer & Authenticode Inspector
          </h2>
          <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5 font-mono">
            Active Windows processes, memory footprints, digital signatures, and
            handle attributes
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-64">
            <GlassInput
              placeholder="Filter name, PID, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-3.5 h-3.5" />}
              clearable
              onClear={() => setSearch("")}
              inputSize="sm"
            />
          </div>

          <GlassButton
            variant="glass"
            size="sm"
            onClick={fetchProcesses}
            loading={loading}
            icon={
              <RefreshCw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            }
          >
            Refresh
          </GlassButton>
        </div>
      </div>

      {/* Process Table with Apple Glass Frame */}
      <GlassTableContainer
        className="flex-1"
        header={
          <div className="grid grid-cols-12 text-[11px] font-mono font-semibold text-slate-700 dark:text-white/80 uppercase tracking-wider">
            <div
              className="col-span-4 flex items-center gap-1 cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              onClick={() => handleSort("name")}
            >
              <span>Process Name</span>
              {sortField === "name" &&
                (sortAsc ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                ))}
            </div>
            <div
              className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              onClick={() => handleSort("pid")}
            >
              <span>PID</span>
              {sortField === "pid" &&
                (sortAsc ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                ))}
            </div>
            <div
              className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              onClick={() => handleSort("cpuPercent")}
            >
              <span>CPU %</span>
              {sortField === "cpuPercent" &&
                (sortAsc ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                ))}
            </div>
            <div
              className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              onClick={() => handleSort("memoryBytes")}
            >
              <span>Working Set</span>
              {sortField === "memoryBytes" &&
                (sortAsc ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                ))}
            </div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        }
        footer={
          <div className="flex justify-between items-center text-slate-600 dark:text-white/70">
            <span>Active Processes: {processes.length}</span>
            <span>Showing: {filtered.length}</span>
          </div>
        }
      >
        <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
          {filtered.map((proc) => (
            <div
              key={proc.pid}
              onClick={() => setSelectedProcess(proc)}
              className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-cyan-500/[0.06] dark:hover:bg-white/[0.05] cursor-pointer transition-colors text-xs font-mono group"
            >
              <div className="col-span-4 flex items-center gap-2.5 pr-2">
                <span className="font-mono font-medium text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 truncate transition-colors">
                  {proc.name}
                </span>
                {proc.isCriticalSystem && (
                  <GlassBadge variant="info" size="sm">
                    SYS
                  </GlassBadge>
                )}
              </div>

              <div className="col-span-2 font-mono text-cyan-700 dark:text-cyan-400 font-bold">
                {proc.pid}
              </div>

              <div className="col-span-2 font-mono text-cyan-700 dark:text-cyan-400 font-semibold">
                {formatPercentage(proc.cpuPercent)}
              </div>

              <div className="col-span-2 font-mono text-purple-700 dark:text-purple-300 font-medium">
                {formatBytes(proc.memoryBytes)}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProcess(proc);
                  }}
                  className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/10 text-slate-500 hover:text-cyan-600 dark:text-white/50 dark:hover:text-cyan-400 transition-colors cursor-pointer"
                  title="Inspect Process Details"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-white/40 font-mono">
              No matching running processes found
            </div>
          )}
        </div>
      </GlassTableContainer>
    </div>
  );
};
