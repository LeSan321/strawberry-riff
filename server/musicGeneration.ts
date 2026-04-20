/**
 * ACE-Step Music Generation Wrapper
 * Handles text-to-music generation via Hugging Face ACE-Step API
 */

import { Client, FileData } from "@gradio/client";

interface ACEStepGenerationResult {
  audioUrl: string;       // Direct URL to the audio file on HuggingFace
  audioData?: Buffer;     // Raw audio bytes if available via b64
  mimeType: string;
  metadata?: Record<string, unknown>;
}

interface ACEStepPollResult {
  status: "generating" | "complete" | "failed";
  progress?: number;
  audioUrl?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

let aceStepClient: Client | null = null;

async function getACEStepClient(forceReconnect = false): Promise<Client> {
  if (!aceStepClient || forceReconnect) {
    aceStepClient = null; // clear stale connection before reconnecting
    aceStepClient = await Client.connect("ACE-Step/ACE-Step");
  }
  return aceStepClient;
}

/**
 * Generate music using ACE-Step
 * @param prompt Tags/description (e.g., "jazz, noir, 95 BPM, piano, drums")
 * @param lyrics Song lyrics with structure ([verse], [chorus], etc.)
 * @param duration Duration in seconds (60, 120, 240)
 * @returns Generation result with audio URL
 */
export async function generateMusicWithACEStep(
  prompt: string,
  lyrics: string,
  duration: number = 240
): Promise<ACEStepGenerationResult> {
  // Retry up to 2 times on transient errors (rate limits, stale connections)
  for (let attempt = 1; attempt <= 2; attempt++) {
  try {
    const client = await getACEStepClient(attempt > 1);

    console.log(`[ACE-Step] Generating ${duration}s music (attempt ${attempt}): ${prompt.substring(0, 50)}...`);

    const result = await client.predict("/__call__", {
      audio_duration: duration,
      prompt: prompt,
      lyrics: lyrics,
      infer_step: 60,
      guidance_scale: 15.0,
      scheduler_type: "euler",
      cfg_type: "apg",
    });

    // result.data is an array; the first element is a FileData object for the audio output
    const resultData = result.data as unknown[];
    const fileData = resultData[0] as FileData;

    if (!fileData) {
      throw new Error("No audio data returned from ACE-Step");
    }

    console.log(`[ACE-Step] Generation complete. FileData:`, JSON.stringify({
      url: fileData.url,
      path: fileData.path,
      mime_type: fileData.mime_type,
      size: fileData.size,
    }));

    // Determine the audio URL - prefer the direct URL, fall back to path
    const audioUrl = fileData.url || fileData.path;
    if (!audioUrl) {
      throw new Error("ACE-Step returned FileData with no URL or path");
    }

    // If b64 data is available, decode it directly to avoid an extra HTTP fetch
    let audioData: Buffer | undefined;
    const b64 = (fileData as any).b64 as string | undefined;
    if (b64) {
      const base64Content = b64.includes(",") ? b64.split(",")[1] : b64;
      audioData = Buffer.from(base64Content, "base64");
    }

    // Detect MIME type from URL extension when mime_type is null (common with HuggingFace spaces)
    let mimeType = fileData.mime_type;
    if (!mimeType) {
      const urlLower = audioUrl.toLowerCase();
      if (urlLower.includes(".mp3")) {
        mimeType = "audio/mpeg";
      } else if (urlLower.includes(".ogg")) {
        mimeType = "audio/ogg";
      } else if (urlLower.includes(".flac")) {
        mimeType = "audio/flac";
      } else {
        mimeType = "audio/wav"; // safe default
      }
    }
    console.log(`[ACE-Step] Detected MIME type: ${mimeType} for URL: ${audioUrl.substring(0, 80)}...`);

    return {
      audioUrl,
      audioData,
      mimeType,
      metadata: resultData.length > 1 ? (resultData[1] as Record<string, unknown>) : {},
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ACE-Step] Attempt ${attempt} failed:`, msg);
    if (attempt === 2) {
      throw new Error(`Music generation failed: ${msg}`);
    }
    // Wait 3 seconds before retrying
    await new Promise(res => setTimeout(res, 3000));
  }
  } // end retry loop
  // Should never reach here, but TypeScript needs a return
  throw new Error("Music generation failed: unexpected exit from retry loop");
}

/**
 * Poll ACE-Step for generation status
 * Note: ACE-Step HF Space doesn't support task polling via API
 * This is a placeholder for future commercial API support
 */
export async function pollACEStepStatus(taskId: string): Promise<ACEStepPollResult> {
  // For now, return a placeholder
  // In production, this would call the ACE-Step API to check task status
  console.log(`[ACE-Step] Polling task ${taskId}`);

  return {
    status: "complete",
    progress: 100,
  };
}

/**
 * Validate music generation parameters
 */
export function validateMusicGenerationParams(
  prompt: string,
  lyrics: string,
  duration: number
): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: "Prompt is required" };
  }

  if (!lyrics || lyrics.trim().length === 0) {
    return { valid: false, error: "Lyrics are required" };
  }

  if (![60, 120, 240].includes(duration)) {
    return { valid: false, error: "Duration must be 60, 120, or 240 seconds" };
  }

  if (prompt.length > 1000) {
    return { valid: false, error: "Prompt is too long (max 1000 characters)" };
  }

  return { valid: true };
}

/**
 * Fetch audio bytes from a URL (used when b64 data is not available in FileData)
 */
export async function fetchAudioBytes(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio from ${url}: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
