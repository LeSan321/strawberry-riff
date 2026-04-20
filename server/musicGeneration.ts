/**
 * MiniMax Music 2.5 — Music Generation via Replicate API
 *
 * Replaces ACE-Step. Uses the minimax/music-2.5 model which supports:
 * - Full-length songs with vocals and lyrics
 * - Rich instrumentation from text prompts
 * - Structured lyrics with [Verse], [Chorus], [Bridge] tags
 * - High-quality audio up to 44100 Hz / 256kbps MP3
 */

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

export interface MiniMaxGenerationResult {
  audioUrl: string;  // Temporary Replicate output URL
  mimeType: string;  // "audio/mpeg"
}

/**
 * Start a MiniMax Music 2.5 generation via Replicate.
 * Returns the Replicate prediction ID for async polling.
 * @param prompt - User's music style prompt (kept under 1000 chars)
 * @param lyrics - Song lyrics with optional [Verse], [Chorus] tags
 * @param intensity - Optional intensity level (passed as system guidance, not concatenated)
 * @param refinement - Optional refinement type (passed as system guidance, not concatenated)
 */
export async function startMusicGeneration(
  prompt: string,
  lyrics: string,
  intensity?: string,
  refinement?: string
): Promise<string> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not configured");
  }

  console.log(`[MiniMax] Starting generation: ${prompt.substring(0, 60)}...`);

  // Build system message with intensity and optional refinement guidance
  let systemMessage = "You are a music generation AI. ";
  if (intensity) {
    systemMessage += `Generate music with this intensity level: ${intensity}. `;
  }
  if (refinement) {
    systemMessage += `Apply this refinement: ${refinement}. `;
  }

  const response = await fetch(
    "https://api.replicate.com/v1/models/minimax/music-2.5/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        Prefer: "wait=5",
      },
      body: JSON.stringify({
        input: {
          prompt,
          lyrics,
          system: systemMessage,
          sample_rate: 44100,
          bitrate: 256000,
          audio_format: "mp3",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Replicate API error ${response.status}: ${errorText}`);
  }

  const prediction = (await response.json()) as {
    id: string;
    status: string;
    error?: string;
    output?: string | string[];
  };

  if (prediction.error) {
    throw new Error(`Replicate prediction error: ${prediction.error}`);
  }

  // If the prediction already completed within the wait window, return a special marker
  if (prediction.status === "succeeded" && prediction.output) {
    const outputUrl = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output;
    // Encode the result URL as the "ID" so the caller can detect immediate completion
    return `done:${outputUrl}`;
  }

  console.log(`[MiniMax] Prediction started: ${prediction.id} (status: ${prediction.status})`);
  return prediction.id;
}

/**
 * Poll a Replicate prediction until it completes or fails.
 * Returns the output audio URL when complete.
 */
export async function pollMusicGeneration(
  predictionId: string
): Promise<MiniMaxGenerationResult> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not configured");
  }

  // Handle immediate completions from startMusicGeneration
  if (predictionId.startsWith("done:")) {
    return {
      audioUrl: predictionId.slice(5),
      mimeType: "audio/mpeg",
    };
  }

  const maxAttempts = 120; // 10 minutes max (5s intervals)
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise((res) => setTimeout(res, 5000));
    attempts++;

    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to poll prediction ${predictionId}: ${response.status}`
      );
    }

    const prediction = (await response.json()) as {
      id: string;
      status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
      output?: string | string[];
      error?: string;
    };

    console.log(`[MiniMax] Poll ${attempts}/${maxAttempts}: ${prediction.status}`);

    if (prediction.status === "succeeded") {
      const outputUrl = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output;

      if (!outputUrl) {
        throw new Error("Replicate returned success but no output URL");
      }

      return {
        audioUrl: outputUrl,
        mimeType: "audio/mpeg",
      };
    }

    if (
      prediction.status === "failed" ||
      prediction.status === "canceled"
    ) {
      throw new Error(
        `Generation ${prediction.status}: ${prediction.error || "Unknown error"}`
      );
    }
  }

  throw new Error("Generation timed out after 10 minutes");
}

/**
 * Fetch audio bytes from a URL (downloads from Replicate before uploading to S3)
 */
export async function fetchAudioBytes(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch audio from ${url}: ${response.status} ${response.statusText}`
    );
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Validate music generation parameters
 */
export function validateMusicGenerationParams(
  prompt: string,
  lyrics: string
): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: "Music style prompt is required" };
  }
  if (!lyrics || lyrics.trim().length === 0) {
    return { valid: false, error: "Lyrics are required" };
  }
  if (prompt.length > 1000) {
    return { valid: false, error: "Prompt is too long (max 1000 characters)" };
  }
  if (lyrics.length > 5000) {
    return { valid: false, error: "Lyrics are too long (max 5000 characters)" };
  }
  return { valid: true };
}
