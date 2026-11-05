import React, { useState, useEffect } from "react";
import {
  ScanSearch,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  Layers,
  Binary,
} from "lucide-react";
import type {
  SecurityAuditReport,
  BinaryAnalysisResult,
  HardeningCheck,
  ProcessInfo,
} from "@sentinel/contracts";
import { useAppStore } from "../stores/useAppStore";
import { formatBytes } from "@sentinel/shared";
import {
  GlassBadge,
  GlassButton,
  GlassCard,
  GlassSurface,
  GlassInput,
  GlassTableContainer,
} from "../components/glass";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  subtitle: React.ReactNode;
  valueColorClass?: string;
}

const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  subtitle,
  valueColorClass = "text-text-primary",
}) => (
  <GlassSurface elevation="subtle" rounded="xl" className="p-3.5 space-y-1">
    <div className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">
      {label}
    </div>
    <div className={`text-2xl font-mono font-bold ${valueColorClass}`}>
      {value}
    </div>
    <div className="text-[11px] text-text-secondary font-mono">
      {subtitle}
    </div>
  </GlassSurface>
);

export const SecurityAnalyzerSection: React.FC = () => {
  const { addToast } = useAppStore();
  const [auditReport, setAuditReport] = useState<SecurityAuditReport | null>(
    null,
  );
  const [isAuditing, setIsAuditing] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [analyzedTarget, setAnalyzedTarget] =
    useState<BinaryAnalysisResult | null>(null);
  const [isAnalyzingTarget, setIsAnalyzingTarget] = useState(false);
  const [runningProcesses, setRunningProcesses] = useState<ProcessInfo[]>([]);

  const runFullAudit = async () => {
    if (!window.sentinelAPI) return;
    setIsAuditing(true);
    try {
      const report = await window.sentinelAPI.runSecurityAudit();
      setAuditReport(report);
      addToast({
        type: "success",
        message: `Security audit completed with score ${report.overallAuditScore}/100`,
      });
    } catch {
      addToast({ type: "error", message: "Security audit scan failed" });
    } finally {
      setIsAuditing(false);
    }
  };

  useEffect(() => {
    runFullAudit();
    if (window.sentinelAPI) {
      window.sentinelAPI.listProcesses().then((procs) => {
        setRunningProcesses(procs);
      });
    }
  }, []);

  const handleAnalyzeTarget = async (pathOrName: string) => {
    if (!pathOrName.trim() || !window.sentinelAPI) return;
    setIsAnalyzingTarget(true);
    try {
      // Check if target input matches a running PID
      const maybePid = parseInt(pathOrName.trim(), 10);
      let targetPayload: { filePath?: string; pid?: number } = {};

      if (
        !isNaN(maybePid) &&
        runningProcesses.some((p) => p.pid === maybePid)
      ) {
        targetPayload = { pid: maybePid };
      } else {
        targetPayload = { filePath: pathOrName.trim() };
      }

      const res = await window.sentinelAPI.analyzeBinary(targetPayload);
      setAnalyzedTarget(res);
      addToast({
        type: "info",
        message: `Analyzed ${res.target}: Risk ${res.riskLevel} (${res.riskScore}/100)`,
      });
    } catch {
      addToast({ type: "error", message: "Target forensic analysis failed" });
    } finally {
      setIsAnalyzingTarget(false);
    }
  };

  const getStatusBadge = (status: HardeningCheck["status"]) => {
    switch (status) {
      case "PASS":
        return (
          <GlassBadge variant="success" size="sm" dot>
            PASS
          </GlassBadge>
        );
      case "WARN":
        return (
          <GlassBadge variant="warning" size="sm" dot>
            WARN
          </GlassBadge>
        );
      case "FAIL":
        return (
          <GlassBadge variant="danger" size="sm" dot>
            FAIL
          </GlassBadge>
        );
      default:
        return (
          <GlassBadge variant="default" size="sm">
            UNKNOWN
          </GlassBadge>
        );
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAnalyzeTarget(targetInput);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Audit Score Summary */}
      <GlassCard className="p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-glass-border-subtle pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <ScanSearch className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-text-primary font-mono">
                Host Attack Surface & Risk Analyzer
              </h3>
              {auditReport && (
                <GlassBadge
                  variant={
                    auditReport.statusLevel === "OPTIMAL"
                      ? "success"
                      : auditReport.statusLevel === "ELEVATED"
                        ? "info"
                        : auditReport.statusLevel === "GUARDED"
                          ? "warning"
                          : "danger"
                  }
                  size="sm"
                >
                  {auditReport.statusLevel}
                </GlassBadge>
              )}
            </div>
            <p className="text-xs text-text-secondary font-mono">
              On-demand CIS hardening audits, unquoted service vulnerability
              detection, autostart persistence inspection, and Shannon entropy
              analysis.
            </p>
          </div>

          <GlassButton
            variant="primary"
            size="md"
            onClick={runFullAudit}
            loading={isAuditing}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            {isAuditing ? "Auditing Host..." : "Run Full Host Audit"}
          </GlassButton>
        </div>

        {/* Loading Indicator */}
        {isAuditing && !auditReport && (
          <div className="py-10 flex flex-col items-center justify-center gap-2.5 text-cyan-400">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="text-xs font-mono text-text-secondary">
              Auditing Windows security hardening, services, and autostart
              persistence...
            </span>
          </div>
        )}

        {/* Score & Counters */}
        {auditReport && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
            <StatTile
              label="Audit Posture Score"
              valueColorClass="text-cyan-400"
              value={
                <>
                  {auditReport.overallAuditScore}
                  <span className="text-xs text-text-secondary font-normal">
                    {" "}
                    / 100
                  </span>
                </>
              }
              subtitle={`${auditReport.statusLevel} posture`}
            />

            <StatTile
              label="Hardening Checks"
              valueColorClass="text-emerald-400"
              value={
                <>
                  {
                    auditReport.hardeningChecks.filter((c) => c.status === "PASS")
                      .length
                  }
                  <span className="text-xs text-text-secondary font-normal">
                    {" "}
                    / {auditReport.hardeningChecks.length} Passed
                  </span>
                </>
              }
              subtitle={
                <span className="text-amber-400">
                  {
                    auditReport.hardeningChecks.filter((c) => c.status !== "PASS")
                      .length
                  }{" "}
                  flagged items
                </span>
              }
            />

            <StatTile
              label="Unquoted Services"
              value={auditReport.unquotedServices.length}
              subtitle={
                auditReport.unquotedServices.length === 0 ? (
                  <span className="text-emerald-400">No vulnerable paths</span>
                ) : (
                  <span className="text-amber-400">Binary planting risk</span>
                )
              }
            />

            <StatTile
              label="Persistence Items"
              valueColorClass="text-purple-400"
              value={auditReport.persistenceItems.length}
              subtitle={
                auditReport.persistenceItems.filter(
                  (p) => p.risk === "SUSPICIOUS",
                ).length > 0 ? (
                  <span className="text-red-400">
                    {
                      auditReport.persistenceItems.filter(
                        (p) => p.risk === "SUSPICIOUS",
                      ).length
                    }{" "}
                    Suspicious
                  </span>
                ) : (
                  <span className="text-emerald-400">All baselined clean</span>
                )
              }
            />
          </div>
        )}
      </GlassCard>

      {/* Forensic Binary & Process Target Inspector */}
      <GlassCard className="p-5 space-y-4">
        <div>
          <h4 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Binary className="w-4 h-4 text-cyan-400" />
            Forensic Target Inspector & Shannon Entropy Analyzer
          </h4>
          <p className="text-[11px] text-text-secondary mt-0.5 font-mono">
            Inspect any executable file path or running PID for Authenticode
            certificate trust, section entropy, and crypter/packer indicators.
          </p>
        </div>

        {/* Accessible Form Submission */}
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 relative">
            <GlassInput
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="Enter executable path (e.g. C:\Windows\System32\cmd.exe) or PID..."
              icon={<Search className="w-4 h-4 text-text-tertiary" />}
              aria-label="Target binary path or process ID"
            />
          </div>

          <GlassButton
            type="submit"
            variant="glass"
            size="md"
            loading={isAnalyzingTarget}
            icon={<ScanSearch className="w-4 h-4 text-cyan-400" />}
          >
            Analyze Target
          </GlassButton>
        </form>

        {/* Quick Process Shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-mono text-text-tertiary uppercase mr-1">
            Running Procs:
          </span>
          {runningProcesses.slice(0, 5).map((p) => (
            <button
              key={p.pid}
              type="button"
              onClick={() => {
                setTargetInput(p.executablePath || p.name);
                handleAnalyzeTarget(p.executablePath || p.name);
              }}
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-glass-surface-subtle hover:bg-glass-surface-elevated border border-glass-border-subtle text-text-secondary hover:text-cyan-400 hover:border-glass-border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
            >
              {p.name} ({p.pid})
            </button>
          ))}
        </div>

        {/* Analysis Result Card */}
        {analyzedTarget && (
          <GlassSurface
            elevation="subtle"
            rounded="xl"
            className="p-4 space-y-3 mt-3"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-glass-border-subtle pb-2.5">
              <div>
                <div className="text-xs font-mono font-bold text-text-primary">
                  {analyzedTarget.target}
                </div>
                {analyzedTarget.sha256 && (
                  <div className="text-[10px] font-mono text-text-tertiary break-all">
                    SHA-256: {analyzedTarget.sha256}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <GlassBadge
                  variant={
                    analyzedTarget.riskLevel === "CRITICAL"
                      ? "danger"
                      : analyzedTarget.riskLevel === "HIGH"
                        ? "warning"
                        : analyzedTarget.riskLevel === "MEDIUM"
                          ? "cyan"
                          : "success"
                  }
                  size="sm"
                  dot
                >
                  {analyzedTarget.riskLevel} RISK ({analyzedTarget.riskScore}
                  /100)
                </GlassBadge>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
              <div>
                <div className="text-[10px] text-text-tertiary uppercase">
                  Shannon Entropy
                </div>
                <div className="font-semibold text-cyan-400 flex items-center gap-1.5 mt-0.5">
                  {analyzedTarget.entropy} / 8.0
                  {analyzedTarget.isPacked && (
                    <GlassBadge variant="danger" size="sm">
                      PACKED
                    </GlassBadge>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-text-tertiary uppercase">
                  Digital Signature
                </div>
                <div className="font-semibold text-text-primary flex items-center gap-1.5 mt-0.5">
                  {analyzedTarget.authenticodeStatus === "SIGNED_VERIFIED" ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> Unsigned
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-text-tertiary uppercase">
                  Certificate Signer
                </div>
                <div className="text-[11px] text-text-secondary truncate mt-0.5">
                  {analyzedTarget.signer || "No publisher"}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-text-tertiary uppercase">
                  Binary File Size
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  {formatBytes(analyzedTarget.sizeBytes)}
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            {analyzedTarget.riskFactors.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-glass-border-subtle">
                <div className="text-[10px] font-mono uppercase text-amber-400 font-semibold">
                  Detected Risk Indicators:
                </div>
                <div className="space-y-1">
                  {analyzedTarget.riskFactors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-mono text-text-secondary flex items-center gap-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassSurface>
        )}
      </GlassCard>

      {/* Hardening Checklist & Attack Surface Vulnerabilities */}
      <div className="grid grid-cols-12 gap-6">
        {/* CIS Hardening Checks */}
        <GlassCard className="col-span-12 lg:col-span-7 p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-glass-border-subtle pb-2.5">
            <h4 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              CIS Host Hardening & OS Protection Audit
            </h4>
            <span className="text-[10px] font-mono text-text-tertiary">
              {auditReport?.hardeningChecks.length || 0} checks
            </span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {auditReport?.hardeningChecks.map((check) => (
              <GlassSurface
                key={check.id}
                elevation="subtle"
                rounded="xl"
                className="p-3 space-y-1.5 text-xs font-mono"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-text-primary">
                    {check.title}
                  </span>
                  {getStatusBadge(check.status)}
                </div>
                <div className="text-[11px] text-text-secondary">
                  {check.details}
                </div>
                {check.status !== "PASS" && (
                  <div className="text-[10px] text-amber-400/90 pt-1 border-t border-glass-border-subtle">
                    Mitigation: {check.recommendation}
                  </div>
                )}
              </GlassSurface>
            ))}
          </div>
        </GlassCard>

        {/* Exposed Ports & Unquoted Services */}
        <GlassCard className="col-span-12 lg:col-span-5 p-5 space-y-4">
          <div>
            <h4 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Attack Surface Vulnerabilities
            </h4>
            <div className="text-[11px] text-text-secondary mt-0.5 font-mono">
              Unquoted service binaries & exposed high-risk listeners
            </div>
          </div>

          {/* Unquoted Services */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono font-semibold text-text-primary flex justify-between">
              <span>Unquoted Service Paths (CWE-428):</span>
              <span className="text-cyan-400">
                {auditReport?.unquotedServices?.length || 0}
              </span>
            </div>

            {(auditReport?.unquotedServices?.length ?? 0) === 0 ? (
              <GlassSurface
                elevation="subtle"
                rounded="xl"
                className="p-3 text-xs font-mono text-emerald-400 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                All service binary paths are properly quoted.
              </GlassSurface>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {auditReport?.unquotedServices?.map((svc) => (
                  <GlassSurface
                    key={svc.serviceName}
                    elevation="subtle"
                    rounded="xl"
                    className="p-2.5 text-xs font-mono space-y-1 border-amber-500/20"
                  >
                    <div className="font-bold text-amber-400">
                      {svc.displayName}
                    </div>
                    <div className="text-[10px] text-text-secondary truncate">
                      {svc.binPath}
                    </div>
                  </GlassSurface>
                ))}
              </div>
            )}
          </div>

          {/* Exposed External Ports */}
          <div className="space-y-2 pt-2 border-t border-glass-border-subtle">
            <div className="text-[11px] font-mono font-semibold text-text-primary flex justify-between">
              <span>Exposed External Listening Ports:</span>
              <span className="text-cyan-400">
                {auditReport?.exposedPorts?.length || 0}
              </span>
            </div>

            {(auditReport?.exposedPorts?.length ?? 0) === 0 ? (
              <GlassSurface
                elevation="subtle"
                rounded="xl"
                className="p-3 text-xs font-mono text-emerald-400 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                No administrative ports exposed on 0.0.0.0.
              </GlassSurface>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {auditReport?.exposedPorts?.map((port) => (
                  <GlassSurface
                    key={`${port.port}-${port.protocol}`}
                    elevation="subtle"
                    rounded="xl"
                    className="p-2.5 text-xs font-mono flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-text-primary">
                        :{port.port}
                      </span>{" "}
                      <span className="text-[10px] text-text-secondary">
                        ({port.serviceName})
                      </span>
                      <div className="text-[10px] text-text-tertiary">
                        PID {port.pid} ({port.processName})
                      </div>
                    </div>
                    <GlassBadge
                      variant={port.risk === "CRITICAL" ? "danger" : "warning"}
                      size="sm"
                    >
                      {port.risk}
                    </GlassBadge>
                  </GlassSurface>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Autostart Persistence Mechanisms Hunter */}
      <GlassCard className="p-5 space-y-3">
        <div className="flex justify-between items-center border-b border-glass-border-subtle pb-2.5">
          <div>
            <h4 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Windows Autostart & Persistence Mechanisms (
              {auditReport?.persistenceItems.length || 0})
            </h4>
            <div className="text-[11px] text-text-secondary mt-0.5 font-mono">
              Enumerates Registry Run/RunOnce keys and Startup directories to
              detect stealth autostart persistence.
            </div>
          </div>
        </div>

        <GlassTableContainer className="max-h-72 overflow-y-auto">
          {(!auditReport?.persistenceItems || auditReport.persistenceItems.length === 0) ? (
            <div className="p-6 text-center text-xs font-mono text-text-secondary flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              No unmanaged or suspicious persistence mechanisms discovered.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-glass-border-subtle text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                  <th className="p-3">Name</th>
                  <th className="p-3">Source Location</th>
                  <th className="p-3">Target Binary</th>
                  <th className="p-3">Authenticode Signer</th>
                  <th className="p-3 text-right">Risk Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border-subtle">
                {auditReport.persistenceItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-cyan-500/[0.08] transition-colors cursor-pointer"
                    onClick={() => {
                      setTargetInput(item.targetPath);
                      handleAnalyzeTarget(item.targetPath);
                    }}
                  >
                    <td className="p-3 font-semibold text-text-primary">
                      {item.name}
                    </td>
                    <td className="p-3 text-[11px] text-text-secondary">
                      <GlassBadge variant="default" size="sm">
                        {item.source}
                      </GlassBadge>
                    </td>
                    <td
                      className="p-3 text-[11px] text-text-secondary max-w-xs truncate"
                      title={item.targetPath}
                    >
                      {item.targetPath}
                    </td>
                    <td className="p-3 text-[11px]">
                      {item.isSigned ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <Lock className="w-3 h-3" />{" "}
                          {item.publisher || "Verified Signer"}
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1 font-medium">
                          <Unlock className="w-3 h-3" /> Unsigned
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <GlassBadge
                        variant={
                          item.risk === "SUSPICIOUS"
                            ? "danger"
                            : item.risk === "UNVERIFIED"
                              ? "warning"
                              : "success"
                        }
                        size="sm"
                      >
                        {item.risk}
                      </GlassBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GlassTableContainer>
      </GlassCard>
    </div>
  );
};
