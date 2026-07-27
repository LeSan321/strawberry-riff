/**
 * Vocal Pipeline — Platinum Tier
 *
 * Orchestrates the three-step Add Vocals workflow:
 *   1. MiniMax Quick Generate  → vocal track (voice_file + styleAnchor + lyrics)
 *   2. StemSplit               → extract vocal stem from MiniMax output
 *   3. ffmpeg mix              → vocal stem layered onto original fusion instrumental
 *
 * Each step updates the vocalProjects row so the UI can show live progress.
 */

import { startMusicGeneration, pollMusicGeneration, fetchAudioBytes } from "./musicGeneration";
import { startStemSplit, getStemSplitStatus } from "./stemsplit/client";
import { mixStems, cleanupFile } from "./mixer/mixer";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { vocalProjects } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as fs from "fs";

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function updateProject(
  id: number,
  patch: Partial<typeof vocalProjects.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(vocalProjects).set(patch).where(eq(vocalProjects.id, id));
}

// ─── Step 1: MiniMax vocal generation ────────────────────────────────────────

async function generateVocalTrack(
  projectId: number,
  vocalStemUrl: string | null,
  styleAnchor: string,
  lyrics: string
): Promise<string> {
  await updateProject(projectId, { status: "generating_vocal" });

  // Build the style prompt: "{styleAnchor} acapella" — keeps MiniMax focused on
  // vocal performance, lets the lyrics drive arrangement complexity
  const prompt = `${styleAnchor} acapella`;

  const taskId = await startMusicGeneration({
    prompt,
    lyrics,
    voiceReferenceUrl: vocalStemUrl ?? undefined,
    isInstrumental: false,
  });

  await updateProject(projectId, { miniMaxGenerationId: taskId });

  // Poll until complete — returns { audioUrl, mimeType } where audioUrl may be hex/data URL
  const result = await pollMusicGeneration(taskId);

  // If MiniMax returns a data URL or hex, we need to upload to S3 first so StemSplit can access it
  let audioUrl = result.audioUrl;
  if (audioUrl.startsWith("data:") || audioUrl.length > 2000) {
    // Looks like a data URL or raw hex — fetch bytes and upload to S3
    const audioBytes = await fetchAudioBytes(audioUrl);
    const suffix = nanoid(8);
    const key = `vocal-pipeline/minimax-${projectId}-${suffix}.mp3`;
    const { url: s3Url } = await storagePut(key, audioBytes, "audio/mpeg");
    audioUrl = s3Url;
  }

  await updateProject(projectId, { miniMaxAudioUrl: audioUrl });
  return audioUrl;
}

// ─── Step 2: StemSplit vocal extraction ──────────────────────────────────────

const STEMSPLIT_POLL_INTERVAL_MS = 8000;
const STEMSPLIT_MAX_POLLS = 60; // 8 min max

async function extractVocalStem(
  projectId: number,
  miniMaxAudioUrl: string
): Promise<string> {
  await updateProject(projectId, { status: "splitting_stems" });

  const { jobId } = await startStemSplit(miniMaxAudioUrl);
  await updateProject(projectId, { stemSplitJobId: jobId });

  // Poll until complete
  for (let i = 0; i < STEMSPLIT_MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, STEMSPLIT_POLL_INTERVAL_MS));
    const job = await getStemSplitStatus(jobId);

    if (job.status === "COMPLETED") {
      const vocalUrl = job.outputs?.vocals?.url;
      if (!vocalUrl) throw new Error("StemSplit completed but no vocal URL");
      await updateProject(projectId, { extractedVocalUrl: vocalUrl });
      return vocalUrl;
    }

    if (job.status === "FAILED") {
      throw new Error(`StemSplit failed: ${job.errorMessage ?? "unknown error"}`);
    }
    // PENDING / PROCESSING — keep polling
  }

  throw new Error("StemSplit timed out after 8 minutes");
}

// ─── Step 3: Mix vocal stem onto fusion instrumental ─────────────────────────

async function mixVocalOntoFusion(
  projectId: number,
  fusionAudioUrl: string,
  vocalStemUrl: string,
  fusionTitle: string,
  userId: number
): Promise<{ resultAudioUrl: string; resultAudioKey: string }> {
  await updateProject(projectId, { status: "mixing" });

  // Use the mixer module: fusion instrumental as "other" (full mix), vocal as "vocals"
  // We treat the fusion as a single stereo file — pass it as otherUrl
  const outputPath = await mixStems(
    {
      vocalUrl: vocalStemUrl,
      drumsUrl: null,
      bassUrl: null,
      otherUrl: fusionAudioUrl, // the full fusion instrumental
    },
    {
      vocals: 1.0,
      drums: 0,
      bass: 0,
      other: 1.0, // fusion instrumental at full volume
    }
  );

  try {
    // Upload the mixed result to S3
    const fileBuffer = fs.readFileSync(outputPath);
    const suffix = nanoid(8);
    const safeTitle = fusionTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase().slice(0, 40);
    const key = `vocal-projects/${userId}/${safeTitle}-${suffix}.mp3`;
    const { url } = await storagePut(key, fileBuffer, "audio/mpeg");

    await updateProject(projectId, {
      resultAudioUrl: url,
      resultAudioKey: key,
      status: "complete",
      completedAt: new Date(),
    });

    return { resultAudioUrl: url, resultAudioKey: key };
  } finally {
    cleanupFile(outputPath);
  }
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export interface RunVocalPipelineInput {
  projectId: number;
  fusionAudioUrl: string;
  fusionTitle: string;
  vocalStemUrl: string | null;
  styleAnchor: string;
  lyrics: string;
  userId: number;
}

export async function runVocalPipeline(
  input: RunVocalPipelineInput
): Promise<{ resultAudioUrl: string }> {
  const { projectId, fusionAudioUrl, fusionTitle, vocalStemUrl, styleAnchor, lyrics, userId } = input;

  try {
    // Step 1: Generate vocal track with MiniMax
    const miniMaxAudioUrl = await generateVocalTrack(
      projectId,
      vocalStemUrl,
      styleAnchor,
      lyrics
    );

    // Step 2: Extract vocal stem via StemSplit
    const extractedVocalUrl = await extractVocalStem(projectId, miniMaxAudioUrl);

    // Step 3: Mix vocal stem onto fusion instrumental
    const { resultAudioUrl } = await mixVocalOntoFusion(
      projectId,
      fusionAudioUrl,
      extractedVocalUrl,
      fusionTitle,
      userId
    );

    return { resultAudioUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateProject(projectId, {
      status: "failed",
      errorMessage: message,
    });
    throw err;
  }
}
