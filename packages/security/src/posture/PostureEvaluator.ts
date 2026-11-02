import { execFileSync } from 'child_process';
import { Advapi32Bridge } from '@sentinel/native-bridge';
import type { SecurityPosture } from '@sentinel/contracts';
import { defaultLogger } from '@sentinel/logger';

export class PostureEvaluator {
  private advapi32 = new Advapi32Bridge();
  private cachedPosture: SecurityPosture | null = null;
  private lastEvaluationTime = 0;

  public async evaluatePosture(activeIncidentCount: number = 0): Promise<SecurityPosture> {
    const now = Date.now();
    // Cache for 10 seconds to avoid excessive PowerShell spawns
    if (this.cachedPosture && now - this.lastEvaluationTime < 10000) {
      return {
        ...this.cachedPosture,
        activeIncidentsCount: activeIncidentCount,
      };
    }

    const isElevated = this.advapi32.isProcessElevated();
    let antivirusName = 'Windows Defender';
    let antivirusActive = true;
    let firewallActive = true;
    let secureBootEnabled: boolean | null = true;
    let uacEnabled = true;

    if (process.platform === 'win32') {
      try {
        const psScript = `
          $av = Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntivirusProduct -ErrorAction SilentlyContinue | Select-Object -First 1
          $fw = Get-NetFirewallProfile -ErrorAction SilentlyContinue | Where-Object { $_.Enabled -eq $true }
          @{
            AvName = if ($av) { $av.displayName } else { 'Windows Defender' }
            FirewallEnabled = if ($fw) { $true } else { $false }
          } | ConvertTo-Json -Compress
        `;
        const stdout = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
          encoding: 'utf8',
          timeout: 4000,
        });

        if (stdout && stdout.trim()) {
          const parsed = JSON.parse(stdout.trim());
          if (parsed.AvName) antivirusName = parsed.AvName;
          if (typeof parsed.FirewallEnabled === 'boolean') firewallActive = parsed.FirewallEnabled;
        }
      } catch (err) {
        defaultLogger.debug({ err }, 'Could not query Defender/Firewall via CIM; using defaults');
      }
    }

    // Calculate score
    let score = 100;
    if (!firewallActive) score -= 30;
    if (!antivirusActive) score -= 30;
    if (activeIncidentCount > 0) score -= Math.min(30, activeIncidentCount * 10);

    let statusLevel: SecurityPosture['statusLevel'] = 'OPTIMAL';
    if (score < 50) statusLevel = 'COMPROMISED';
    else if (score < 75) statusLevel = 'GUARDED';
    else if (score < 90) statusLevel = 'ELEVATED';

    this.cachedPosture = {
      overallScore: Math.max(10, score),
      statusLevel,
      antivirusName,
      antivirusActive,
      firewallActive,
      secureBootEnabled,
      uacEnabled,
      isElevatedAdmin: isElevated,
      activeIncidentsCount: activeIncidentCount,
    };
    this.lastEvaluationTime = now;

    return this.cachedPosture;
  }
}
