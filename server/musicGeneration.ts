/**
 * MiniMax Music Generation — Music 2.6 production path with controlled Music 3.0 calibration support
 *
 * Migrated from Replicate to MiniMax direct for:
 * - Access to Music 2.6 (latest model, Cover Reborn. Bass Redefined.)
 * - Full reference audio support: song_file (style), voice_file (vocal), instrumental_file
 * - Cover Mode: one-step and two-step cover generation
 * - Better pricing and no middleman
 *
 * API Docs: https://platform.minimax.io/docs/guides/music-generation
 */

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY2 || process.env.MINIMAX_API_KEY;
const MINIMAX_API_BASE = "https://api.minimax.io/v1";

export interface MiniMaxGenerationResult {
  audioUrl: string;
  mimeType: string;
}

/**
 * Discriminated union returned by startMusicGeneration.
 * - { type: "sync", buffer } — audio was returned synchronously as hex; no polling needed.
 * - { type: "async", taskId } — generation is running; call pollMusicGeneration(taskId).
 */
export type MusicGenerationStart =
  | { type: "sync"; buffer: Buffer; mimeType: "audio/mpeg" }
  | { type: "async"; taskId: string };

export interface MusicGenerationOptions {
  prompt: string;
  lyrics: string;
  /** Model is internal-only for now. Production defaults to Music 2.6. */
  model?: "music-2.6" | "music-3.0";
  /** Optional: URL to a reference song (.wav or .mp3, >15s). MiniMax matches the style/vibe. */
  referenceAudioUrl?: string;
  /** Optional: URL to a voice reference (.wav or .mp3, >15s). MiniMax clones the vocal style. */
  voiceReferenceUrl?: string;
  /** Optional: URL to an instrumental reference (.wav or .mp3, >15s). Generates without vocals. */
  instrumentalReferenceUrl?: string;
  /** When true, sends is_instrumental=true to MiniMax and omits the lyrics field entirely. */
  isInstrumental?: boolean;
}

interface MiniMaxMusicResponse {
  // Legacy fields (old API format)
  task_id?: string;
  audio_file?: { url: string };
  base_resp?: { status_code: number; status_msg: string };
  status?: string;
  file?: { file_id: string; download_url?: string };
  extra_info?: { audio_length?: number; audio_sample_rate?: number; audio_size?: number };
  // New API format (v2): audio URL/hex and status wrapped in data object
  data?: {
    audio?: string;   // Hex-encoded audio data (output_format=hex) or URL (output_format=url)
    status?: number;  // 0=Preparing, 1=Running, 2=Success, 3=Fail
    task_id?: string;
  };
  trace_id?: string;
}

/**
 * Start a MiniMax Music 2.6 generation via direct API.
 *
 * Returns a MusicGenerationStart discriminated union:
 * - { type: "sync", buffer } when MiniMax returns audio immediately (hex format).
 *   The Buffer is passed through directly — no in-memory Map, no race condition.
 * - { type: "async", taskId } when MiniMax starts an async task; call pollMusicGeneration().
 */
