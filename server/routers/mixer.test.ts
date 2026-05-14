/**
 * Tests for the isolated mixer tRPC router.
 * Verifies that exportCustomMix is completely isolated from stemsplit code paths.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mixerRouter } from "./mixer";

// Mock the database
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

// Mock the mixer utility — completely isolated from stemsplit
vi.mock("../mixer/mixer", () => ({
  mixStems: vi.fn(),
  cleanupFile: vi.fn(),
}));

// Mock S3 storage
vi.mock("../storage", () => ({
  storagePut: vi.fn(),
}));

// Mock fs
vi.mock("fs", () => ({
  readFileSync: vi.fn(() => Buffer.from("fake-audio-data")),
  existsSync: vi.fn(() => true),
  unlinkSync: vi.fn(),
}));

import { getDb } from "../db";
import { mixStems, cleanupFile } from "../mixer/mixer";
import { storagePut } from "../storage";

const mockUser = { id: 1, name: "Test User", email: "test@example.com", role: "user" as const };

function makeCaller(user = mockUser) {
  return mixerRouter.createCaller({
    user,
    req: { headers: { origin: "http://localhost:3000" } } as any,
    res: {} as any,
  });
}

describe("mixerRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exportCustomMix", () => {
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
        caller.exportCustomMix({
          stemSplitId: 999,
          volumes: { vocals: 1, drums: 1, bass: 1, other: 1, piano: 1 },
        })
      ).rejects.toThrow("Stem split not found");
    });

    it("should reject if stem split is not completed", async () => {
      const mockRecord = {
        id: 1,
        userId: 1,
        status: "pending",
        vocalUrl: null,
        drumsUrl: null,
        bassUrl: null,
        otherUrl: null,
        pianoUrl: null,
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
        caller.exportCustomMix({
          stemSplitId: 1,
          volumes: { vocals: 1, drums: 1, bass: 1, other: 1, piano: 1 },
        })
      ).rejects.toThrow("not yet completed");
    });

    it("should successfully mix and upload stems", async () => {
      const mockRecord = {
        id: 1,
        userId: 1,
        status: "completed",
        vocalUrl: "https://example.com/vocals.mp3",
        drumsUrl: "https://example.com/drums.mp3",
        bassUrl: "https://example.com/bass.mp3",
        otherUrl: "https://example.com/other.mp3",
        pianoUrl: null,
      };
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockRecord]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(mixStems).mockResolvedValue("/tmp/mixed-output.mp3");
      vi.mocked(storagePut).mockResolvedValue({ url: "https://s3.example.com/custom-mix.mp3", key: "custom-mixes/1/1-123.mp3" });

      const caller = makeCaller();
      const result = await caller.exportCustomMix({
        stemSplitId: 1,
        volumes: { vocals: 1, drums: 0.8, bass: 1.2, other: 0.5, piano: 1 },
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe("https://s3.example.com/custom-mix.mp3");

      // Verify mixer was called with correct volumes
      expect(mixStems).toHaveBeenCalledWith(
        expect.objectContaining({
          vocalUrl: mockRecord.vocalUrl,
          drumsUrl: mockRecord.drumsUrl,
        }),
        expect.objectContaining({
          vocals: 1,
          drums: 0.8,
          bass: 1.2,
        })
      );

      // Verify cleanup was called
      expect(cleanupFile).toHaveBeenCalledWith("/tmp/mixed-output.mp3");
    });

    it("should NOT import anything from stemsplit directory", async () => {
      // Verify isolation: mixer router should have no stemsplit imports
      const mixerRouterSource = await import("fs").then((fs) =>
        (fs as any).readFileSync("/home/ubuntu/strawberry-riff/server/routers/mixer.ts", "utf-8")
      );
      expect(mixerRouterSource).not.toContain("stemsplit");
      expect(mixerRouterSource).not.toContain("../stemsplit");
    });

    it("should validate volume range (0-2)", async () => {
      const caller = makeCaller();
      await expect(
        caller.exportCustomMix({
          stemSplitId: 1,
          volumes: { vocals: 3, drums: 1, bass: 1, other: 1, piano: 1 }, // vocals > 2
        })
      ).rejects.toThrow();
    });

    it("should validate negative volumes", async () => {
      const caller = makeCaller();
      await expect(
        caller.exportCustomMix({
          stemSplitId: 1,
          volumes: { vocals: -0.1, drums: 1, bass: 1, other: 1, piano: 1 }, // vocals < 0
        })
      ).rejects.toThrow();
    });
  });
});
