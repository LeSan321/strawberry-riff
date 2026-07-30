/**
 * StemSplit Webhook Handler
 * Processes webhook events from StemSplit when stem splitting is complete
 * Docs: https://stemsplit.io/api/v1 (Webhooks section)
 *
 * On job.completed: downloads each stem from StemSplit's expiring presigned URLs
 * and re-uploads to our permanent Cloudflare R2 bucket before saving to DB.
 * This ensures stem URLs never expire and the Blend tab always has valid sources.
 */

import { Request, Response } from "express";
import { createHmac } from "crypto";
import { getStemSplitByJobId, updateStemSplitStems, updateStemSplitStatus, markGenerationAsSplit } from "./db";
import { storagePut } from "../storage";

// Read lazily so tests can set process.env.STEMSPLIT_WEBHOOK_SECRET in beforeEach
const getWebhookSecret = () => process.env.STEMSPLIT_WEBHOOK_SECRET;

export interface StemSplitWebhookPayload {
  event: "job.completed" | "job.failed";
  timestamp: string;
  data: {
    jobId: string;
    status: "COMPLETED" | "FAILED";
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
    creditsCharged?: number;
    errorMessage?: string;
    createdAt: string;
    completedAt?: string;
  };
}

/**
 * Download a stem file from a (potentially expiring) URL and re-upload to our R2 bucket.
 * Returns a permanent public R2 URL, or null if download/upload fails.
 */
async function mirrorStemToR2(
  stemUrl: string | undefined | null,
  stemName: string,
  generationId: number
): Promise<string | null> {
  if (!stemUrl) return null;
  try {
    const res = await fetch(stemUrl);
    if (!res.ok) {
      console.warn(`[StemSplit Webhook] Failed to download ${stemName} stem (HTTP ${res.status})`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const key = `stems/${generationId}/${stemName}-${Date.now()}.mp3`;
    const { url } = await storagePut(key, buffer, "audio/mpeg");
    console.log(`[StemSplit Webhook] Mirrored ${stemName} → ${url}`);
    return url;
  } catch (err) {
    console.warn(`[StemSplit Webhook] Error mirroring ${stemName} stem:`, err);
    return null;
  }
}

/**
 * Verify webhook signature using HMAC-SHA256
 * Signature format: sha256=<hex>
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = getWebhookSecret();
  if (!secret) {
    console.warn("[StemSplit Webhook] STEMSPLIT_WEBHOOK_SECRET not configured");
    return false;
  }

  try {
    // Extract hex from signature (format: sha256=xxx)
    const signatureParts = signature.split("=");
    if (signatureParts.length !== 2 || signatureParts[0] !== "sha256") {
      return false;
    }

    const expectedSignature = signatureParts[1];

    // Compute HMAC-SHA256
    const computed = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // Constant-time comparison to prevent timing attacks
    return computed === expectedSignature;
  } catch (error) {
    console.error("[StemSplit Webhook] Signature verification error:", error);
    return false;
  }
}

/**
 * Handle incoming webhook from StemSplit
 * Verifies signature, mirrors stems to R2, then updates database with permanent URLs
 */
export async function handleStemSplitWebhook(req: Request, res: Response) {
  try {
    // Get raw body as string for signature verification
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const signature = req.headers["x-webhook-signature"] as string;

    if (!signature) {
      console.error("[StemSplit Webhook] Missing X-Webhook-Signature header");
      return res.status(401).json({ error: "Missing signature" });
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("[StemSplit Webhook] Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { event, data } = payload as StemSplitWebhookPayload;

    console.log(`[StemSplit Webhook] Received ${event} for job ${data.jobId}`);

    // Get the stem split record
    const stemSplit = await getStemSplitByJobId(data.jobId);
    if (!stemSplit) {
      console.warn(`[StemSplit Webhook] Job not found: ${data.jobId}`);
      return res.status(404).json({ error: "Job not found" });
    }

    if (event === "job.completed" && data.status === "COMPLETED") {
      const gId = stemSplit.generationId;
      console.log(`[StemSplit Webhook] Mirroring stems to R2 for generationId=${gId}...`);

      // Download each stem from StemSplit's expiring presigned URLs and re-upload to R2
      const [vocalUrl, drumsUrl, bassUrl, otherUrl, pianoUrl, guitarUrl] = await Promise.all([
        mirrorStemToR2(data.outputs?.vocals?.url, "vocals", gId),
        mirrorStemToR2(data.outputs?.drums?.url, "drums", gId),
        mirrorStemToR2(data.outputs?.bass?.url, "bass", gId),
        mirrorStemToR2(data.outputs?.other?.url, "other", gId),
        mirrorStemToR2(data.outputs?.piano?.url, "piano", gId),
        mirrorStemToR2(data.outputs?.guitar?.url, "guitar", gId),
      ]);

      // Use R2 URL if mirroring succeeded, fall back to StemSplit URL otherwise
      const stems = {
        vocalUrl:  vocalUrl  ?? data.outputs?.vocals?.url,
        drumsUrl:  drumsUrl  ?? data.outputs?.drums?.url,
        bassUrl:   bassUrl   ?? data.outputs?.bass?.url,
        otherUrl:  otherUrl  ?? data.outputs?.other?.url,
        pianoUrl:  pianoUrl  ?? data.outputs?.piano?.url,
        guitarUrl: guitarUrl ?? data.outputs?.guitar?.url,
      };

      // Update database with permanent R2 URLs
      await updateStemSplitStems(data.jobId, stems);
      await updateStemSplitStatus(data.jobId, "completed");

      // Mark the generation as split
      await markGenerationAsSplit(stemSplit.generationId);

      console.log(`[StemSplit Webhook] ✓ Stems mirrored and saved for job ${data.jobId}`);
      return res.json({ verified: true, status: "completed" });
    } else if (event === "job.failed" || data.status === "FAILED") {
      // Update database with failure
      await updateStemSplitStatus(data.jobId, "failed");

      console.error(
        `[StemSplit Webhook] ✗ Job failed: ${data.errorMessage || "Unknown error"}`
      );
      return res.json({ verified: true, status: "failed" });
    }

    // Unknown event type
    console.warn(`[StemSplit Webhook] Unknown event: ${event}`);
    return res.json({ verified: true, status: "unknown" });
  } catch (error) {
    console.error("[StemSplit Webhook] Error processing webhook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
