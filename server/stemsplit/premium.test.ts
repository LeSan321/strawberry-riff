import { describe, it, expect, beforeEach, vi } from "vitest";
import * as premiumModule from "./premium";
import * as dbModule from "../db";
import * as stemSplitUsageModule from "./premium";

/**
 * Premium Gating Tests
 * Tests the premium tier limits for stem splitting
 */

describe("Premium Gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("canPerformStemSplit", () => {
    it("should allow premium users unlimited splits", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValueOnce([{ isPremium: true }]),
      };

      vi.spyOn(dbModule, "getDb").mockResolvedValueOnce(mockDb as any);

      const result = await premiumModule.canPerformStemSplit(1);

      expect(result.allowed).toBe(true);
      expect(result.isPremium).toBe(true);
      expect(result.remainingThisMonth).toBe(Infinity);
    });

    it("should allow free users with remaining splits", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn()
          .mockResolvedValueOnce([{ isPremium: false }]) // First call for user check
          .mockResolvedValueOnce([{ count: 2 }]), // Second call for usage check
      };

      vi.spyOn(dbModule, "getDb").mockResolvedValueOnce(mockDb as any);

      const result = await premiumModule.canPerformStemSplit(1);

      expect(result.allowed).toBe(true);
      expect(result.isPremium).toBe(false);
      expect(result.remainingThisMonth).toBe(3); // 5 - 2 = 3
    });

    it("should reject free users who exceeded limit", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn()
          .mockResolvedValueOnce([{ isPremium: false }]) // First call for user check
          .mockResolvedValueOnce([{ count: 5 }]), // Second call for usage check
      };

      vi.spyOn(dbModule, "getDb").mockResolvedValueOnce(mockDb as any);

      const result = await premiumModule.canPerformStemSplit(1);

      expect(result.allowed).toBe(false);
      expect(result.isPremium).toBe(false);
      expect(result.remainingThisMonth).toBe(0);
      expect(result.message).toContain("upgrade to Premium");
    });

    it("should throw error if user not found", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValueOnce([]), // No user found
      };

      vi.spyOn(dbModule, "getDb").mockResolvedValueOnce(mockDb as any);

      await expect(premiumModule.canPerformStemSplit(999)).rejects.toThrow("User not found");
    });
  });

  describe("getUserMonthlyUsage", () => {
    it("should return 0 if no usage record exists", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValueOnce([]), // No record found
      };

      vi.spyOn(dbModule, "getDb").mockResolvedValueOnce(mockDb as any);

      const usage = await premiumModule.getUserMonthlyUsage(1);

      expect(usage).toBe(0);
    });

    it("should return current month usage", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValueOnce([{ count: 3 }]),
      };

      vi.spyOn(dbModule, "getDb").mockResolvedValueOnce(mockDb as any);

      const usage = await premiumModule.getUserMonthlyUsage(1);

      expect(usage).toBe(3);
    });
  });

  describe("getRemainingMonthlyLimit", () => {
    it("should return Infinity for premium users", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValueOnce([{ isPremium: true }]),
      };

      vi.spyOn(dbModule, "getDb").mockResolvedValueOnce(mockDb as any);

      const remaining = await premiumModule.getRemainingMonthlyLimit(1);

      expect(remaining).toBe(Infinity);
    });

    it("should return correct remaining limit for free users", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn()
          .mockResolvedValueOnce([{ isPremium: false }]) // First call for user check
          .mockResolvedValueOnce([{ count: 2 }]), // Second call for usage check
      };

      vi.spyOn(dbModule, "getDb").mockResolvedValueOnce(mockDb as any);

      const remaining = await premiumModule.getRemainingMonthlyLimit(1);

      expect(remaining).toBe(3); // 5 - 2 = 3
    });

    it("should return 0 when free user hits limit", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn()
          .mockResolvedValueOnce([{ isPremium: false }]) // First call for user check
          .mockResolvedValueOnce([{ count: 5 }]), // Second call for usage check
      };

      vi.spyOn(dbModule, "getDb").mockResolvedValueOnce(mockDb as any);

      const remaining = await premiumModule.getRemainingMonthlyLimit(1);

      expect(remaining).toBe(0);
    });
  });
});
