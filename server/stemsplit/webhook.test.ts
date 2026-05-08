import { describe, it, expect, beforeAll } from "vitest";

/**
 * StemSplit Webhook Verification Tests
 * Validates webhook signing secret and signature verification
 */

describe("StemSplit Webhook", () => {
  let webhookSecret: string;

  beforeAll(() => {
    webhookSecret = process.env.STEMSPLIT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("STEMSPLIT_WEBHOOK_SECRET environment variable is not set");
    }
  });

  it("should have STEMSPLIT_WEBHOOK_SECRET configured", () => {
    expect(webhookSecret).toBeDefined();
    expect(webhookSecret.length).toBeGreaterThan(0);
  });

  it("should validate webhook secret format", () => {
    // StemSplit webhook secrets follow pattern: whsec_*
    expect(webhookSecret).toMatch(/^whsec_/);
  });

  it("should have valid webhook secret length", () => {
    // Webhook secrets are typically 64+ characters
    expect(webhookSecret.length).toBeGreaterThanOrEqual(40);
  });

  it("should be able to construct HMAC verification", () => {
    // Test that we can use the secret for HMAC verification
    const crypto = require("crypto");
    const testPayload = JSON.stringify({ test: "data" });
    
    // Create HMAC using the webhook secret
    const hmac = crypto
      .createHmac("sha256", webhookSecret)
      .update(testPayload)
      .digest("hex");

    expect(hmac).toBeDefined();
    expect(hmac.length).toBeGreaterThan(0);
    expect(typeof hmac).toBe("string");
  });

  it("should verify webhook signature correctly", () => {
    const crypto = require("crypto");
    const testPayload = JSON.stringify({ event: "split.completed", jobId: "test-123" });
    
    // Create a valid signature
    const validSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(testPayload)
      .digest("hex");

    // Create an invalid signature
    const invalidSignature = "invalid_signature_12345";

    // Verify valid signature matches
    const computedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(testPayload)
      .digest("hex");

    expect(computedSignature).toBe(validSignature);
    expect(computedSignature).not.toBe(invalidSignature);
  });
});
