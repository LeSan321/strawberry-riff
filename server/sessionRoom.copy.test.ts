import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sessionSource = readFileSync("client/src/pages/TheSession.tsx", "utf8");

describe("Session Room invitation-led framing", () => {
  it("keeps the visible creative sequence intact", () => {
    expect(sessionSource).toContain("Your creative thread");
    expect(sessionSource).toContain("Sound World");
    expect(sessionSource).toContain("Shared Shape");
    expect(sessionSource).toContain("Voice & Words");
    expect(sessionSource).toContain("Listen Together");
  });

  it("frames the room as creative guidance rather than a technical control panel", () => {
    expect(sessionSource).toContain("Build a fusion landscape. Then explore vocal color.");
    expect(sessionSource).toContain("Guided, never rigid");
    expect(sessionSource).toContain("Who could live inside this song?");
    expect(sessionSource).toContain("Let the language support the voice");
  });

  it("does not describe the working Blend path as server-side ffmpeg processing", () => {
    expect(sessionSource).toContain("Your browser renders the relationship");
    expect(sessionSource).toContain("Your browser is rendering this custom fusion");
    expect(sessionSource).not.toContain("using server-side ffmpeg mixing");
  });
});
