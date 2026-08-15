import { describe, expect, it } from "vitest";
import { buildBespokePrompt } from "./instrumentBible";

describe("Fusion Plan compiler", () => {
  it("uses Double-Reinforcement Structure for a bagpipe fusion", () => {
    const prompt = buildBespokePrompt(
      "bagpipes",
      "festive cyber rockabilly rhythm section at 140 BPM",
      {
        version: 1,
        anchorRole: "carry-hook",
        vocalRelationship: "open-verses",
        tempo: 160,
        creatorDirection: "festive cyber rockabilly rhythm section at 140 BPM",
      },
    );

    expect(prompt).toContain("Instrument: Great Highland Bagpipe");
    expect(prompt).toContain("Great Highland Bagpipe: conical chanter with three fixed tonic drones");
    expect(prompt).toContain("replacing lead guitar");
    expect(prompt).toContain("high-energy melodic fills and solo breaks");
    expect(prompt.match(/\b\d+\s*BPM\b/gi)).toEqual(["160 BPM"]);
    expect(prompt).toContain("Reserve verse space after the bagpipe phrases for a future lead singer");
    expect(prompt).not.toContain("no competing melodic top-line hook");
  });

  it("keeps the prior safe fallback when no Fusion Plan is supplied", () => {
    const prompt = buildBespokePrompt("bagpipes", "coastal samba");
    expect(prompt).toContain("Instrument: Great Highland Bagpipe");
    expect(prompt).toContain("coastal samba");
  });
});
