import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import { createReadStream, existsSync } from 'fs';
import { defaultLogger } from '@sentinel/logger';
import type { ProcessSignatureStatusEnum } from '@sentinel/contracts';

export interface SignatureResult {
  status: 'VALID' | 'INVALID' | 'UNSIGNED' | 'UNCHECKED' | 'SELF_SIGNED';
  signer?: string | null;
}

export class AuthenticodeVerifier {
  private signatureCache: Map<string, SignatureResult> = new Map();
  private hashCache: Map<string, string> = new Map();

  /**
   * Verifies the Authenticode signature of an executable file on Windows
   */
  public verifySignature(filePath: string): SignatureResult {
    if (!filePath || !existsSync(filePath)) {
      return { status: 'UNCHECKED' };
    }

    if (this.signatureCache.has(filePath)) {
      return this.signatureCache.get(filePath)!;
    }

    if (process.platform !== 'win32') {
      const res: SignatureResult = { status: 'UNCHECKED' };
      this.signatureCache.set(filePath, res);
      return res;
    }

    try {
      // Escape single quotes for PowerShell
      const safePath = filePath.replace(/'/g, "''");
      const psCommand = `
        $sig = Get-AuthenticodeSignature -FilePath '${safePath}'
        $signer = if ($sig.SignerCertificate) { $sig.SignerCertificate.Subject } else { '' }
        @{ Status = $sig.Status.ToString(); Signer = $signer } | ConvertTo-Json -Compress
      `;

      const stdout = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psCommand], {
        encoding: 'utf8',
        timeout: 4000,
      });

      if (!stdout || !stdout.trim()) {
        const res: SignatureResult = { status: 'UNSIGNED' };
        this.signatureCache.set(filePath, res);
        return res;
      }

      const parsed = JSON.parse(stdout.trim());
      let status: SignatureResult['status'] = 'UNSIGNED';

      if (parsed.Status === 'Valid') {
        status = 'VALID';
      } else if (parsed.Status === 'NotSigned') {
        status = 'UNSIGNED';
      } else if (parsed.Status === 'HashMismatch' || parsed.Status === 'SecurityError') {
        status = 'INVALID';
      }

      // Extract CN from Subject if present
      let signer = parsed.Signer || null;
      if (signer && signer.includes('CN=')) {
        const match = signer.match(/CN=([^,]+)/);
        if (match && match[1]) {
          signer = match[1].trim();
        }
      }

      const result: SignatureResult = { status, signer };
      this.signatureCache.set(filePath, result);
      return result;
    } catch (err) {
      defaultLogger.debug({ filePath, err }, 'Failed to verify Authenticode signature');
      const res: SignatureResult = { status: 'UNCHECKED' };
      this.signatureCache.set(filePath, res);
      return res;
    }
  }

  /**
   * Computes SHA-256 hash of a file
   */
  public async computeFileSha256(filePath: string): Promise<string | null> {
    if (!filePath || !existsSync(filePath)) return null;

    if (this.hashCache.has(filePath)) {
      return this.hashCache.get(filePath)!;
    }

    return new Promise((resolve) => {
      try {
        const hash = createHash('sha256');
        const stream = createReadStream(filePath);

        stream.on('data', (chunk: Buffer | string) => hash.update(chunk));
        stream.on('end', () => {
          const digest = hash.digest('hex');
          this.hashCache.set(filePath, digest);
          resolve(digest);
        });
        stream.on('error', () => resolve(null));
      } catch {
        resolve(null);
      }
    });
  }
}
