import React, { useState, useEffect } from "react";
import { Wifi, Search, RefreshCw, ArrowDown, ArrowUp } from "lucide-react";
import { useAppStore } from "../stores/useAppStore";
import type {
  NetworkConnectionInfo,
  NetworkInterfaceInfo,
} from "@sentinel/contracts";
import { formatSpeed } from "@sentinel/shared";
import {
  GlassBadge,
  GlassButton,
  GlassCard,
  GlassInput,
  GlassTableContainer,
} from "../components/glass";

export const NetworkPage: React.FC = () => {
  const { setSelectedConnection, addToast } = useAppStore();
  const [connections, setConnections] = useState<NetworkConnectionInfo[]>([]);
  const [interfaces, setInterfaces] = useState<NetworkInterfaceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

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
      addToast({
        type: "error",
        message: "Failed to retrieve network telemetry",
      });
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
      (c.remoteAddress && c.remoteAddress.includes(search)) ||
      (c.processName &&
        c.processName.toLowerCase().includes(search.toLowerCase())) ||
      String(c.pid).includes(search),
  );

  return (
    <div className="p-6 space-y-5 h-full flex flex-col select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
            <Wifi className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Network Monitor & Active Socket Attribution
          </h2>
          <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5 font-mono">
            Active TCP/UDP connections mapped directly to owning PIDs, listening
            ports, and adapter statistics
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-64">
            <GlassInput
              placeholder="Search IP, port, or process..."
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
            onClick={fetchNetworkData}
            loading={loading}
            icon={
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            }
          >
            Refresh
          </GlassButton>
        </div>
      </div>

      {/* Network Adapters Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {interfaces.slice(0, 3).map((iface) => (
          <GlassCard
            key={iface.iface}
            hoverEffect="lift"
            className="p-4 space-y-2"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                {iface.ifaceName || iface.iface}
              </span>
              <GlassBadge variant="info" size="sm">
                {iface.type || "Ethernet"}
              </GlassBadge>
            </div>

            <div className="text-[11px] font-mono text-slate-500 dark:text-white/60 space-y-0.5">
              <div>
                IPv4:{" "}
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                  {iface.ip4 || "N/A"}
                </span>
              </div>
              <div>
                MAC:{" "}
                <span className="text-slate-400 dark:text-white/40">
                  {iface.mac}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono pt-1 text-slate-500 dark:text-white/60 border-t border-black/[0.06] dark:border-white/10">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <ArrowDown className="w-3 h-3" />{" "}
                {formatSpeed(iface.rxSec || 0)}
              </span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                <ArrowUp className="w-3 h-3" /> {formatSpeed(iface.txSec || 0)}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Active Socket Table with Frosted Glass Container */}
      <GlassTableContainer
        className="flex-1"
        header={
          <div className="grid grid-cols-12 text-[11px] font-mono font-semibold text-slate-700 dark:text-white/80 uppercase tracking-wider">
            <div className="col-span-1">Proto</div>
            <div className="col-span-3">Local Address : Port</div>
            <div className="col-span-3">Remote Address : Port</div>
            <div className="col-span-2">State</div>
            <div className="col-span-1">PID</div>
            <div className="col-span-2 text-right">Process Name</div>
          </div>
        }
        footer={
          <div className="flex justify-between items-center text-slate-600 dark:text-white/70">
            <span>Active Connections: {connections.length}</span>
            <span>Filtered: {filtered.length}</span>
          </div>
        }
      >
        <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
          {filtered.map((conn) => (
            <div
              key={conn.id}
              onClick={() => setSelectedConnection(conn)}
              className="grid grid-cols-12 px-4 py-2 items-center hover:bg-blue-500/[0.06] dark:hover:bg-white/[0.05] cursor-pointer transition-colors text-xs font-mono group"
            >
              <div className="col-span-1 text-blue-600 dark:text-blue-400 font-bold">
                {conn.protocol}
              </div>
              <div className="col-span-3 text-slate-900 dark:text-white font-medium">
                {conn.localAddress}:{conn.localPort}
              </div>
              <div className="col-span-3 text-slate-600 dark:text-white/70 truncate">
                {conn.remoteAddress
                  ? `${conn.remoteAddress}:${conn.remotePort}`
                  : "0.0.0.0:0 (Any)"}
              </div>
              <div className="col-span-2">
                <GlassBadge
                  variant={
                    conn.state === "ESTABLISHED"
                      ? "success"
                      : conn.state === "LISTEN"
                        ? "info"
                        : "default"
                  }
                  size="sm"
                  dot={conn.state === "ESTABLISHED"}
                >
                  {conn.state}
                </GlassBadge>
              </div>
              <div className="col-span-1 text-slate-400 dark:text-white/40">
                {conn.pid || "--"}
              </div>
              <div className="col-span-2 text-right text-slate-700 dark:text-white/80 font-medium truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                {conn.processName || "--"}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-white/40 font-mono">
              No matching network connections found
            </div>
          )}
        </div>
      </GlassTableContainer>
    </div>
  );
};
