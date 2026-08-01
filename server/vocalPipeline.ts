/**
 * Vocal Pipeline
 *
 * Orchestrates adding AI vocals to an existing instrumental track using MiniMax.
 * The pipeline:
 *   1. Takes an instrumental audio URL + lyrics + vocal settings
 *   2. Builds a vocal-focused prompt using the Vocal Archetypes Bible
 *   3. Submits to MiniMax with the instrumental as reference audio
 *   4. Returns the task_id for async polling (or "SYNC_COMPLETE" for sync completions)
 *
 * This module is stateless — it does not write to the database.
 * The caller (vocalProjects router) manages persistence.
 */

import { startMusicGeneration, pollMusicGeneration, MusicGenerationStart } from "./musicGeneration";
import { buildVocalPrompt, VocalArchetype } from "./vocalArchetypes";
import { mapSpectrumToGuidance } from "./vocalSpectrumMapper";

export interface VocalGenerationInput {
  /** URL to the instrumental track (must be publicly accessible, >15s) */
  instrumentalUrl: string;
  /** Song lyrics to sing */
  lyrics: string;
  /** Vocal archetype from the Vocal Nuances Bible */
  vocalArchetype: VocalArchetype;
  /** Vocal gender preference */
  vocalGender: "male" | "female" | "neutral";
  /** Spectrum slider value 0-100 (maps to archetype-specific nuance) */
  vocalSpectrumValue?: number;
  /** Optional extra style notes from the user */
  styleNotes?: string;
}

export interface VocalGenerationJob {
  /** MiniMax task_id for async polling, or "SYNC_COMPLETE" if audio is already available */
  taskId: string;
  prompt: string;
  /** When MiniMax returns audio synchronously, the buffer is stored here */
  syncBuffer?: Buffer;
  syncMimeType?: string;
}

/**
 * Start a vocal generation job.
 * Returns a VocalGenerationJob — check syncBuffer to see if audio is already available.
 */
export async function startVocalGeneration(
  input: VocalGenerationInput
): Promise<VocalGenerationJob> {
  const {
    instrumentalUrl,
    lyrics,
    vocalArchetype,
    vocalGender,
    vocalSpectrumValue = 50,
    styleNotes,
  } = input;

  // Build the vocal prompt from the Vocal Archetypes Bible
  // buildVocalPrompt(userPrompt, archetype) — userPrompt is the style/gender guidance
  const genderGuide =
    vocalGender !== "neutral" ? `${vocalGender} vocalist` : "vocalist";
  const spectrumGuidance = mapSpectrumToGuidance(vocalArchetype, vocalSpectrumValue);
  const userPromptParts: string[] = [genderGuide];
  if (spectrumGuidance) userPromptParts.push(spectrumGuidance);
  if (styleNotes?.trim()) userPromptParts.push(styleNotes.trim());
  const userPrompt = userPromptParts.join(", ");

  const prompt = buildVocalPrompt(userPrompt, vocalArchetype);

  console.log("[VocalPipeline] Starting vocal generation:", {
    vocalArchetype,
    vocalGender,
    vocalSpectrumValue,
    instrumentalUrl: instrumentalUrl.substring(0, 60) + "...",
    promptPreview: prompt.substring(0, 100) + "...",
  });

  // Submit to MiniMax — use instrumental as reference audio so it matches the track
  const startResult: MusicGenerationStart = await startMusicGeneration({
    prompt,
    lyrics,
    referenceAudioUrl: instrumentalUrl,
  });

  if (startResult.type === "sync") {
    console.log("[VocalPipeline] Synchronous generation complete — buffer received directly");
    return {
      taskId: "SYNC_COMPLETE",
      prompt,
      syncBuffer: startResult.buffer,
      syncMimeType: startResult.mimeType,
    };
  }

  console.log("[VocalPipeline] Job started:", startResult.taskId);
  return { taskId: startResult.taskId, prompt };
}

export interface VocalPollResult {
  status: "pending" | "processing" | "completed" | "failed";
  audioUrl?: string;
  /** When sync, the audio buffer is returned directly instead of a URL */
  syncBuffer?: Buffer;
  errorMessage?: string;
}

/**
 * Poll a vocal generation job for its current status.
 * pollMusicGeneration blocks until completion (or throws on failure/timeout),
 * so this wrapper always returns completed or failed.
 */
export async function pollVocalGeneration(taskId: string): Promise<VocalPollResult> {
  try {
    // pollMusicGeneration polls internally and returns only when done
    const result = await pollMusicGeneration(taskId);
    return { status: "completed", audioUrl: result.audioUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[VocalPipeline] Poll error:", message);
    return { status: "failed", errorMessage: message };
  }
}
