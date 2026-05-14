/**
 * Isolated Stem Mixer Utility
 * Mixes individual stem audio files with custom volume levels using ffmpeg.
 * This module is COMPLETELY ISOLATED from server/stemsplit/ — it only receives
 * stem URLs and volume levels as input, and returns a mixed audio buffer.
 * It has no knowledge of StemSplit jobs, webhooks, or database records.
 */

import Ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as https from "https";
import * as http from "http";

// Resolve ffmpeg binary path:
// 1. FFMPEG_BIN env var (set on Railway or any custom deployment)
// 2. Common system paths (Railway Nixpacks installs to /usr/bin/ffmpeg)
// 3. ffmpeg-static fallback (may not work on all platforms)
function resolveFfmpegPath(): string {
  if (process.env.FFMPEG_BIN) return process.env.FFMPEG_BIN;
  const systemPaths = ["/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/opt/homebrew/bin/ffmpeg"];
  for (const p of systemPaths) {
    if (fs.existsSync(p)) return p;
  }
  // Last resort: try ffmpeg-static (may be null if binary not downloaded)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegStatic = require("ffmpeg-static") as string | null;
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) return ffmpegStatic;
  } catch {}
  throw new Error(
    "ffmpeg binary not found. Set FFMPEG_BIN environment variable to the ffmpeg binary path, " +
    "or ensure ffmpeg is installed on the system (e.g. apt install ffmpeg)."
  );
}

// Lazy path resolution - only called when mixStems() is invoked, not at module load
let ffmpegPathResolved: string | null = null;
function getFfmpegPath(): string {
  if (!ffmpegPathResolved) {
    ffmpegPathResolved = resolveFfmpegPath();
    Ffmpeg.setFfmpegPath(ffmpegPathResolved);
  }
  return ffmpegPathResolved;
}

export interface StemVolumes {
  vocals: number;   // 0.0 – 2.0 (1.0 = original volume)
  drums: number;
  bass: number;
  other: number;
  piano?: number;
}

export interface StemUrls {
  vocalUrl: string | null;
  drumsUrl: string | null;
  bassUrl: string | null;
  otherUrl: string | null;
  pianoUrl?: string | null;
}

/**
 * Download a file from a URL to a local temp path.
 */
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const protocol = url.startsWith("https") ? https : http;
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlink(destPath, () => {});
        return downloadFile(response.headers.location!, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
      }
      response.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
      file.on("error", (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }).on("error", (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

/**
 * Mix stem audio files with custom volume levels.
 * Returns the path to the mixed output file (caller must delete it after use).
 */
export async function mixStems(
  stems: StemUrls,
  volumes: StemVolumes
): Promise<string> {
  // Resolve ffmpeg path lazily - throws only when actually needed
  getFfmpegPath();

  const tmpDir = os.tmpdir();
  const sessionId = `mix-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tempFiles: string[] = [];
  const outputPath = path.join(tmpDir, `${sessionId}-output.mp3`);

  try {
    // Build list of active stems (non-null URL + non-zero volume)
    const activeStemDefs: { url: string; volume: number; label: string }[] = [];

    if (stems.vocalUrl && volumes.vocals > 0) {
      activeStemDefs.push({ url: stems.vocalUrl, volume: volumes.vocals, label: "vocals" });
    }
    if (stems.drumsUrl && volumes.drums > 0) {
      activeStemDefs.push({ url: stems.drumsUrl, volume: volumes.drums, label: "drums" });
    }
    if (stems.bassUrl && volumes.bass > 0) {
      activeStemDefs.push({ url: stems.bassUrl, volume: volumes.bass, label: "bass" });
    }
    if (stems.otherUrl && volumes.other > 0) {
      activeStemDefs.push({ url: stems.otherUrl, volume: volumes.other, label: "other" });
    }
    if (stems.pianoUrl && (volumes.piano ?? 1) > 0) {
      activeStemDefs.push({ url: stems.pianoUrl, volume: volumes.piano ?? 1, label: "piano" });
    }

    if (activeStemDefs.length === 0) {
      throw new Error("No active stems to mix — all volumes are zero or URLs are missing");
    }

    // Download each active stem to a temp file
    const downloadedPaths: { filePath: string; volume: number }[] = [];
    for (const def of activeStemDefs) {
      const tmpFile = path.join(tmpDir, `${sessionId}-${def.label}.mp3`);
      tempFiles.push(tmpFile);
      await downloadFile(def.url, tmpFile);
      downloadedPaths.push({ filePath: tmpFile, volume: def.volume });
    }

    // Build ffmpeg command to mix all stems with volume adjustments
    await new Promise<void>((resolve, reject) => {
      const cmd = Ffmpeg();

      // Add each stem as an input
      for (const { filePath } of downloadedPaths) {
        cmd.input(filePath);
      }

      // Build amix filter with volume adjustments
      // Each input gets a volume filter, then all are mixed together
      const filterParts: string[] = [];
      const mixInputs: string[] = [];

      downloadedPaths.forEach(({ volume }, i) => {
        filterParts.push(`[${i}:a]volume=${volume.toFixed(3)}[a${i}]`);
        mixInputs.push(`[a${i}]`);
      });

      const mixFilter = `${mixInputs.join("")}amix=inputs=${downloadedPaths.length}:normalize=0[out]`;
      filterParts.push(mixFilter);

      cmd
        .complexFilter(filterParts.join(";"), "out")
        .audioCodec("libmp3lame")
        .audioBitrate("320k")
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(new Error(`ffmpeg error: ${err.message}`)))
        .run();
    });

    return outputPath;
  } finally {
    // Clean up downloaded temp files (not the output — caller handles that)
    for (const f of tempFiles) {
      try { fs.unlinkSync(f); } catch {}
    }
  }
}

/**
 * Delete a temp file after it has been uploaded or sent.
 */
export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Best-effort cleanup
  }
}
