import type {
  ReportConfig,
  GeneratedReport,
  SystemOverview,
  SystemMetricsSnapshot,
  ProcessInfo,
  NetworkConnection,
  SecurityAlert,
  HardwareSummary,
} from "@sentinel/contracts";
import { formatBytes, formatPercentage } from "@sentinel/shared";

export interface ReportDataBundle {
  overview?: SystemOverview;
  metrics?: SystemMetricsSnapshot;
  processes?: ProcessInfo[];
  connections?: NetworkConnection[];
  alerts?: SecurityAlert[];
  hardware?: HardwareSummary;
}

export class ReportGenerator {
  public generate(
    config: ReportConfig,
    data: ReportDataBundle,
  ): GeneratedReport {
    const reportId = `rep-${Date.now()}`;
    const generatedAt = new Date().toISOString();
    let content = "";
    let filename = `Sentinel_Report_${Date.now()}`;

    if (config.format === "json") {
      filename += ".json";
      content = JSON.stringify(
        {
          reportId,
          title: config.title,
          generatedAt,
          config,
          data,
        },
        null,
        2,
      );
    } else if (config.format === "csv") {
      filename += ".csv";
      content = this.generateCsv(config, data);
    } else {
      filename += ".html";
      content = this.generateHtml(config, data, reportId, generatedAt);
    }

    return {
      reportId,
      generatedAt,
      format: config.format,
      filename,
      content,
      sizeBytes: Buffer.byteLength(content, "utf8"),
    };
  }

  private generateCsv(config: ReportConfig, data: ReportDataBundle): string {
    const lines: string[] = [
      `"Report: ${config.title}"`,
      `"Generated: ${new Date().toISOString()}"`,
      "",
    ];

    if (data.processes && data.processes.length > 0) {
      lines.push("--- PROCESS INVENTORY ---");
      lines.push("PID,Name,CPU%,Memory (Bytes),Path,User");
      for (const p of data.processes) {
        lines.push(
          `${p.pid},"${p.name}",${p.cpuPercent},${p.memoryBytes},"${p.executablePath || ""}","${p.user || ""}"`,
        );
      }
      lines.push("");
    }

    if (data.alerts && data.alerts.length > 0) {
      lines.push("--- SECURITY ALERTS ---");
      lines.push("Timestamp,Severity,RuleID,Title,Resource");
      for (const a of data.alerts) {
        lines.push(
          `"${new Date(a.timestamp).toISOString()}",${a.severity},${a.ruleId},"${a.title}","${a.affectedResource}"`,
        );
      }
    }

    return lines.join("\n");
  }

  private generateHtml(
    config: ReportConfig,
    data: ReportDataBundle,
    reportId: string,
    generatedAt: string,
  ): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${config.title} - Sentinel Desktop</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0d14; color: #e2e8f0; margin: 0; padding: 40px; }
    h1, h2 { color: #38bdf8; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .critical { background: #ef4444; color: white; }
    .high { background: #f97316; color: white; }
    .card { background: #131722; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #1e293b; font-size: 13px; }
    th { color: #94a3b8; }
  </style>
</head>
<body>
  <h1>🛡️ ${config.title}</h1>
  <p>Report ID: <code>${reportId}</code> | Generated: <strong>${generatedAt}</strong></p>

  ${
    data.overview
      ? `
  <div class="card">
    <h2>System Overview</h2>
    <p>Host: <strong>${data.overview.hostname}</strong> | OS: <strong>${data.overview.osName} (${data.overview.osRelease})</strong></p>
    <p>CPU: <strong>${data.overview.cpuBrand}</strong> (${data.overview.cpuCores} Cores)</p>
    <p>Total Memory: <strong>${formatBytes(data.overview.totalMemoryBytes)}</strong></p>
  </div>`
      : ""
  }

  ${
    data.alerts && data.alerts.length > 0
      ? `
  <div class="card">
    <h2>Security Findings (${data.alerts.length})</h2>
    <table>
      <tr><th>Severity</th><th>Rule</th><th>Title</th><th>Resource</th></tr>
      ${data.alerts
        .map(
          (a) => `<tr>
        <td><span class="badge ${a.severity.toLowerCase()}">${a.severity}</span></td>
        <td><code>${a.ruleId}</code></td>
        <td>${a.title}</td>
        <td><code>${a.affectedResource}</code></td>
      </tr>`,
        )
        .join("")}
    </table>
  </div>`
      : ""
  }
</body>
</html>`;
  }
}
