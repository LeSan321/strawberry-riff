/**
 * Stable Audio 2.5 — Bespoke Instrumental Generation
 *
 * Wraps the Stability AI audio-to-audio endpoint:
 *   POST https://api.stability.ai/v2beta/audio/stable-audio-2/audio-to-audio
 *
 * This is used for "Bespoke Instrumental" mode where the user selects an
 * instrument from the palette and we generate an instrumental piece that
 * carries the sonic DNA of that instrument.
 *
 * Costs: 20 credits per generation (personal tier: 2,025 credits available)
 * Latency: ~10–15 seconds for a 30-second output
 */

import { ENV } from "./_core/env";
import { storageGet, storagePut } from "./storage";

const STABLE_AUDIO_URL =
  "https://api.stability.ai/v2beta/audio/stable-audio-2/audio-to-audio";

export interface BespokeGenerationOptions {
  /** Text prompt describing the desired music */
  prompt: string;
  /** The instrument sample audio path (e.g. /manus-storage/violin_xxx.mp3) or full URL */
  instrumentAudioPath: string;
  /** Influence strength of the reference audio (0.0–1.0). Default 0.35.
   *  Lower values preserve the instrument's genuine acoustic character.
   *  Higher values allow more prompt-driven arrangement but risk synthetic artifacts.
   *  0.35 was determined via A/B testing to be the sweet spot. */
  strength?: number;
  /** Output duration in seconds (10–190). Default 30. */
  duration?: number;
  /** Output format: "mp3" or "wav". Default "mp3". */
  outputFormat?: "mp3" | "wav";
}

export interface BespokeGenerationResult {
  /** S3 key of the uploaded result */
  key: string;
  /** Playable URL of the generated audio */
  url: string;
  /** Duration in seconds that was requested */
  duration: number;
}

/**
 * Resolve an instrument audio path to fetchable bytes.
 * Handles both /manus-storage/ paths (via Forge presigned URL) and full https:// URLs.
 */
async function fetchInstrumentBytes(audioPath: string): Promise<Buffer> {
  let fetchUrl: string;

  if (audioPath.startsWith("/manus-storage/")) {
    // Resolve via Forge storage API to get a presigned download URL
    const relKey = audioPath.replace(/^\/manus-storage\//, "");
    const { url } = await storageGet(relKey);
    fetchUrl = url;
  } else if (audioPath.startsWith("https://") || audioPath.startsWith("http://")) {
    fetchUrl = audioPath;
  } else {
    throw new Error(`Unsupported instrument audio path format: ${audioPath}`);
  }

  const res = await fetch(fetchUrl);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch instrument audio (${res.status}): ${fetchUrl}`
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate a bespoke instrumental using Stable Audio 2.5 audio-to-audio.
 *
 * Steps:
 * 1. Fetch the instrument sample bytes from S3/Forge
 * 2. POST to Stability AI as multipart form
 * 3. Upload the result audio to S3
 * 4. Return the S3 key and URL
 */
export async function generateBespokeInstrumental(
  options: BespokeGenerationOptions
): Promise<BespokeGenerationResult> {
  const {
    prompt,
    instrumentAudioPath,
    strength = 0.35,
    duration = 30,
    outputFormat = "mp3",
  } = options;

  if (!ENV.stabilityAiApiKey) {
    throw new Error(
      "STABILITY_AI_API_KEY is not configured. Cannot generate bespoke instrumental."
    );
  }

  console.log(
    `[StableAudio] Starting bespoke generation — prompt="${prompt.slice(0, 60)}..." strength=${strength} duration=${duration}s`
  );

  // Step 1: Fetch instrument sample bytes
  const instrumentBytes = await fetchInstrumentBytes(instrumentAudioPath);
  console.log(
    `[StableAudio] Fetched instrument sample: ${instrumentBytes.length} bytes`
  );

  // Step 2: Build multipart form and call Stability AI
  const form = new FormData();
  form.append("prompt", prompt);
  form.append(
    "audio",
    new Blob([new Uint8Array(instrumentBytes)], { type: "audio/mpeg" }),
    "instrument.mp3"
  );
  form.append("strength", String(strength));
  form.append("output_format", outputFormat);
  form.append("duration", String(duration));

  const startTime = Date.now();
  const response = await fetch(STABLE_AUDIO_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.stabilityAiApiKey}`,
      Accept: "audio/*",
    },
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    console.error(
      `[StableAudio] API error (${response.status}): ${errorText}`
    );
    throw new Error(
      `Stable Audio generation failed (${response.status}): ${errorText}`
    );
  }

  const elapsedMs = Date.now() - startTime;
  console.log(`[StableAudio] Generation complete in ${elapsedMs}ms`);

  // Step 3: Upload result to S3
  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const s3Key = `bespoke-generations/${timestamp}-${randomSuffix}.${outputFormat}`;

  const { key, url } = await storagePut(
    s3Key,
    audioBuffer,
    outputFormat === "mp3" ? "audio/mpeg" : "audio/wav"
  );

  console.log(`[StableAudio] Uploaded result → ${url}`);

  return { key, url, duration };
}
