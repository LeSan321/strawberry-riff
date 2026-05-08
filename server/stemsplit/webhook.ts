/**
 * StemSplit Webhook Handler
 * Processes webhook events from StemSplit when stem splitting is complete
 */

import { Request, Response } from "express";
import { verifyWebhookSignature } from "./client";
import { getStemSplitByJobId, updateStemSplitStems, updateStemSplitStatus } from "./db";

export interface StemSplitWebhookPayload {
  event: "split.completed" | "split.failed";
  jobId: string;
  status: "completed" | "failed";
  stems?: {
    vocals?: string;
    drums?: string;
    bass?: string;
    other?: string;
    piano?: string;
  };
  error?: string;
  timestamp: string;
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

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("[StemSplit Webhook] Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { event, jobId, status, stems, error } = payload as StemSplitWebhookPayload;

    console.log(`[StemSplit Webhook] Received ${event} for job ${jobId}`);

    // Get the stem split record
    const stemSplit = await getStemSplitByJobId(jobId);
    if (!stemSplit) {
      console.warn(`[StemSplit Webhook] Job not found: ${jobId}`);
      return res.status(404).json({ error: "Job not found" });
    }

    // Handle completion event
    if (event === "split.completed" && stems) {
      await updateStemSplitStems(jobId, {
        vocalUrl: stems.vocals,
        drumsUrl: stems.drums,
        bassUrl: stems.bass,
        otherUrl: stems.other,
        pianoUrl: stems.piano,
      });

      console.log(`[StemSplit Webhook] Stem split completed for job ${jobId}`);
      return res.json({ success: true, message: "Stems updated" });
    }

    // Handle failure event
    if (event === "split.failed") {
      await updateStemSplitStatus(jobId, "failed", error || "Unknown error");
      console.error(`[StemSplit Webhook] Stem split failed for job ${jobId}: ${error}`);
      return res.json({ success: true, message: "Failure recorded" });
    }

    // Unknown event type
    console.warn(`[StemSplit Webhook] Unknown event type: ${event}`);
    return res.status(400).json({ error: "Unknown event type" });
  } catch (error) {
    console.error("[StemSplit Webhook] Error processing webhook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware to parse raw body for webhook signature verification
 * Must be applied BEFORE express.json() middleware
 */
export function stemSplitWebhookMiddleware(req: Request, res: Response, next: () => void) {
  if (req.path === "/api/stemsplit/webhook") {
    let rawBody = "";
    req.setEncoding("utf8");

    req.on("data", (chunk) => {
      rawBody += chunk;
    });

    req.on("end", () => {
      req.body = rawBody;
      next();
    });
  } else {
    next();
  }
}
