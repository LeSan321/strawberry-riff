/**
 * Tests for the isolated mixer tRPC router.
 * Verifies that saveMixToRiffs is completely isolated from stemsplit code paths,
 * correctly validates input, and creates track records on success.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mixerRouter } from "./mixer";

// Mock the database (getDb + createTrack)
vi.mock("../db", () => ({
  getDb: vi.fn(),
  createTrack: vi.fn(),
}));

// Mock S3 storage
vi.mock("../storage", () => ({
  storagePut: vi.fn(),
}));

// Mock nanoid for deterministic keys
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test-nanoid-12"),
}));

import { getDb, createTrack } from "../db";
import { storagePut } from "../storage";

const mockUser = { id: 1, name: "Test User", email: "test@example.com", role: "user" as const };

function makeCaller(user = mockUser) {
  return mixerRouter.createCaller({
    user,
    req: { headers: { origin: "http://localhost:3000" } } as any,
    res: {} as any,
  });
}

// Minimal valid base64 WAV (just a few bytes — enough to pass the z.string().min(1) check)
const FAKE_WAV_BASE64 = Buffer.from("RIFF").toString("base64");

describe("mixerRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveMixToRiffs", () => {
    it("should reject if stem split record not found", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = makeCaller();
      await expect(
        caller.saveMixToRiffs({
          stemSplitId: 999,
          audioBase64: FAKE_WAV_BASE64,
          mimeType: "audio/wav",
          title: "My Mix",
        })
      ).rejects.toThrow("Stem split not found");
    });

    it("should reject if stem split is not completed", async () => {
      const mockRecord = {
        id: 1,
        userId: 1,
        status: "pending",
      };
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockRecord]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = makeCaller();
      await expect(
        caller.saveMixToRiffs({
          stemSplitId: 1,
          audioBase64: FAKE_WAV_BASE64,
          mimeType: "audio/wav",
          title: "My Mix",
        })
      ).rejects.toThrow("not yet completed");
    });

    it("should upload audio to S3 and create a track record on success", async () => {
      const mockRecord = {
        id: 1,
        userId: 1,
        status: "completed",
      };
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockRecord]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(storagePut).mockResolvedValue({
        url: "https://s3.example.com/custom-mixes/1/test-nanoid-12.wav",
        key: "custom-mixes/1/test-nanoid-12.wav",
      });
      vi.mocked(createTrack).mockResolvedValue(42);

      const caller = makeCaller();
      const result = await caller.saveMixToRiffs({
        stemSplitId: 1,
        audioBase64: FAKE_WAV_BASE64,
        mimeType: "audio/wav",
        title: "My Custom Mix",
        duration: 180,
      });

      expect(result.success).toBe(true);
      expect(result.trackId).toBe(42);
      expect(result.audioUrl).toBe("https://s3.example.com/custom-mixes/1/test-nanoid-12.wav");

      // Verify S3 upload was called with correct content type
      expect(storagePut).toHaveBeenCalledWith(
        expect.stringContaining("custom-mixes/1/"),
        expect.any(Buffer),
        "audio/wav"
      );

      // Verify track was created with correct fields
      expect(createTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          title: "My Custom Mix (Custom Mix)",
          audioUrl: "https://s3.example.com/custom-mixes/1/test-nanoid-12.wav",
          duration: 180,
          visibility: "private",
        })
      );
    });

    it("should NOT have import statements from the stemsplit server directory", async () => {
      // Verify isolation: mixer router must NOT import from server/stemsplit/ (the job pipeline)
      // It MAY reference the stemSplits DB table from drizzle/schema — that's read-only and fine.
      // Note: comments mentioning 'stemsplit' are fine; only import statements are checked.
      const { readFileSync } = await import("fs");
      const mixerRouterSource = readFileSync(
        "/home/ubuntu/strawberry-riff/server/routers/mixer.ts",
        "utf-8"
      );
      // Extract only import lines and check none point to the stemsplit server directory
      const importLines = mixerRouterSource
        .split("\n")
        .filter((line: string) => line.trim().startsWith("import"));
      const stemsplitImports = importLines.filter((line: string) => line.includes("stemsplit"));
      expect(stemsplitImports).toHaveLength(0);
    });

    it("should reject empty audioBase64", async () => {
      const caller = makeCaller();
      await expect(
        caller.saveMixToRiffs({
          stemSplitId: 1,
          audioBase64: "",
          mimeType: "audio/wav",
          title: "My Mix",
        })
      ).rejects.toThrow();
    });

    it("should reject invalid mimeType", async () => {
      const caller = makeCaller();
      await expect(
        caller.saveMixToRiffs({
          stemSplitId: 1,
          audioBase64: FAKE_WAV_BASE64,
          mimeType: "audio/ogg" as any,
          title: "My Mix",
        })
      ).rejects.toThrow();
    });
  });
});
