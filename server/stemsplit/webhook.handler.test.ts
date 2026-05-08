import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { handleStemSplitWebhook } from "./webhook";
import * as db from "./db";
import * as client from "./client";
import { Request, Response } from "express";

/**
 * StemSplit Webhook Handler Tests
 * Tests webhook signature verification and event processing
 */

describe("StemSplit Webhook Handler", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: any;
  let statusSpy: any;

  beforeEach(() => {
    // Mock response object
    jsonSpy = vi.fn().mockReturnValue(undefined);
    statusSpy = vi.fn().mockReturnValue({
      json: jsonSpy,
    });

    mockRes = {
      json: jsonSpy,
      status: statusSpy,
    };

    // Mock database functions
    vi.spyOn(db, "getStemSplitByJobId").mockResolvedValue(null);
    vi.spyOn(db, "updateStemSplitStems").mockResolvedValue(undefined);
    vi.spyOn(db, "updateStemSplitStatus").mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject webhook with invalid signature", async () => {
    const payload = JSON.stringify({ event: "split.completed", jobId: "test-123" });

    mockReq = {
      body: payload,
      headers: {
        "x-webhook-signature": "invalid_signature_12345",
      },
    };

    await handleStemSplitWebhook(mockReq as Request, mockRes as Response);

    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Invalid signature" });
  });

  it("should reject webhook without signature", async () => {
    const payload = JSON.stringify({ event: "split.completed", jobId: "test-123" });

    mockReq = {
      body: payload,
      headers: {},
    };

    await handleStemSplitWebhook(mockReq as Request, mockRes as Response);

    expect(statusSpy).toHaveBeenCalledWith(401);
  });

  it("should return 404 for non-existent job", async () => {
    const payload = JSON.stringify({ event: "split.completed", jobId: "non-existent-job" });
    const signature = require("crypto")
      .createHmac("sha256", process.env.STEMSPLIT_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    mockReq = {
      body: payload,
      headers: {
        "x-webhook-signature": signature,
      },
    };

    await handleStemSplitWebhook(mockReq as Request, mockRes as Response);

    expect(statusSpy).toHaveBeenCalledWith(404);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Job not found" });
  });

  it("should process split.completed event with stems", async () => {
    const jobId = "test-job-123";
    const stems = {
      vocals: "https://cdn.example.com/vocals.mp3",
      drums: "https://cdn.example.com/drums.mp3",
      bass: "https://cdn.example.com/bass.mp3",
      other: "https://cdn.example.com/other.mp3",
      piano: "https://cdn.example.com/piano.mp3",
    };

    const payload = JSON.stringify({
      event: "split.completed",
      jobId,
      status: "completed",
      stems,
      timestamp: new Date().toISOString(),
    });

    const signature = require("crypto")
      .createHmac("sha256", process.env.STEMSPLIT_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    mockReq = {
      body: payload,
      headers: {
        "x-webhook-signature": signature,
      },
    };

    // Mock database to return an existing job
    (db.getStemSplitByJobId as any).mockResolvedValueOnce({
      id: 1,
      jobId,
      userId: 1,
      trackId: 1,
      status: "processing",
    });

    await handleStemSplitWebhook(mockReq as Request, mockRes as Response);

    expect(db.updateStemSplitStems).toHaveBeenCalledWith(jobId, {
      vocalUrl: stems.vocals,
      drumsUrl: stems.drums,
      bassUrl: stems.bass,
      otherUrl: stems.other,
      pianoUrl: stems.piano,
    });

    expect(jsonSpy).toHaveBeenCalledWith({ success: true, message: "Stems updated" });
  });

  it("should process split.failed event with error message", async () => {
    const jobId = "test-job-456";
    const errorMsg = "Audio file format not supported";

    const payload = JSON.stringify({
      event: "split.failed",
      jobId,
      status: "failed",
      error: errorMsg,
      timestamp: new Date().toISOString(),
    });

    const signature = require("crypto")
      .createHmac("sha256", process.env.STEMSPLIT_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    mockReq = {
      body: payload,
      headers: {
        "x-webhook-signature": signature,
      },
    };

    // Mock database to return an existing job
    (db.getStemSplitByJobId as any).mockResolvedValueOnce({
      id: 2,
      jobId,
      userId: 1,
      trackId: 2,
      status: "processing",
    });

    await handleStemSplitWebhook(mockReq as Request, mockRes as Response);

    expect(db.updateStemSplitStatus).toHaveBeenCalledWith(jobId, "failed", errorMsg);
    expect(jsonSpy).toHaveBeenCalledWith({ success: true, message: "Failure recorded" });
  });

  it("should reject unknown event types", async () => {
    const payload = JSON.stringify({
      event: "unknown.event",
      jobId: "test-job-789",
      timestamp: new Date().toISOString(),
    });

    const signature = require("crypto")
      .createHmac("sha256", process.env.STEMSPLIT_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    mockReq = {
      body: payload,
      headers: {
        "x-webhook-signature": signature,
      },
    };

    // Mock database to return an existing job
    (db.getStemSplitByJobId as any).mockResolvedValueOnce({
      id: 3,
      jobId: "test-job-789",
      userId: 1,
      trackId: 3,
      status: "processing",
    });

    await handleStemSplitWebhook(mockReq as Request, mockRes as Response);

    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Unknown event type" });
  });

  it("should handle database errors gracefully", async () => {
    const payload = JSON.stringify({
      event: "split.completed",
      jobId: "test-job-error",
      status: "completed",
      stems: {},
      timestamp: new Date().toISOString(),
    });

    const signature = require("crypto")
      .createHmac("sha256", process.env.STEMSPLIT_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    mockReq = {
      body: payload,
      headers: {
        "x-webhook-signature": signature,
      },
    };

    // Mock database to throw an error
    (db.getStemSplitByJobId as any).mockRejectedValueOnce(new Error("Database connection failed"));

    await handleStemSplitWebhook(mockReq as Request, mockRes as Response);

    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
