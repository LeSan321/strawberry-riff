import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import { TRPCError } from "@trpc/server";

// Mock the music generation module
vi.mock("./musicGeneration", () => ({
  generateMusicWithACEStep: vi.fn().mockResolvedValue({
    audioUrl: "https://example.com/music.mp3",
    metadata: { duration: 240, model: "ace-step" },
  }),
  validateMusicGenerationParams: vi.fn((prompt, lyrics, duration) => {
    if (!prompt || prompt.trim().length === 0) {
      return { valid: false, error: "Prompt is required" };
    }
    if (!lyrics || lyrics.trim().length === 0) {
      return { valid: false, error: "Lyrics are required" };
    }
    if (![60, 120, 240].includes(duration)) {
      return { valid: false, error: "Duration must be 60, 120, or 240 seconds" };
    }
    return { valid: true };
  }),
}));

// Mock database functions
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    createMusicGeneration: vi.fn().mockResolvedValue(1),
    getMusicGenerationById: vi.fn().mockResolvedValue({
      id: 1,
      userId: 1,
      title: "Test Song",
      prompt: "jazz, noir",
      lyrics: "[verse]\nTest lyrics",
      duration: 240,
      audioUrl: "https://example.com/music.mp3",
      audioKey: "music/1/1-abc123.mp3",
      status: "complete",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    getMusicGenerationsByUserId: vi.fn().mockResolvedValue([
      {
        id: 1,
        userId: 1,
        title: "Test Song",
        prompt: "jazz, noir",
        lyrics: "[verse]\nTest lyrics",
        duration: 240,
        audioUrl: "https://example.com/music.mp3",
        audioKey: "music/1/1-abc123.mp3",
        status: "complete",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
    updateMusicGenerationStatus: vi.fn().mockResolvedValue(true),
    deleteMusicGeneration: vi.fn().mockResolvedValue(true),
    getMusicGenerationHistory: vi.fn().mockResolvedValue([]),
  };
});

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    url: "https://s3.example.com/music/1/1-abc123.mp3",
    key: "music/1/1-abc123.mp3",
  }),
}));

function makeCtx(userId: number = 1) {
  return {
    user: { id: userId, name: "Test User", email: "test@example.com" },
    req: {} as any,
    res: {} as any,
  };
}

describe("Music Generation Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    caller = appRouter.createCaller(makeCtx());
  });

  describe("generate", () => {
    it("should create a music generation with valid inputs", async () => {
      const result = await caller.musicGeneration.generate({
        title: "Test Song",
        prompt: "jazz, noir, 95 BPM",
        lyrics: "[verse]\nTest lyrics\n[chorus]\nChorus lyrics",
        duration: 240,
      });

      expect(result).toEqual({ id: 1, status: "generating" });
    });

    it("should reject empty title", async () => {
      await expect(
        caller.musicGeneration.generate({
          title: "",
          prompt: "jazz, noir",
          lyrics: "[verse]\nTest lyrics",
          duration: 240,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should reject empty prompt", async () => {
      await expect(
        caller.musicGeneration.generate({
          title: "Test Song",
          prompt: "",
          lyrics: "[verse]\nTest lyrics",
          duration: 240,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should reject empty lyrics", async () => {
      await expect(
        caller.musicGeneration.generate({
          title: "Test Song",
          prompt: "jazz, noir",
          lyrics: "",
          duration: 240,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should reject invalid duration", async () => {
      await expect(
        caller.musicGeneration.generate({
          title: "Test Song",
          prompt: "jazz, noir",
          lyrics: "[verse]\nTest lyrics",
          duration: 180, // Invalid: must be 60, 120, or 240
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should accept default duration of 240", async () => {
      const result = await caller.musicGeneration.generate({
        title: "Test Song",
        prompt: "jazz, noir",
        lyrics: "[verse]\nTest lyrics",
      });

      expect(result).toEqual({ id: 1, status: "generating" });
    });
  });

  describe("getById", () => {
    it("should return generation by id", async () => {
      const result = await caller.musicGeneration.getById({ id: 1 });

      expect(result).toBeDefined();
      expect(result?.title).toBe("Test Song");
      expect(result?.status).toBe("complete");
    });
  });

  describe("myGenerations", () => {
    it("should return user's generations", async () => {
      const result = await caller.musicGeneration.myGenerations();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].userId).toBe(1);
    });
  });

  describe("delete", () => {
    it("should delete a generation", async () => {
      const result = await caller.musicGeneration.delete({ id: 1 });

      expect(result).toEqual({ success: true });
    });
  });

  describe("getHistory", () => {
    it("should return generation history", async () => {
      const result = await caller.musicGeneration.getHistory({
        generationId: 1,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should reject access to other user's generation", async () => {
      const otherUserCaller = appRouter.createCaller(makeCtx(999));

      await expect(
        otherUserCaller.musicGeneration.getHistory({ generationId: 1 })
      ).rejects.toThrow(TRPCError);
    });
  });
});
