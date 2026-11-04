import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import type { FimScanResult, FimEntry } from "@sentinel/contracts";
import { defaultLogger } from "@sentinel/logger";

export class FimEngine {
  private baseline: Map<string, { sha256: string; sizeBytes: number }> =
    new Map();

  /**
   * Scans a target directory, calculating SHA-256 for all files
   * and comparing against the recorded baseline
   */
  public async scanDirectory(targetDir: string): Promise<FimScanResult> {
    const timestamp = Date.now();
    const resolvedDir = path.resolve(targetDir);

    if (!fs.existsSync(resolvedDir)) {
      return {
        scannedFiles: 0,
        modifiedCount: 0,
        addedCount: 0,
        deletedCount: 0,
        timestamp,
        directory: resolvedDir,
        entries: [],
      };
    }

    const currentFiles = await this.readDirRecursive(resolvedDir, 2); // Limit depth to 2 for performance
    const entries: FimEntry[] = [];
    let modifiedCount = 0;
    let addedCount = 0;

    for (const filePath of currentFiles) {
      try {
        const stats = await fs.promises.stat(filePath);
        if (!stats.isFile()) continue;

        const hash = await this.computeHash(filePath);
        const prev = this.baseline.get(filePath);

        let status: FimEntry["status"] = "CLEAN";

        if (!prev) {
          if (this.baseline.size > 0) {
            status = "ADDED";
            addedCount++;
          }
          // Store in baseline
          this.baseline.set(filePath, { sha256: hash, sizeBytes: stats.size });
        } else if (prev.sha256 !== hash) {
          status = "MODIFIED";
          modifiedCount++;
        }

        entries.push({
          filePath,
          fileName: path.basename(filePath),
          sha256: hash,
          sizeBytes: stats.size,
          lastModified: stats.mtime.toISOString(),
          status,
          previousSha256: prev?.sha256,
        });
      } catch (err) {
        defaultLogger.debug({ filePath, err }, "FIM could not read file");
      }
    }

    // Check for deleted files
    let deletedCount = 0;
    for (const [baselinePath, baseVal] of this.baseline.entries()) {
      if (
        baselinePath.startsWith(resolvedDir) &&
        !currentFiles.includes(baselinePath)
      ) {
        deletedCount++;
        entries.push({
          filePath: baselinePath,
          fileName: path.basename(baselinePath),
          sha256: baseVal.sha256,
          sizeBytes: baseVal.sizeBytes,
          lastModified: new Date().toISOString(),
          status: "DELETED",
        });
        this.baseline.delete(baselinePath);
      }
    }

    return {
      scannedFiles: entries.length,
      modifiedCount,
      addedCount,
      deletedCount,
      timestamp,
      directory: resolvedDir,
      entries,
    };
  }

  private async readDirRecursive(
    dir: string,
    maxDepth: number,
    currentDepth = 0,
  ): Promise<string[]> {
    if (currentDepth > maxDepth) return [];
    const results: string[] = [];

    try {
      const items = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          const sub = await this.readDirRecursive(
            fullPath,
            maxDepth,
            currentDepth + 1,
          );
          results.push(...sub);
        } else if (item.isFile()) {
          results.push(fullPath);
        }
      }
    } catch {
      // Permission denied or locked directory
    }

    return results;
  }

  private async computeHash(filePath: string): Promise<string> {
    return new Promise((resolve) => {
      const hash = createHash("sha256");
      const stream = fs.createReadStream(filePath);
      stream.on("data", (c) => hash.update(c));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", (err) => {
        stream.destroy();
        defaultLogger.debug({ filePath, err }, "FIM stream read error");
        resolve("");
      });
    });
  }
}
