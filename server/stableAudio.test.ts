import { describe, it, expect } from "vitest";

describe("Stability AI API key", () => {
  it("should have STABILITY_AI_API_KEY set in environment", () => {
    const key = process.env.STABILITY_AI_API_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    expect(key?.startsWith("sk-")).toBe(true);
  });

  it("should be able to reach the Stability AI API with the key", async () => {
    const key = process.env.STABILITY_AI_API_KEY;
    // Lightweight check: hit the user account endpoint to validate the key
    const res = await fetch("https://api.stability.ai/v1/user/account", {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });
    // 200 = valid key, 401 = invalid key
    expect(res.status).toBe(200);
    const data = await res.json() as { id?: string; email?: string };
    expect(data).toHaveProperty("email");
  }, 15000);
});
