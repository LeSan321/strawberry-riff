/**
 * MiniMax Music 2.6 — Music Generation via MiniMax Direct API
 *
 * Migrated from Replicate to MiniMax direct for:
 * - Access to Music 2.6 (latest model, Cover Reborn. Bass Redefined.)
 * - Full reference audio support: song_file (style), voice_file (vocal), instrumental_file
 * - Cover Mode: one-step and two-step cover generation
 * - Better pricing and no middleman
 *
 * API Docs: https://platform.minimax.io/docs/guides/music-generation
 */

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_API_BASE = "https://api.minimax.io/v1";

export interface MiniMaxGenerationResult {
  audioUrl: string;
  mimeType: string;
}

export interface MusicGenerationOptions {
  prompt: string;
  lyrics: string;
  /** Optional: URL to a reference song (.wav or .mp3, >15s). MiniMax matches the style/vibe. */
  referenceAudioUrl?: string;
  /** Optional: URL to a voice reference (.wav or .mp3, >15s). MiniMax clones the vocal style. */
  voiceReferenceUrl?: string;
  /** Optional: URL to an instrumental reference (.wav or .mp3, >15s). Generates without vocals. */
  instrumentalReferenceUrl?: string;
}

interface MiniMaxMusicResponse {
  // Legacy fields (old API format)
  task_id?: string;
  audio_file?: { url: string };
  base_resp?: { status_code: number; status_msg: string };
  status?: string;
  file?: { file_id: string; download_url?: string };
  extra_info?: { audio_length?: number; audio_sample_rate?: number; audio_size?: number };
  // New API format (v2): audio URL and status wrapped in data object
  data?: {
    audio?: string;   // Direct audio URL string
    status?: number;  // 0=Preparing, 1=Running, 2=Success, 3=Fail
    task_id?: string;
  };
  trace_id?: string;
}

/**
 * Start a MiniMax Music 2.6 generation via direct API.
 * Returns the task_id for async polling.
 */
