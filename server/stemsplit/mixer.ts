/**
 * Audio Mixing Utility
 * Uses ffmpeg to mix multiple audio stems with custom volume levels
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

interface StemInput {
  url: string;
  volume: number; // 0-100
  name: string;
}

/**
 * Download a file from URL to a temporary location
 */
async function downloadFile(url: string, filename: string): Promise<string> {
  const tempDir = os.tmpdir();
  const filepath = path.join(tempDir, filename);

  console.log(`[Mixer] Downloading ${filename} from ${url.substring(0, 80)}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${filename}: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await writeFile(filepath, buffer);

  console.log(`[Mixer] Downloaded ${filename} (${buffer.length} bytes)`);
  return filepath;
}

/**
 * Mix multiple audio stems with custom volume levels using ffmpeg
 * Returns path to the mixed audio file
 */
export async function mixStems(stems: StemInput[]): Promise<string> {
  if (stems.length === 0) {
    throw new Error("No stems provided for mixing");
  }

  const tempDir = os.tmpdir();
  const sessionId = randomBytes(8).toString("hex");
  const outputFile = path.join(tempDir, `mix_${sessionId}.mp3`);

  try {
    // Download all stems to temp files
    const downloadedStems: Array<{ filepath: string; volume: number; name: string }> = [];

    for (const stem of stems) {
      if (stem.volume <= 0) {
        console.log(`[Mixer] Skipping ${stem.name} (volume: 0%)`);
        continue; // Skip muted stems
      }

      const filename = `stem_${sessionId}_${stem.name}_${randomBytes(4).toString("hex")}.mp3`;
      const filepath = await downloadFile(stem.url, filename);
      downloadedStems.push({
        filepath,
        volume: stem.volume / 100, // Convert 0-100 to 0-1
        name: stem.name,
      });
    }

    if (downloadedStems.length === 0) {
      throw new Error("All stems are muted - nothing to mix");
    }

    // Build ffmpeg command
    // Example: ffmpeg -i stem1.mp3 -i stem2.mp3 -filter_complex "[0]volume=0.8[a];[1]volume=0.5[b];[a][b]amix=inputs=2:duration=first[out]" -map "[out]" output.mp3
    let filterComplex = "";
    let inputArgs = "";

    // Add input files
    for (let i = 0; i < downloadedStems.length; i++) {
      inputArgs += ` -i "${downloadedStems[i].filepath}"`;
    }

    // Build filter complex for volume adjustment and mixing
    const volumeFilters = downloadedStems
      .map((stem, i) => `[${i}]volume=${stem.volume}[v${i}]`)
      .join(";");

    const mixInputs = downloadedStems.map((_, i) => `[v${i}]`).join("");
    const mixFilter = `${mixInputs}amix=inputs=${downloadedStems.length}:duration=first[out]`;

    filterComplex = `${volumeFilters};${mixFilter}`;

    const command = `/usr/bin/ffmpeg -y ${inputArgs} -filter_complex "${filterComplex}" -map "[out]" -q:a 5 "${outputFile}"`;

    console.log(`[Mixer] Running ffmpeg command with ${downloadedStems.length} stems...`);
    console.log(`[Mixer] Mixing: ${downloadedStems.map((s) => `${s.name}(${Math.round(s.volume * 100)}%)`).join(", ")}`);

    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 5 * 60 * 1000, // 5 minute timeout
    });

    console.log(`[Mixer] ffmpeg output:`, stderr.substring(0, 200));
    console.log(`[Mixer] Mix completed successfully: ${outputFile}`);

    // Cleanup downloaded stem files
    for (const stem of downloadedStems) {
      try {
        await unlink(stem.filepath);
      } catch (e) {
        console.warn(`[Mixer] Failed to cleanup ${stem.filepath}:`, e);
      }
    }

    return outputFile;
  } catch (error) {
    // Cleanup on error
    try {
      await unlink(outputFile);
    } catch (e) {
      // Ignore cleanup errors
    }

    console.error("[Mixer] Error mixing stems:", error);
    throw new Error(`Failed to mix stems: ${(error as Error).message}`);
  }
}

/**
 * Cleanup a temporary file
 */
export async function cleanupFile(filepath: string): Promise<void> {
  try {
    await unlink(filepath);
    console.log(`[Mixer] Cleaned up ${filepath}`);
  } catch (error) {
    console.warn(`[Mixer] Failed to cleanup ${filepath}:`, error);
  }
}
