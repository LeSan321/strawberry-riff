/**
 * Tests for the Visual Brief Generator
 *
 * These tests verify the generateVisualBrief function's output validation
 * and error handling without making real LLM calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VisualBrief } from "./visualBriefGenerator";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";
import { generateVisualBrief } from "./visualBriefGenerator";

const mockInvokeLLM = vi.mocked(invokeLLM);

const VALID_BRIEF: VisualBrief = {
  camera: "Slow dolly-in, medium close-up, shallow depth of field",
  lighting: "Warm amber key at 45°, soft diffused fill, pulse on kick drum",
  colorPalette: ["Burnt sienna (#8B4513)", "Deep teal (#008080)", "Cream (#FFFDD0)"],
  emotionArc: "Verse: introspective; Chorus: euphoric release",
  scene: "Candlelit recording studio, 2am, rain on glass",
  directorNote: "A late-night confessional bathed in amber warmth",
  pacing: "slow burn",
};

describe("generateVisualBrief", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a valid VisualBrief when LLM responds correctly", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(VALID_BRIEF) } }],
    } as any);

    const result = await generateVisualBrief({
      prompt: "Lo-fi hip hop, warm piano, soft drums, nostalgic",
      lyrics: "Verse 1\nWalking through the rain\nThinking of you again",
      title: "Rainy Night",
    });

    expect(result.camera).toBe(VALID_BRIEF.camera);
    expect(result.lighting).toBe(VALID_BRIEF.lighting);
    expect(result.colorPalette).toHaveLength(3);
    expect(result.emotionArc).toBe(VALID_BRIEF.emotionArc);
    expect(result.scene).toBe(VALID_BRIEF.scene);
    expect(result.directorNote).toBe(VALID_BRIEF.directorNote);
    expect(result.pacing).toBe(VALID_BRIEF.pacing);
  });

  it("handles string content from LLM correctly", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(VALID_BRIEF) } }],
    } as any);

    const result = await generateVisualBrief({
      prompt: "Rock anthem, electric guitar, powerful drums",
      lyrics: "Rise up, stand tall",
      title: "Anthem",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.colorPalette)).toBe(true);
  });

  it("normalizes colorPalette to array if LLM returns a string", async () => {
    const briefWithStringPalette = {
      ...VALID_BRIEF,
      colorPalette: "Burnt sienna, Deep teal" as any,
    };
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(briefWithStringPalette) } }],
    } as any);

    const result = await generateVisualBrief({
      prompt: "Jazz, upright bass, brushed snare",
      lyrics: "Blue notes falling",
      title: "Blue Notes",
    });

    expect(Array.isArray(result.colorPalette)).toBe(true);
  });

  it("throws when LLM returns empty content", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: "" } }],
    } as any);

    await expect(
      generateVisualBrief({
        prompt: "Pop, synth, upbeat",
        lyrics: "Dancing in the light",
        title: "Dance",
      })
    ).rejects.toThrow("LLM returned empty response");
  });

  it("throws when LLM returns null content", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    } as any);

    await expect(
      generateVisualBrief({
        prompt: "Ambient, ethereal",
        lyrics: "Floating away",
        title: "Float",
      })
    ).rejects.toThrow();
  });

  it("throws when required fields are missing from response", async () => {
    const incompleteBrief = { camera: "Slow pan", lighting: "Warm" };
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(incompleteBrief) } }],
    } as any);

    await expect(
      generateVisualBrief({
        prompt: "Country, acoustic guitar",
        lyrics: "Fields of gold",
        title: "Fields",
      })
    ).rejects.toThrow("missing required fields");
  });

  it("truncates very long lyrics before sending to LLM", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(VALID_BRIEF) } }],
    } as any);

    const longLyrics = "A".repeat(3000);
    await generateVisualBrief({
      prompt: "Epic orchestral",
      lyrics: longLyrics,
      title: "Epic",
    });

    const callArgs = mockInvokeLLM.mock.calls[0][0];
    const userMessage = callArgs.messages.find((m: any) => m.role === "user")?.content as string;
    // Should contain truncation marker
    expect(userMessage).toContain("[...truncated]");
  });

  it("passes prompt and title to LLM correctly", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(VALID_BRIEF) } }],
    } as any);

    await generateVisualBrief({
      prompt: "Reggae, island vibes, steel drums",
      lyrics: "Sun is shining",
      title: "Island Breeze",
    });

    const callArgs = mockInvokeLLM.mock.calls[0][0];
    const userMessage = callArgs.messages.find((m: any) => m.role === "user")?.content as string;
    expect(userMessage).toContain("Island Breeze");
    expect(userMessage).toContain("Reggae, island vibes, steel drums");
  });
});