export async function startMusicGeneration(
  promptOrOptions: string | MusicGenerationOptions,
  lyricsArg?: string
): Promise<MusicGenerationStart> {
  if (!MINIMAX_API_KEY) {
    throw new Error("MINIMAX_API_KEY is not configured");
  }

  // Support both legacy (prompt, lyrics) and new options object signatures
  let prompt: string;
  let lyrics: string;
  let referenceAudioUrl: string | undefined;
  let voiceReferenceUrl: string | undefined;
  let instrumentalReferenceUrl: string | undefined;
  let isInstrumental = false;
  let model: "music-2.6" | "music-3.0" = "music-2.6";

  if (typeof promptOrOptions === "string") {
    prompt = promptOrOptions;
    lyrics = lyricsArg || "";
  } else {
    prompt = promptOrOptions.prompt;
    lyrics = promptOrOptions.lyrics;
    referenceAudioUrl = promptOrOptions.referenceAudioUrl;
    voiceReferenceUrl = promptOrOptions.voiceReferenceUrl;
    instrumentalReferenceUrl = promptOrOptions.instrumentalReferenceUrl;
    isInstrumental = promptOrOptions.isInstrumental ?? false;
    model = promptOrOptions.model ?? "music-2.6";
  }

  console.log(`[MiniMax ${model}] Starting generation: ${prompt.substring(0, 60)}...`);
  if (referenceAudioUrl) console.log(`[MiniMax 2.6] ✓ Using style reference: ${referenceAudioUrl.substring(0, 80)}...`);
  if (voiceReferenceUrl) console.log(`[MiniMax 2.6] ✓ Using voice reference: ${voiceReferenceUrl.substring(0, 80)}...`);
  if (!referenceAudioUrl && !voiceReferenceUrl) console.log(`[MiniMax 2.6] ⚠ No reference audio provided (text-only generation)`);

  // Build request body — omit lyrics entirely for instrumental mode
  const body: Record<string, unknown> = {
    model,
    prompt,
    ...(isInstrumental ? { is_instrumental: true } : { lyrics }),
    audio_setting: {
      sample_rate: 44100,
      bitrate: 256000,
      format: "mp3",
    },
    output_format: "hex",  // hex is more reliable: no secondary URL fetch, no expiry issues
  };

  // Attach reference audio if provided
  // MiniMax API field mapping (from docs: song_file, voice_file, instrumental_file):
  // - voice_file: voice/vocal reference (clone vocal style)
  // - song_file: music/style reference (match overall vibe)
  // - instrumental_file: instrumental reference (generate without vocals)
  if (voiceReferenceUrl) {
    body.voice_file = voiceReferenceUrl;
    console.log(`[MiniMax 2.6] Added voice_file to request body`);
  }
  if (referenceAudioUrl) {
    body.song_file = referenceAudioUrl;
    console.log(`[MiniMax 2.6] Added song_file to request body`);
  }
  if (instrumentalReferenceUrl) {
    body.instrumental_file = instrumentalReferenceUrl;
    console.log(`[MiniMax 2.6] Added instrumental_file to request body`);
  }
  if (isInstrumental) {
    console.log(`[MiniMax 2.6] ✓ Instrumental mode: is_instrumental=true, lyrics omitted`);
  }

  console.log(`[MiniMax 2.6] Request body keys: ${Object.keys(body).join(', ')}`);
  console.log(`[MiniMax 2.6] Prompt length: ${prompt.length}, Lyrics length: ${lyrics.length}`);

  console.log(`[MiniMax 2.6] Sending request to ${MINIMAX_API_BASE}/music_generation`);
  const response = await fetch(`${MINIMAX_API_BASE}/music_generation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  console.log(`[MiniMax 2.6] Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[MiniMax 2.6] ✗ API error ${response.status}: ${errorText}`);
    throw new Error(`MiniMax API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as MiniMaxMusicResponse;

  if (data.base_resp && data.base_resp.status_code !== 0) {
    throw new Error(`MiniMax API error: ${data.base_resp.status_msg} (code: ${data.base_resp.status_code})`);
  }

  // New API format: audio is synchronously available in data.audio as hex
  // status 2 = Success in the new numeric format
  if (data.data?.audio && data.data.status === 2) {
    const hexData = data.data.audio;
    console.log(`[MiniMax 2.6] Synchronous generation complete (hex format, ${hexData.length} chars)`);
    // Return the Buffer directly — no in-memory Map, no risk of GC between promise hops
    return { type: "sync", buffer: Buffer.from(hexData, "hex"), mimeType: "audio/mpeg" };
  }

  // Async format: get task_id for polling
  const taskId = data.task_id || data.data?.task_id;
  if (!taskId) {
    throw new Error(`MiniMax API did not return a task_id. Response: ${JSON.stringify(data).substring(0, 200)}`);
  }

  console.log(`[MiniMax 2.6] Task started (async): ${taskId}`);
  return { type: "async", taskId };
}

/**
 * Poll a MiniMax music generation task until it completes or fails.
 * Only call this when startMusicGeneration returns { type: "async", taskId }.
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

  // Legacy sentinel support (kept for backward compat with any in-flight tasks)
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
 * Fetch audio bytes from a URL or data URL (downloads from MiniMax before uploading to S3)
 */
export async function fetchAudioBytes(url: string): Promise<Buffer> {
  // Handle data URLs (base64-encoded audio from hex conversion)
  if (url.startsWith("data:")) {
    const commaIdx = url.indexOf(",");
    if (commaIdx === -1) throw new Error("Invalid data URL format");
    const base64 = url.slice(commaIdx + 1);
    return Buffer.from(base64, "base64");
  }
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
  lyrics: string,
  instrumental = false
): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: "Music style prompt is required" };
  }
  if (!instrumental && (!lyrics || lyrics.trim().length === 0)) {
    return { valid: false, error: "Lyrics are required (or enable Instrumental mode)" };
  }
  if (prompt.length > 2000) {
    return { valid: false, error: "Prompt is too long (max 2000 characters)" };
  }
  if (!instrumental && lyrics.length > 3500) {
    return { valid: false, error: "Lyrics are too long (max 3500 characters — MiniMax limit)" };
  }
  return { valid: true };
}
