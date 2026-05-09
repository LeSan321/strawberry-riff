/**
 * StemSplit API Client
 * Handles communication with StemSplit API for audio stem separation
 * API Docs: https://stemsplit.io/api/v1
 */

const STEMSPLIT_API_BASE = "https://stemsplit.io/api/v1";
const STEMSPLIT_API_KEY = process.env.STEMSPLIT_API_KEY;

if (!STEMSPLIT_API_KEY) {
  throw new Error("STEMSPLIT_API_KEY environment variable is not set");
}

export interface StemSplitJob {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED";
  progress: number;
  createdAt: string;
  completedAt?: string;
  input?: {
    fileName: string;
    durationSeconds: number;
    fileSizeBytes: number;
  };
  options?: {
    outputType: "VOCALS" | "INSTRUMENTAL" | "BOTH" | "FOUR_STEMS" | "SIX_STEMS";
    quality: "FAST" | "BALANCED" | "BEST";
    outputFormat: "MP3" | "WAV" | "FLAC";
  };
  outputs?: {
    vocals?: { url: string; expiresAt: string };
    instrumental?: { url: string; expiresAt: string };
    drums?: { url: string; expiresAt: string };
    bass?: { url: string; expiresAt: string };
    other?: { url: string; expiresAt: string };
    piano?: { url: string; expiresAt: string };
    guitar?: { url: string; expiresAt: string };
    fullAudio?: { url: string; expiresAt: string };
  };
  creditsRequired?: number;
  creditsCharged?: number;
  errorMessage?: string;
}

/**
 * Start a stem split job
 * @param audioUrl - URL to the audio file to split
 * @returns Job ID and initial status
 */
export async function startStemSplit(
  audioUrl: string
): Promise<{ jobId: string; status: string }> {
  const payload = {
    sourceUrl: audioUrl,
    outputType: "FOUR_STEMS", // vocals, drums, bass, other
    quality: "BALANCED",
    outputFormat: "MP3",
  };

  const response = await fetch(`${STEMSPLIT_API_BASE}/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STEMSPLIT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`StemSplit API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as StemSplitJob;
  return {
    jobId: data.id,
    status: data.status,
  };
}

/**
 * Poll for job status
 * @param jobId - StemSplit job ID
 * @returns Current job status and stems (if completed)
 */
export async function getStemSplitStatus(jobId: string): Promise<StemSplitJob> {
  const response = await fetch(`${STEMSPLIT_API_BASE}/jobs/${jobId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${STEMSPLIT_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`StemSplit API error: ${response.status} - ${error}`);
  }

  return (await response.json()) as StemSplitJob;
}

/**
 * Get credit balance
 * @returns Current credit balance in seconds and formatted string
 */
export async function getCreditBalance(): Promise<{
  balanceSeconds: number;
  balanceMinutes: number;
  balanceFormatted: string;
}> {
  const response = await fetch(`${STEMSPLIT_API_BASE}/balance`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${STEMSPLIT_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`StemSplit API error: ${response.status} - ${error}`);
  }

  return (await response.json()) as {
    balanceSeconds: number;
    balanceMinutes: number;
    balanceFormatted: string;
  };
}
