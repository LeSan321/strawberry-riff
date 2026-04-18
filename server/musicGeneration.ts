/**
 * ACE-Step Music Generation Wrapper
 * Handles text-to-music generation via Hugging Face ACE-Step API
 */

import { Client } from "@gradio/client";

interface ACEStepGenerationResult {
  audioUrl: string;
  metadata?: Record<string, unknown>;
  taskId?: string;
}

interface ACEStepPollResult {
  status: "generating" | "complete" | "failed";
  progress?: number;
  audioUrl?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

let aceStepClient: Client | null = null;

async function getACEStepClient(): Promise<Client> {
  if (!aceStepClient) {
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
  try {
    const client = await getACEStepClient();

    console.log(`[ACE-Step] Generating ${duration}s music: ${prompt.substring(0, 50)}...`);

    const result = await client.predict(
      {
        audio_duration: duration,
        prompt: prompt,
        lyrics: lyrics,
        infer_step: 60,
        guidance_scale: 15.0,
        scheduler_type: "euler",
        cfg_type: "apg",
      },
      "/__call__"
    );

    // Parse result: typically [audio_url, metadata]
    const audioUrl = Array.isArray(result) ? result[0] : result;
    const metadata = Array.isArray(result) && result.length > 1 ? result[1] : {};

    console.log(`[ACE-Step] Generation complete: ${audioUrl}`);

    return {
      audioUrl: typeof audioUrl === "string" ? audioUrl : String(audioUrl),
      metadata: metadata as Record<string, unknown>,
    };
  } catch (error) {
    console.error("[ACE-Step] Generation failed:", error);
    throw new Error(`Music generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
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
