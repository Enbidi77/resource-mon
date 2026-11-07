import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  FileCheck,
  RefreshCw,
  CheckCircle2,
  ScanSearch,
} from "lucide-react";
import type {
  SecurityPosture,
  SecurityAlert,
  FimScanResult,
} from "@sentinel/contracts";
import { useAppStore } from "../stores/useAppStore";
import { ArcGauge } from "../components/common/ArcGauge";
import { formatTimestamp } from "@sentinel/shared";
import {
  GlassBadge,
  GlassButton,
  GlassCard,
  GlassSurface,
  GlassTabs,
  GlassTabPanel,
  PageLoadingSkeleton,
  type GlassTabItem,
} from "../components/glass";
import { SecurityAnalyzerSection } from "./SecurityAnalyzerSection";
import { ErrorBoundary } from "../components/common/ErrorBoundary";

type SecurityTab = "overview" | "analyzer";

export const SecurityPage: React.FC = () => {
  const { setSelectedAlert, addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<SecurityTab>("overview");
  const [posture, setPosture] = useState<SecurityPosture | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [fimResult, setFimResult] = useState<FimScanResult | null>(null);
  const [isScanningFim, setIsScanningFim] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSecurityData = async () => {
    if (!window.sentinelAPI) return;
    setLoading(true);
    try {
      const [pos, alts] = await Promise.all([
        window.sentinelAPI.getSecurityPosture(),
        window.sentinelAPI.getSecurityAlerts(),
      ]);
      setPosture(pos);
      setAlerts(alts);
    } catch {
      addToast({
        type: "error",
        message: "Failed to retrieve security status",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleRunFim = async () => {
    if (!window.sentinelAPI) return;
    setIsScanningFim(true);
    try {
      const res = await window.sentinelAPI.runFimScan();
      setFimResult(res);
      addToast({
        type: "success",
        message: `FIM scan completed: ${res.scannedFiles} files checked`,
      });
    } catch {
      addToast({ type: "error", message: "File integrity scan failed" });
    } finally {
      setIsScanningFim(false);
    }
  };

  const tabs: GlassTabItem<SecurityTab>[] = [
    {
      id: "overview",
      label: "Host Posture & Guards",
      icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
      badge: alerts.length > 0 ? alerts.length : undefined,
      badgeVariant: "danger",
    },
    {
      id: "analyzer",
      label: "Security Analyzer",
      icon: <ScanSearch className="w-4 h-4 text-cyan-400" />,
      badge: "Audit",
      badgeVariant: "cyan",
    },
  ];

  if (loading && !posture) {
    return <PageLoadingSkeleton page="security" />;
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary font-mono flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Host Defensive Security Center
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Defensive posture assessment, process anomaly detection, and deep
            attack surface inspection
          </p>
        </div>

        <GlassButton
          variant="glass"
          size="sm"
          onClick={fetchSecurityData}
          loading={loading}
          icon={<RefreshCw className="w-3.5 h-3.5 text-red-400" />}
        >
          Refresh Posture
        </GlassButton>
      </div>

      {/* Shared Apple Glass Tabs */}
      <GlassTabs
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
        variant="glass"
        size="md"
      >
        {/* Tab 1: Overview Panel */}
        <GlassTabPanel
          value="overview"
          activeValue={activeTab}
          className="space-y-6"
        >
          {/* Row 1: Posture Gauges & Controls */}
          <div className="grid grid-cols-12 gap-6">
            {/* Posture Score */}
            <GlassCard className="col-span-12 lg:col-span-4 p-5 flex flex-col justify-between items-center text-center">
              <div className="w-full text-left text-xs font-mono font-bold text-text-primary uppercase tracking-wider mb-2">
                Host Defensive Posture
              </div>

              <ArcGauge
                value={posture ? posture.overallScore : 95}
                title="Posture Score"
                subtitle={`Status: ${posture ? posture.statusLevel : "OPTIMAL"}`}
                size={220}
              />

              <div className="w-full text-xs font-mono text-text-secondary pt-3 border-t border-glass-border-subtle flex justify-between items-center">
                <span>Privilege Elevation:</span>
                <GlassBadge
                  variant={posture?.isElevatedAdmin ? "success" : "default"}
                  size="sm"
                  dot
                >
                  {posture?.isElevatedAdmin ? "ADMIN" : "USER"}
                </GlassBadge>
              </div>
            </GlassCard>

            {/* Protection Services Status */}
            <GlassCard className="col-span-12 lg:col-span-8 p-5 space-y-3">
              <div className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider border-b border-glass-border-subtle pb-2">
                Host Security Control Subsystems
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <GlassSurface
                  elevation="subtle"
                  rounded="xl"
                  className="p-3 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-text-primary font-mono">
                      Antivirus Engine
                    </div>
                    <div className="text-[11px] text-text-secondary font-mono">
                      {posture?.antivirusName || "Windows Defender"}
                    </div>
                  </div>
                  <GlassBadge
                    variant={posture?.antivirusActive ? "success" : "danger"}
                    size="sm"
                    dot
                  >
                    {posture?.antivirusActive ? "ACTIVE" : "DISABLED"}
                  </GlassBadge>
                </GlassSurface>

                <GlassSurface
                  elevation="subtle"
                  rounded="xl"
                  className="p-3 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-text-primary font-mono">
                      Host Firewall
                    </div>
                    <div className="text-[11px] text-text-secondary font-mono">
                      Profile Enforcement
                    </div>
                  </div>
                  <GlassBadge
                    variant={posture?.firewallActive ? "success" : "danger"}
                    size="sm"
                    dot
                  >
                    {posture?.firewallActive ? "ACTIVE" : "DISABLED"}
                  </GlassBadge>
                </GlassSurface>

                <GlassSurface
                  elevation="subtle"
                  rounded="xl"
                  className="p-3 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-text-primary font-mono">
                      Secure Boot
                    </div>
                    <div className="text-[11px] text-text-secondary font-mono">
                      UEFI Firmware State
                    </div>
                  </div>
                  <GlassBadge
                    variant={posture?.secureBootEnabled ? "success" : "warning"}
                    size="sm"
                    dot
                  >
                    {posture?.secureBootEnabled ? "ENABLED" : "UNVERIFIED"}
                  </GlassBadge>
                </GlassSurface>

                <GlassSurface
                  elevation="subtle"
                  rounded="xl"
                  className="p-3 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-text-primary font-mono">
                      User Account Control
                    </div>
                    <div className="text-[11px] text-text-secondary font-mono">
                      Elevation Guard
                    </div>
                  </div>
                  <GlassBadge
                    variant={posture?.uacEnabled ? "success" : "danger"}
                    size="sm"
                    dot
                  >
                    {posture?.uacEnabled ? "ENFORCED" : "OFF"}
                  </GlassBadge>
                </GlassSurface>
              </div>
            </GlassCard>
          </div>

          {/* Row 2: File Integrity Monitoring (FIM) */}
          <GlassCard className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-glass-border-subtle pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-cyan-400" />
                  File Integrity Monitoring (FIM)
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Monitors critical Windows driver and hosts file configurations
                  for unauthorized tampering
                </p>
              </div>

              <GlassButton
                variant="glass"
                size="sm"
                onClick={handleRunFim}
                loading={isScanningFim}
                icon={<RefreshCw className="w-3 h-3 text-cyan-400" />}
              >
                Scan Protected Paths
              </GlassButton>
            </div>

            {fimResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <GlassSurface
                    elevation="subtle"
                    rounded="xl"
                    className="p-3 text-center"
                  >
                    <div className="text-lg font-mono font-bold text-text-primary">
                      {fimResult.scannedFiles}
                    </div>
                    <div className="text-[10px] text-text-secondary uppercase">
                      Files Scanned
                    </div>
                  </GlassSurface>
                  <GlassSurface
                    elevation="subtle"
                    rounded="xl"
                    className="p-3 text-center"
                  >
                    <div className="text-lg font-mono font-bold text-amber-400">
                      {fimResult.modifiedCount}
                    </div>
                    <div className="text-[10px] text-text-secondary uppercase">
                      Modified
                    </div>
                  </GlassSurface>
                  <GlassSurface
                    elevation="subtle"
                    rounded="xl"
                    className="p-3 text-center"
                  >
                    <div className="text-lg font-mono font-bold text-emerald-400">
                      {fimResult.addedCount}
                    </div>
                    <div className="text-[10px] text-text-secondary uppercase">
                      Added
                    </div>
                  </GlassSurface>
                  <GlassSurface
                    elevation="subtle"
                    rounded="xl"
                    className="p-3 text-center"
                  >
                    <div className="text-lg font-mono font-bold text-red-400">
                      {fimResult.deletedCount}
                    </div>
                    <div className="text-[10px] text-text-secondary uppercase">
                      Deleted
                    </div>
                  </GlassSurface>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {fimResult.entries.map((entry) => (
                    <GlassSurface
                      key={entry.filePath}
                      elevation="subtle"
                      rounded="xl"
                      className="p-2.5 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        {entry.status === "CLEAN" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="text-text-primary">
                          {entry.fileName}
                        </span>
                      </div>
                      <GlassBadge
                        variant={
                          entry.status === "CLEAN" ? "success" : "warning"
                        }
                        size="sm"
                      >
                        {entry.status}
                      </GlassBadge>
                    </GlassSurface>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Row 3: Security Alerts & Incidents */}
          <GlassCard className="p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-glass-border-subtle pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  Active Security Incidents & Anomaly Detections (
                  {alerts.length})
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              {alerts.length === 0 && (
                <div className="text-center py-6 text-xs text-text-secondary font-mono">
                  No active security threats or anomalies detected.
                </div>
              )}

              {alerts.map((alert) => (
                <GlassSurface
                  key={alert.id}
                  elevation="subtle"
                  rounded="xl"
                  onClick={() => setSelectedAlert(alert)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:border-red-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <GlassBadge
                      variant={
                        alert.severity === "CRITICAL"
                          ? "danger"
                          : alert.severity === "HIGH"
                            ? "warning"
                            : "info"
                      }
                      size="sm"
                    >
                      {alert.severity}
                    </GlassBadge>

                    <div>
                      <div className="text-xs font-bold text-text-primary font-mono">
                        {alert.title}
                      </div>
                      <div className="text-[11px] text-text-secondary">
                        {alert.description}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] font-mono text-text-tertiary">
                    <div>{formatTimestamp(alert.timestamp)}</div>
                    <div className="text-text-secondary text-[10px]">
                      {alert.ruleId}
                    </div>
                  </div>
                </GlassSurface>
              ))}
            </div>
          </GlassCard>
        </GlassTabPanel>

        {/* Tab 2: Security Analyzer Panel */}
        <GlassTabPanel value="analyzer" activeValue={activeTab}>
          <ErrorBoundary fallbackTitle="Security Analyzer Exception">
            <SecurityAnalyzerSection />
          </ErrorBoundary>
        </GlassTabPanel>
      </GlassTabs>
    </div>
  );
};