export async function startMusicGeneration(
  promptOrOptions: string | MusicGenerationOptions,
  lyricsArg?: string
): Promise<string> {
  if (!MINIMAX_API_KEY) {
    throw new Error("MINIMAX_API_KEY is not configured");
  }

  // Support both legacy (prompt, lyrics) and new options object signatures
  let prompt: string;
  let lyrics: string;
  let referenceAudioUrl: string | undefined;
  let voiceReferenceUrl: string | undefined;
  let instrumentalReferenceUrl: string | undefined;

  if (typeof promptOrOptions === "string") {
    prompt = promptOrOptions;
    lyrics = lyricsArg || "";
  } else {
    prompt = promptOrOptions.prompt;
    lyrics = promptOrOptions.lyrics;
    referenceAudioUrl = promptOrOptions.referenceAudioUrl;
    voiceReferenceUrl = promptOrOptions.voiceReferenceUrl;
    instrumentalReferenceUrl = promptOrOptions.instrumentalReferenceUrl;
  }

  console.log(`[MiniMax 2.6] Starting generation: ${prompt.substring(0, 60)}...`);
  if (referenceAudioUrl) console.log(`[MiniMax 2.6] Using style reference: ${referenceAudioUrl.substring(0, 60)}...`);
  if (voiceReferenceUrl) console.log(`[MiniMax 2.6] Using voice reference`);

  const body: Record<string, unknown> = {
    model: "music-2.6",
    prompt,
    lyrics,
    audio_setting: {
      sample_rate: 44100,
      bitrate: 256000,
      format: "mp3",
    },
    output_format: "url",
  };

  // Attach reference audio if provided
  if (referenceAudioUrl) body.refer_voice = referenceAudioUrl;
  if (voiceReferenceUrl) body.refer_voice = voiceReferenceUrl;
  if (instrumentalReferenceUrl) body.refer_instrumental = instrumentalReferenceUrl;

  const response = await fetch(`${MINIMAX_API_BASE}/music_generation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as MiniMaxMusicResponse;

  if (data.base_resp && data.base_resp.status_code !== 0) {
    throw new Error(`MiniMax API error: ${data.base_resp.status_msg} (code: ${data.base_resp.status_code})`);
  }

  // New API format: audio may be synchronously available in data.audio
  // status 2 = Success in the new numeric format
  if (data.data?.audio && data.data.status === 2) {
    console.log(`[MiniMax 2.6] Synchronous generation complete (new API format)`);
    // Return a special sentinel task_id that signals immediate completion
    return `SYNC:${data.data.audio}`;
  }

  // Async format: get task_id for polling
  const taskId = data.task_id || data.data?.task_id;
  if (!taskId) {
    throw new Error(`MiniMax API did not return a task_id. Response: ${JSON.stringify(data).substring(0, 200)}`);
  }

  console.log(`[MiniMax 2.6] Task started (async): ${taskId}`);
  return taskId;
}

/**
 * Poll a MiniMax music generation task until it completes or fails.
 * Returns the output audio URL when complete.
 */
export async function pollMusicGeneration(
  taskId: string
): Promise<MiniMaxGenerationResult> {
  if (!MINIMAX_API_KEY) {
    throw new Error("MINIMAX_API_KEY is not configured");
  }

  const maxAttempts = 120; // 10 minutes max (5s intervals)
  let attempts = 0;

  // Handle synchronous completion (new API format) — audio URL embedded in task_id sentinel
  if (taskId.startsWith("SYNC:")) {
    const audioUrl = taskId.slice(5);
    console.log(`[MiniMax 2.6] Using synchronous audio URL: ${audioUrl.substring(0, 60)}...`);
    return { audioUrl, mimeType: "audio/mpeg" };
  }

  while (attempts < maxAttempts) {
    await new Promise((res) => setTimeout(res, 5000));
    attempts++;

    const response = await fetch(
      `${MINIMAX_API_BASE}/query/music_generation?task_id=${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${MINIMAX_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to poll task ${taskId}: ${response.status}`);
    }

    const data = (await response.json()) as MiniMaxMusicResponse;

    // New API format: status is numeric inside data object
    const numericStatus = data.data?.status;
    const legacyStatus = data.status;
    const statusLabel = numericStatus !== undefined
      ? ["Preparing", "Running", "Success", "Fail"][numericStatus] ?? `Unknown(${numericStatus})`
      : legacyStatus;

    console.log(`[MiniMax 2.6] Poll ${attempts}/${maxAttempts}: ${statusLabel}`);

    if (data.base_resp && data.base_resp.status_code !== 0) {
      throw new Error(`MiniMax poll error: ${data.base_resp.status_msg}`);
    }

    // Check success: new format (numericStatus === 2) or legacy string ("Success")
    const isSuccess = numericStatus === 2 || legacyStatus === "Success";
    if (isSuccess) {
      // New format: audio URL at data.data.audio; legacy: data.audio_file.url
      const audioUrl = data.data?.audio || data.audio_file?.url;
      if (!audioUrl) {
        throw new Error(`MiniMax returned success but no audio URL. Response: ${JSON.stringify(data).substring(0, 200)}`);
      }
      console.log(`[MiniMax 2.6] Generation complete: ${audioUrl.substring(0, 60)}...`);
      return { audioUrl, mimeType: "audio/mpeg" };
    }

    // Check failure: new format (numericStatus === 3) or legacy string ("Fail")
    const isFailed = numericStatus === 3 || legacyStatus === "Fail";
    if (isFailed) {
      throw new Error(`MiniMax generation failed for task ${taskId}`);
    }

    // Preparing (0) or Running (1) — keep polling
  }

  throw new Error("Generation timed out after 10 minutes");
}

/**
 * Fetch audio bytes from a URL (downloads from MiniMax before uploading to S3)
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
  if (prompt.length > 2000) {
    return { valid: false, error: "Prompt is too long (max 2000 characters)" };
  }
  if (lyrics.length > 5000) {
    return { valid: false, error: "Lyrics are too long (max 5000 characters)" };
  }
  return { valid: true };
}
