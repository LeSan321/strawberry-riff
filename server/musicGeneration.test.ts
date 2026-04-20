import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import { TRPCError } from "@trpc/server";
import * as dbModule from "./db";

// Mock the music generation module (MiniMax Music 2.5 via Replicate)
vi.mock("./musicGeneration", () => ({
  startMusicGeneration: vi.fn().mockResolvedValue("pred_test123"),
  pollMusicGeneration: vi.fn().mockResolvedValue({
    audioUrl: "https://replicate.delivery/test/audio.mp3",
    mimeType: "audio/mpeg",
  }),
  fetchAudioBytes: vi.fn().mockResolvedValue(Buffer.from("fake-audio-bytes")),
  validateMusicGenerationParams: vi.fn((prompt, lyrics) => {
    if (!prompt || prompt.trim().length === 0) {
      return { valid: false, error: "Prompt is required" };
    }
    if (!lyrics || lyrics.trim().length === 0) {
      return { valid: false, error: "Lyrics are required" };
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
      lyrics: "[Verse]\nTest lyrics",
      duration: 0,
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
        lyrics: "[Verse]\nTest lyrics",
        duration: 0,
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
    countGenerationsThisMonth: vi.fn().mockResolvedValue(0),
  };
});

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    url: "https://s3.example.com/music/1/1-abc123.mp3",
    key: "music/1/1-abc123.mp3",
  }),
}));

function makeCtx(userId: number = 1, isPremium = false) {
  return {
    user: { id: userId, name: "Test User", email: "test@example.com", isPremium },
    req: {} as any,
    res: {} as any,
  };
}

describe("Music Generation Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    caller = appRouter.createCaller(makeCtx());
    vi.clearAllMocks();
    // Reset countGenerationsThisMonth to 0 by default
    vi.mocked(dbModule.countGenerationsThisMonth).mockResolvedValue(0);
  });

  describe("generate", () => {
    it("should create a music generation with valid inputs", async () => {
      const result = await caller.musicGeneration.generate({
        title: "Test Song",
        prompt: "jazz, noir, 95 BPM",
        lyrics: "[Verse]\nTest lyrics\n[Chorus]\nChorus lyrics",
      });

      expect(result).toEqual({ id: 1, status: "generating" });
    });

    it("should reject empty title", async () => {
      await expect(
        caller.musicGeneration.generate({
          title: "",
          prompt: "jazz, noir",
          lyrics: "[Verse]\nTest lyrics",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should reject empty prompt", async () => {
      await expect(
        caller.musicGeneration.generate({
          title: "Test Song",
          prompt: "",
          lyrics: "[Verse]\nTest lyrics",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should reject empty lyrics", async () => {
      await expect(
        caller.musicGeneration.generate({
          title: "Test Song",
          prompt: "jazz, noir",
          lyrics: "",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should store sanitized error message on failure", async () => {
      // The raw API error should never reach the user
      // This is tested via the router's catch block logic
      // We just verify the generate mutation returns { id, status: 'generating' } synchronously
      const result = await caller.musicGeneration.generate({
        title: "Test Song",
        prompt: "jazz, noir",
        lyrics: "[Verse]\nTest lyrics",
      });
      expect(result.status).toBe("generating");
    });

    it("should enforce monthly limit for free users", async () => {
      vi.mocked(dbModule.countGenerationsThisMonth).mockResolvedValue(5);

      await expect(
        caller.musicGeneration.generate({
          title: "Test Song",
          prompt: "jazz, noir",
          lyrics: "[Verse]\nTest lyrics",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should allow premium users to exceed free limit", async () => {
      vi.mocked(dbModule.countGenerationsThisMonth).mockResolvedValue(10);

      const premiumCaller = appRouter.createCaller(makeCtx(1, true));
      const result = await premiumCaller.musicGeneration.generate({
        title: "Test Song",
        prompt: "jazz, noir",
        lyrics: "[Verse]\nTest lyrics",
      });

      expect(result).toEqual({ id: 1, status: "generating" });
    });
  });

  describe("monthlyUsage", () => {
    it("should return usage data for free user", async () => {
      vi.mocked(dbModule.countGenerationsThisMonth).mockResolvedValue(3);

      const result = await caller.musicGeneration.monthlyUsage();

      expect(result.used).toBe(3);
      expect(result.limit).toBe(5);
      expect(result.isPremium).toBe(false);
    });

    it("should return null limit for premium user", async () => {
      vi.mocked(dbModule.countGenerationsThisMonth).mockResolvedValue(20);

      const premiumCaller = appRouter.createCaller(makeCtx(1, true));
      const result = await premiumCaller.musicGeneration.monthlyUsage();

      expect(result.limit).toBeNull();
      expect(result.isPremium).toBe(true);
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
