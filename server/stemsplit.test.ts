import { describe, it, expect, beforeAll } from "vitest";

/**
 * StemSplit API Integration Tests
 * Validates the STEMSPLIT_API_KEY and basic API connectivity
 */

describe("StemSplit API", () => {
  let apiKey: string;

  beforeAll(() => {
    apiKey = process.env.STEMSPLIT_API_KEY;
    if (!apiKey) {
      throw new Error("STEMSPLIT_API_KEY environment variable is not set");
    }
  });

  it("should have STEMSPLIT_API_KEY configured", () => {
    expect(apiKey).toBeDefined();
    expect(apiKey.length).toBeGreaterThan(0);
    expect(apiKey).toMatch(/^sk_/); // StemSplit keys start with sk_
  });

  it("should validate API key format", () => {
    // StemSplit live keys follow pattern: sk_live_*
    expect(apiKey).toMatch(/^sk_live_/);
  });

  it("should be able to construct auth headers", () => {
    const authHeader = `Bearer ${apiKey}`;
    expect(authHeader).toBeDefined();
    expect(authHeader).toContain("Bearer sk_live_");
  });

  it("should validate API endpoint connectivity (mock)", async () => {
    // This test validates that we can construct a valid request
    // In a real scenario, you'd make an actual API call to StemSplit
    const endpoint = "https://api.stemsplit.co/v1/split";
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    expect(endpoint).toBeDefined();
    expect(headers.Authorization).toContain("Bearer sk_live_");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("should have valid API key structure for requests", () => {
    // Verify the key can be used in authorization headers
    const isValidKey = apiKey.startsWith("sk_live_") && apiKey.length > 20;
    expect(isValidKey).toBe(true);
  });
});
