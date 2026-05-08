import { describe, it, expect, beforeEach, vi } from "vitest";
import { stemsplitRouter } from "./stemsplit";
import * as db from "../db";
import * as stemSplitDb from "../stemsplit/db";
import * as stemSplitClient from "../stemsplit/client";

/**
 * StemSplit tRPC Router Tests
 * Tests the tRPC procedures for stem splitting
 */

describe("StemSplit tRPC Router", () => {
  const mockUser = { id: 1, email: "test@example.com" };
  const mockTrack = {
    id: 1,
    userId: 1,
    title: "Test Track",
    audioUrl: "https://example.com/audio.mp3",
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("startStemSplit", () => {
    it("should start a stem split for a user's track", async () => {
      const caller = stemsplitRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      vi.spyOn(db, "getTrackById").mockResolvedValueOnce(mockTrack as any);
      vi.spyOn(stemSplitClient, "startStemSplit").mockResolvedValueOnce({
        jobId: "job-123",
        status: "pending",
      } as any);
      vi.spyOn(stemSplitDb, "createStemSplit").mockResolvedValueOnce({ insertId: 1 } as any);

      const result = await caller.startStemSplit({ trackId: 1 });

      expect(result).toEqual({
        success: true,
        jobId: "job-123",
        status: "pending",
        message: "Stem split job started",
      });
      expect(stemSplitClient.startStemSplit).toHaveBeenCalledWith(mockTrack.audioUrl);
      expect(stemSplitDb.createStemSplit).toHaveBeenCalledWith(mockUser.id, 1, "job-123");
    });

    it("should reject if track not found", async () => {
      const caller = stemsplitRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      vi.spyOn(db, "getTrackById").mockResolvedValueOnce(null);

      await expect(caller.startStemSplit({ trackId: 999 })).rejects.toThrow("Track not found");
    });

    it("should reject if track belongs to another user", async () => {
      const caller = stemsplitRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const otherUserTrack = { ...mockTrack, userId: 999 };
      vi.spyOn(db, "getTrackById").mockResolvedValueOnce(otherUserTrack as any);

      await expect(caller.startStemSplit({ trackId: 1 })).rejects.toThrow(
        "You can only split stems for your own tracks"
      );
    });

    it("should reject if track has no audio URL", async () => {
      const caller = stemsplitRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const trackNoAudio = { ...mockTrack, audioUrl: null };
      vi.spyOn(db, "getTrackById").mockResolvedValueOnce(trackNoAudio as any);

      await expect(caller.startStemSplit({ trackId: 1 })).rejects.toThrow(
        "Track does not have an audio file"
      );
    });

    it("should reject if stem split already in progress", async () => {
      const caller = stemsplitRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      vi.spyOn(db, "getTrackById").mockResolvedValueOnce(mockTrack as any);
      vi.spyOn(stemSplitDb, "getTrackStemSplit").mockResolvedValueOnce({
        id: 1,
        status: "processing",
      } as any);

      await expect(caller.startStemSplit({ trackId: 1 })).rejects.toThrow(
        "A stem split is already in progress for this track"
      );
    });
  });

  describe("getStemSplitStatus", () => {
    it("should return completed status with stems", async () => {
      const caller = stemsplitRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const completedSplit = {
        id: 1,
        jobId: "job-123",
        userId: mockUser.id,
        status: "completed",
        vocalUrl: "https://example.com/vocals.mp3",
        drumsUrl: "https://example.com/drums.mp3",
        bassUrl: "https://example.com/bass.mp3",
        otherUrl: "https://example.com/other.mp3",
        pianoUrl: "https://example.com/piano.mp3",
        completedAt: new Date(),
      };

      vi.spyOn(stemSplitDb, "getStemSplitByJobId").mockResolvedValueOnce(completedSplit as any);

      const result = await caller.getStemSplitStatus({ jobId: "job-123" });

      expect(result.status).toBe("completed");
      expect(result.stems).toEqual({
        vocalUrl: completedSplit.vocalUrl,
        drumsUrl: completedSplit.drumsUrl,
        bassUrl: completedSplit.bassUrl,
        otherUrl: completedSplit.otherUrl,
        pianoUrl: completedSplit.pianoUrl,
      });
    });

    it("should return failed status with error", async () => {
      const caller = stemsplitRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const failedSplit = {
        id: 1,
        jobId: "job-456",
        userId: mockUser.id,
        status: "failed",
        errorMessage: "Audio file format not supported",
      };

      vi.spyOn(stemSplitDb, "getStemSplitByJobId").mockResolvedValueOnce(failedSplit as any);

      const result = await caller.getStemSplitStatus({ jobId: "job-456" });

      expect(result.status).toBe("failed");
      expect(result.error).toBe("Audio file format not supported");
    });

    it("should reject if job not found", async () => {
      const caller = stemsplitRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      vi.spyOn(stemSplitDb, "getStemSplitByJobId").mockResolvedValueOnce(null);

      await expect(caller.getStemSplitStatus({ jobId: "non-existent" })).rejects.toThrow(
        "Stem split job not found"
      );
    });

    it("should reject if user does not own the job", async () => {
      const caller = stemsplitRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const otherUserSplit = {
        id: 1,
        jobId: "job-123",
        userId: 999,
        status: "processing",
      };

      vi.spyOn(stemSplitDb, "getStemSplitByJobId").mockResolvedValueOnce(otherUserSplit as any);

      await expect(caller.getStemSplitStatus({ jobId: "job-123" })).rejects.toThrow(
        "You do not have permission to view this stem split"
      );
    });
  });

  describe("getUserStemSplits", () => {
    it("should return user's stem splits", async () => {
      const caller = stemsplitRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const userSplits = [
        {
          id: 1,
          jobId: "job-1",
          trackId: 1,
          userId: mockUser.id,
          status: "completed",
          createdAt: new Date(),
          completedAt: new Date(),
          vocalUrl: "https://example.com/vocals.mp3",
          drumsUrl: "https://example.com/drums.mp3",
          bassUrl: null,
          otherUrl: null,
          pianoUrl: null,
          errorMessage: null,
        },
        {
          id: 2,
          jobId: "job-2",
          trackId: 2,
          userId: mockUser.id,
          status: "processing",
          createdAt: new Date(),
          completedAt: null,
          vocalUrl: null,
          drumsUrl: null,
          bassUrl: null,
          otherUrl: null,
          pianoUrl: null,
          errorMessage: null,
        },
      ];

      vi.spyOn(stemSplitDb, "getUserStemSplits").mockResolvedValueOnce(userSplits as any);

      const result = await caller.getUserStemSplits();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe("completed");
      expect(result[0].stems).toBeDefined();
      expect(result[1].status).toBe("processing");
      expect(result[1].stems).toBeNull();
    });
  });

  describe("getTrackStemSplit", () => {
    it("should return track's stem split", async () => {
      const caller = stemsplitRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const trackSplit = {
        id: 1,
        jobId: "job-123",
        status: "completed",
        createdAt: new Date(),
        completedAt: new Date(),
        vocalUrl: "https://example.com/vocals.mp3",
        drumsUrl: "https://example.com/drums.mp3",
        bassUrl: "https://example.com/bass.mp3",
        otherUrl: "https://example.com/other.mp3",
        pianoUrl: "https://example.com/piano.mp3",
        errorMessage: null,
      };

      vi.spyOn(db, "getTrackById").mockResolvedValueOnce(mockTrack as any);
      vi.spyOn(stemSplitDb, "getTrackStemSplit").mockResolvedValueOnce(trackSplit as any);

      const result = await caller.getTrackStemSplit({ trackId: 1 });

      expect(result).toBeDefined();
      expect(result?.status).toBe("completed");
      expect(result?.stems).toBeDefined();
    });

    it("should return null if no stem split for track", async () => {
      const caller = stemsplitRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      vi.spyOn(db, "getTrackById").mockResolvedValueOnce(mockTrack as any);
      vi.spyOn(stemSplitDb, "getTrackStemSplit").mockResolvedValueOnce(null);

      const result = await caller.getTrackStemSplit({ trackId: 1 });

      expect(result).toBeNull();
    });

    it("should reject if track not found", async () => {
      const caller = stemsplitRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      vi.spyOn(db, "getTrackById").mockResolvedValueOnce(null);

      await expect(caller.getTrackStemSplit({ trackId: 999 })).rejects.toThrow("Track not found");
    });

    it("should reject if user does not own track", async () => {
      const caller = stemsplitRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const otherUserTrack = { ...mockTrack, userId: 999 };
      vi.spyOn(db, "getTrackById").mockResolvedValueOnce(otherUserTrack as any);

      await expect(caller.getTrackStemSplit({ trackId: 1 })).rejects.toThrow(
        "You do not have permission to view this track's stem splits"
      );
    });
  });
});
