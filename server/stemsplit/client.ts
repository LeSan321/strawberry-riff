/**
 * StemSplit API Client
 * Handles communication with StemSplit API for audio stem separation
 */

const STEMSPLIT_API_BASE = "https://api.stemsplit.co/v1";
const STEMSPLIT_API_KEY = process.env.STEMSPLIT_API_KEY;

if (!STEMSPLIT_API_KEY) {
  throw new Error("STEMSPLIT_API_KEY environment variable is not set");
}

export interface StemSplitJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  audio_url?: string;
  stems?: {
    vocals?: string;
    drums?: string;
    bass?: string;
    other?: string;
    piano?: string;
  };
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface StemSplitRequest {
  audio_url: string;
  stems?: string[]; // e.g., ["vocals", "drums", "bass", "other", "piano"]
  webhook_url?: string;
}

/**
 * Start a stem split job
 * @param audioUrl - URL to the audio file to split
 * @param webhookUrl - Optional webhook URL for completion notifications
 * @returns Job ID and initial status
 */
export async function startStemSplit(
  audioUrl: string,
  webhookUrl?: string
): Promise<{ jobId: string; status: string }> {
  const payload: StemSplitRequest = {
    audio_url: audioUrl,
    stems: ["vocals", "drums", "bass", "other", "piano"],
  };

  if (webhookUrl) {
    payload.webhook_url = webhookUrl;
  }

  const response = await fetch(`${STEMSPLIT_API_BASE}/split`, {
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
  const response = await fetch(`${STEMSPLIT_API_BASE}/split/${jobId}`, {
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
 * Verify webhook signature from StemSplit
 * @param payload - Raw request body as string
 * @param signature - X-Webhook-Signature header from StemSplit
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const crypto = require("crypto");
  const webhookSecret = process.env.STEMSPLIT_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[StemSplit] STEMSPLIT_WEBHOOK_SECRET not configured");
    return false;
  }

  if (!signature) {
    console.error("[StemSplit] No webhook signature provided");
    return false;
  }

  try {
    // Compute the expected signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    // Compare signatures using constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );

    return isValid;
  } catch (error) {
    console.error("[StemSplit] Webhook signature verification failed:", error);
    return false;
  }
}
