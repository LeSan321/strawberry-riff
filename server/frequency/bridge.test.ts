import { describe, it, expect } from "vitest";

const BRIDGE_URL = process.env.STUDIOS_BRIDGE_URL ?? "";
const BRIDGE_KEY = process.env.BRIDGE_API_KEY ?? "";

describe("Studios Bridge Connection", () => {
  it("should have STUDIOS_BRIDGE_URL configured", () => {
    expect(BRIDGE_URL).toBeTruthy();
    expect(BRIDGE_URL).toContain("manus.space");
  });

  it("should have BRIDGE_API_KEY configured", () => {
    expect(BRIDGE_KEY).toBeTruthy();
    expect(BRIDGE_KEY.length).toBeGreaterThan(30);
  });

  it.skip("should reach the bridge /ping endpoint with correct key", async () => {
    if (!BRIDGE_URL || !BRIDGE_KEY) {
      console.warn("Bridge not configured — skipping live test");
      return;
    }
    const res = await fetch(`${BRIDGE_URL}/api/bridge/ping`, {
      headers: {
        "Content-Type": "application/json",
        "x-bridge-key": BRIDGE_KEY,
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
