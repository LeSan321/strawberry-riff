import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sessionSource = readFileSync("client/src/pages/TheSession.tsx", "utf8");
const generateSource = readFileSync("client/src/pages/Generate.tsx", "utf8");

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

  it("keeps a newly created fusion bed available to Voice & Words", () => {
    expect(sessionSource).toContain("onFusionBedReady");
    expect(sessionSource).toContain("setActiveFusionBed(bed)");
    expect(sessionSource).toContain("Fusion bed held in this session");
    expect(sessionSource).toContain("Explore a voice");
  });

  it("makes Shared Shape a responsive Match Family shelf", () => {
    expect(sessionSource).toContain("MatchFamilyShelf");
    expect(sessionSource).toContain("Browse Match Families");
    expect(sessionSource).toContain("Return to the relationships you have already begun.");
    expect(sessionSource).toContain("Use this bed");
    expect(sessionSource).toContain("Open Blend");
  });

  it("opens the active Match Family from Shared Shape while keeping all-family exploration available", () => {
    expect(sessionSource).toContain("setFamilyFilter(activeFusionBed?.matchFamilyId ?? null)");
    expect(sessionSource).toContain("activeMatchFamilyId");
    expect(sessionSource).toContain("Showing Match Family");
    expect(sessionSource).toContain("Browse all families");
  });

  it("uses Session-aware art direction rather than generic prompt-only generation", () => {
    expect(sessionSource).toContain("sessionMode");
    expect(generateSource).toContain("getSessionFusionStarters");
    expect(generateSource).toContain("Build a fusion landscape");
    expect(generateSource).toContain("Art Direction");
  });
});
