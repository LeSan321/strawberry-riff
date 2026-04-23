import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock invokeLLM ───────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: `[Verse 1]
In the neon haze I find your face
Salt on my skin, your velvet grace

[Chorus]
Chase the midnight, chase the light
We're burning bright in the strawberry night

[Bridge]
Every road leads back to you
Winding home through morning dew

[Outro]
The neon fades but the feeling stays

**Stickiness Analysis**
This lyric uses sensory specifics ("salt on my skin," "neon haze") to ground the emotion. The chorus employs strategic repetition with "chase" creating a Zeigarnik loop. The bridge reframes the journey motif from loss to homecoming, and the outro callbacks "neon" from Verse 1 for Zeigarnik resolution.`,
        },
      },
    ],
  }),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────
import {
  buildLyricsPrompt,
  generateLyrics,
  WRITING_TEAM,
  STRUCTURE_TEMPLATES,
  type LyricsGenerationInput,
} from "./lyricsGenerator";

// ─── buildLyricsPrompt ────────────────────────────────────────────────────────
describe("buildLyricsPrompt", () => {
  const baseInput: LyricsGenerationInput = {
    fusion: "Lo-fi Hip Hop + Dreamy Jazz",
    topic: "midnight longing",
    mood: "smoky introspective",
    structure: "[Verse 1] [Chorus] [Bridge] [Outro]",
  };

  it("includes fusion and topic in the prompt", () => {
    const prompt = buildLyricsPrompt(baseInput);
    expect(prompt).toContain("Lo-fi Hip Hop + Dreamy Jazz");
    expect(prompt).toContain("midnight longing");
  });

  it("includes mood in the prompt", () => {
    const prompt = buildLyricsPrompt(baseInput);
    expect(prompt).toContain("smoky introspective");
  });

  it("includes structure in the prompt", () => {
    const prompt = buildLyricsPrompt(baseInput);
    expect(prompt).toContain("[Verse 1] [Chorus] [Bridge] [Outro]");
  });

  it("includes optional emotionalFeeling when provided", () => {
    const prompt = buildLyricsPrompt({ ...baseInput, emotionalFeeling: "sultry vulnerability" });
    expect(prompt).toContain("sultry vulnerability");
  });

  it("includes hookSeed when provided", () => {
    const prompt = buildLyricsPrompt({ ...baseInput, hookSeed: "chasing neon lights" });
    expect(prompt).toContain("chasing neon lights");
  });

  it("includes writing team persona when provided", () => {
    const prompt = buildLyricsPrompt({ ...baseInput, writingTeam: "Hook Master" });
    expect(prompt).toContain("Hook Master");
  });

  it("includes perspective when provided", () => {
    const prompt = buildLyricsPrompt({ ...baseInput, perspective: "second-person" });
    expect(prompt).toContain("second-person");
  });

  it("includes constraints when provided", () => {
    const prompt = buildLyricsPrompt({ ...baseInput, constraints: "avoid 'blue moon'" });
    expect(prompt).toContain("avoid 'blue moon'");
  });

  it("always includes stickiness signals", () => {
    const prompt = buildLyricsPrompt(baseInput);
    expect(prompt).toContain("earworm repetition");
    expect(prompt).toContain("semantic surprise");
  });

  it("does not include undefined optional fields", () => {
    const prompt = buildLyricsPrompt(baseInput);
    expect(prompt).not.toContain("undefined");
  });
});

// ─── generateLyrics ───────────────────────────────────────────────────────────
describe("generateLyrics", () => {
  const baseInput: LyricsGenerationInput = {
    fusion: "Velvet Strawberry Club",
    topic: "self-discovery after heartbreak",
    mood: "haunting melancholic",
    structure: "[Verse 1] [Chorus] [Bridge] [Outro]",
  };

  it("returns lyrics, stickinessAnalysis, and fullResponse", async () => {
    const result = await generateLyrics(baseInput);
    expect(result).toHaveProperty("lyrics");
    expect(result).toHaveProperty("stickinessAnalysis");
    expect(result).toHaveProperty("fullResponse");
  });

  it("lyrics contains structure tags", async () => {
    const result = await generateLyrics(baseInput);
    expect(result.lyrics).toContain("[Verse 1]");
    expect(result.lyrics).toContain("[Chorus]");
  });

  it("stickinessAnalysis is extracted from the response", async () => {
    const result = await generateLyrics(baseInput);
    expect(result.stickinessAnalysis.length).toBeGreaterThan(0);
    expect(result.stickinessAnalysis).toContain("sensory specifics");
  });

  it("fullResponse contains the complete LLM output", async () => {
    const result = await generateLyrics(baseInput);
    expect(result.fullResponse).toContain("Stickiness Analysis");
  });
});

// ─── WRITING_TEAM ─────────────────────────────────────────────────────────────
describe("WRITING_TEAM", () => {
  it("has 5 team members", () => {
    expect(Object.keys(WRITING_TEAM)).toHaveLength(5);
  });

  it("contains all expected members", () => {
    const members = Object.keys(WRITING_TEAM);
    expect(members).toContain("Hook Master");
    expect(members).toContain("Story Weaver");
    expect(members).toContain("Poet Visionary");
    expect(members).toContain("Tone Shifter");
    expect(members).toContain("Polish Editor");
  });

  it("each member has a non-empty persona string", () => {
    for (const [, persona] of Object.entries(WRITING_TEAM)) {
      expect(typeof persona).toBe("string");
      expect(persona.length).toBeGreaterThan(20);
    }
  });
});

// ─── STRUCTURE_TEMPLATES ──────────────────────────────────────────────────────
describe("STRUCTURE_TEMPLATES", () => {
  it("has at least 8 templates", () => {
    expect(Object.keys(STRUCTURE_TEMPLATES).length).toBeGreaterThanOrEqual(8);
  });

  it("all templates contain at least one structure tag", () => {
    for (const [, template] of Object.entries(STRUCTURE_TEMPLATES)) {
      expect(template).toMatch(/\[.+\]/);
    }
  });

  it("Standard Pop template contains expected sections", () => {
    expect(STRUCTURE_TEMPLATES["Standard Pop"]).toContain("[Verse 1]");
    expect(STRUCTURE_TEMPLATES["Standard Pop"]).toContain("[Chorus]");
    expect(STRUCTURE_TEMPLATES["Standard Pop"]).toContain("[Bridge]");
    expect(STRUCTURE_TEMPLATES["Standard Pop"]).toContain("[Outro]");
  });
});
