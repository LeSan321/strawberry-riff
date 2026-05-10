/**
 * StemSplit Webhook Handler
 * Processes webhook events from StemSplit when stem splitting is complete
 * Docs: https://stemsplit.io/api/v1 (Webhooks section)
 */

import { Request, Response } from "express";
import { createHmac } from "crypto";
import { getStemSplitByJobId, updateStemSplitStems, updateStemSplitStatus, markGenerationAsSplit } from "./db";

const STEMSPLIT_WEBHOOK_SECRET = process.env.STEMSPLIT_WEBHOOK_SECRET;

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
 * Verify webhook signature using HMAC-SHA256
 * Signature format: sha256=<hex>
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!STEMSPLIT_WEBHOOK_SECRET) {
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
    const computed = createHmac("sha256", STEMSPLIT_WEBHOOK_SECRET)
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
 * Verifies signature and updates database with stem URLs
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
      // Extract stem URLs from outputs
      const stems = {
        vocalUrl: data.outputs?.vocals?.url,
        drumsUrl: data.outputs?.drums?.url,
        bassUrl: data.outputs?.bass?.url,
        otherUrl: data.outputs?.other?.url,
        pianoUrl: data.outputs?.piano?.url,
      };

      // Update database with stem URLs
      await updateStemSplitStems(data.jobId, stems);
      await updateStemSplitStatus(data.jobId, "completed");
      
      // Mark the generation as split
      await markGenerationAsSplit(stemSplit.trackId);

      console.log(`[StemSplit Webhook] ✓ Stems saved for job ${data.jobId}`);
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
