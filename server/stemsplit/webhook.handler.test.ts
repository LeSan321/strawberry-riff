import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { handleStemSplitWebhook } from "./webhook";
import * as db from "./db";
import { Request, Response } from "express";
import { createHmac } from "crypto";

const WEBHOOK_SECRET = "test-webhook-secret";

function makeSignature(payload: string): string {
  const hex = createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
  return `sha256=${hex}`;
}

describe("StemSplit Webhook Handler", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.STEMSPLIT_WEBHOOK_SECRET = WEBHOOK_SECRET;
    jsonSpy = vi.fn().mockReturnValue(undefined);
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
    mockRes = { json: jsonSpy, status: statusSpy };
    vi.spyOn(db, "getStemSplitByJobId").mockResolvedValue(null);
    vi.spyOn(db, "updateStemSplitStems").mockResolvedValue(undefined as any);
    vi.spyOn(db, "updateStemSplitStatus").mockResolvedValue(undefined as any);
    vi.spyOn(db, "markGenerationAsSplit").mockResolvedValue(undefined as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.STEMSPLIT_WEBHOOK_SECRET;
  });

  it("should reject webhook with invalid signature", async () => {
    const payload = JSON.stringify({ event: "job.completed", timestamp: new Date().toISOString(), data: { jobId: "test-123", status: "COMPLETED" } });
    mockReq = { body: payload, headers: { "x-webhook-signature": "sha256=invalid_hex_value" } };
    await handleStemSplitWebhook(mockReq as Request, mockRes as Response);
    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Invalid signature" });
  });

  it("should reject webhook without signature", async () => {
    const payload = JSON.stringify({ event: "job.completed", timestamp: new Date().toISOString(), data: { jobId: "test-123", status: "COMPLETED" } });
    mockReq = { body: payload, headers: {} };
    await handleStemSplitWebhook(mockReq as Request, mockRes as Response);
    expect(statusSpy).toHaveBeenCalledWith(401);
  });

  it("should return 404 for non-existent job", async () => {
    const payload = JSON.stringify({ event: "job.completed", timestamp: new Date().toISOString(), data: { jobId: "non-existent-job", status: "COMPLETED" } });
    mockReq = { body: payload, headers: { "x-webhook-signature": makeSignature(payload) } };
    await handleStemSplitWebhook(mockReq as Request, mockRes as Response);
    expect(statusSpy).toHaveBeenCalledWith(404);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Job not found" });
  });

  it("should process job.completed event with stems", async () => {
    const jobId = "test-job-123";
    const outputs = {
      vocals: { url: "https://cdn.example.com/vocals.mp3", expiresAt: "2026-01-01T00:00:00Z" },
      drums: { url: "https://cdn.example.com/drums.mp3", expiresAt: "2026-01-01T00:00:00Z" },
      bass: { url: "https://cdn.example.com/bass.mp3", expiresAt: "2026-01-01T00:00:00Z" },
      other: { url: "https://cdn.example.com/other.mp3", expiresAt: "2026-01-01T00:00:00Z" },
      piano: { url: "https://cdn.example.com/piano.mp3", expiresAt: "2026-01-01T00:00:00Z" },
    };
    const payload = JSON.stringify({ event: "job.completed", timestamp: new Date().toISOString(), data: { jobId, status: "COMPLETED", outputs } });
    mockReq = { body: payload, headers: { "x-webhook-signature": makeSignature(payload) } };
    (db.getStemSplitByJobId as any).mockResolvedValueOnce({ id: 1, jobId, userId: 1, generationId: 1, status: "processing" });
    await handleStemSplitWebhook(mockReq as Request, mockRes as Response);
    expect(db.updateStemSplitStems).toHaveBeenCalledWith(jobId, {
      vocalUrl: outputs.vocals.url,
      drumsUrl: outputs.drums.url,
      bassUrl: outputs.bass.url,
      otherUrl: outputs.other.url,
      pianoUrl: outputs.piano.url,
    });
    expect(db.updateStemSplitStatus).toHaveBeenCalledWith(jobId, "completed");
    expect(jsonSpy).toHaveBeenCalledWith({ verified: true, status: "completed" });
  });

  it("should process job.failed event", async () => {
    const jobId = "test-job-456";
    const payload = JSON.stringify({ event: "job.failed", timestamp: new Date().toISOString(), data: { jobId, status: "FAILED", errorMessage: "Audio file format not supported" } });
    mockReq = { body: payload, headers: { "x-webhook-signature": makeSignature(payload) } };
    (db.getStemSplitByJobId as any).mockResolvedValueOnce({ id: 2, jobId, userId: 1, generationId: 2, status: "processing" });
    await handleStemSplitWebhook(mockReq as Request, mockRes as Response);
    expect(db.updateStemSplitStatus).toHaveBeenCalledWith(jobId, "failed");
    expect(jsonSpy).toHaveBeenCalledWith({ verified: true, status: "failed" });
  });

  it("should handle unknown event types gracefully", async () => {
    const jobId = "test-job-789";
    const payload = JSON.stringify({ event: "job.unknown", timestamp: new Date().toISOString(), data: { jobId, status: "UNKNOWN" } });
    mockReq = { body: payload, headers: { "x-webhook-signature": makeSignature(payload) } };
    (db.getStemSplitByJobId as any).mockResolvedValueOnce({ id: 3, jobId, userId: 1, generationId: 3, status: "processing" });
    await handleStemSplitWebhook(mockReq as Request, mockRes as Response);
    expect(jsonSpy).toHaveBeenCalledWith({ verified: true, status: "unknown" });
  });

  it("should handle database errors gracefully", async () => {
    const payload = JSON.stringify({ event: "job.completed", timestamp: new Date().toISOString(), data: { jobId: "test-job-error", status: "COMPLETED" } });
    mockReq = { body: payload, headers: { "x-webhook-signature": makeSignature(payload) } };
    (db.getStemSplitByJobId as any).mockRejectedValueOnce(new Error("Database connection failed"));
    await handleStemSplitWebhook(mockReq as Request, mockRes as Response);
    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
