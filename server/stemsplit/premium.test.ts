import { describe, it, expect, afterEach } from "vitest";
import { getDb } from "../db";
import { users, stemSplitUsage } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  canPerformStemSplit,
  getUserMonthlyUsage,
  getRemainingMonthlyLimit,
} from "./premium";

/**
 * Premium Gating Integration Tests
 * Uses the real test database to verify premium tier limits.
 * Test users are created with IDs in the 99900-99999 range and cleaned up after each test.
 */

const TEST_USER_ID_BASE = 99900;
let testUserCounter = 0;

function nextTestUserId() {
  return TEST_USER_ID_BASE + testUserCounter++;
}

const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth() + 1;

async function createTestUser(userId: number, isPremium: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(users).values({
    id: userId,
    openId: `test-open-id-${userId}`,
    name: `Test User ${userId}`,
    email: `testuser${userId}@example.com`,
    isPremium,
    role: "user",
  }).onDuplicateKeyUpdate({ set: { isPremium } });
}

async function setMonthlyUsage(userId: number, count: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete any existing record for this month
  await db.delete(stemSplitUsage).where(
    and(
      eq(stemSplitUsage.userId, userId),
      eq(stemSplitUsage.year, YEAR),
      eq(stemSplitUsage.month, MONTH),
    )
  );
  if (count > 0) {
    await db.insert(stemSplitUsage).values({
      userId,
      year: YEAR,
      month: MONTH,
      count,
    });
  }
}

async function cleanupTestUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(stemSplitUsage).where(eq(stemSplitUsage.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

describe("Premium Gating", () => {
  const createdUserIds: number[] = [];

  afterEach(async () => {
    for (const id of createdUserIds) {
      await cleanupTestUser(id).catch(() => {});
    }
    createdUserIds.length = 0;
  });

  // ── canPerformStemSplit ──────────────────────────────────────────────────────
  describe("canPerformStemSplit", () => {
    it("should allow premium users unlimited splits", async () => {
      const userId = nextTestUserId();
      createdUserIds.push(userId);
      await createTestUser(userId, true);

      const result = await canPerformStemSplit(userId);

      expect(result.allowed).toBe(true);
      expect(result.isPremium).toBe(true);
      expect(result.remainingThisMonth).toBe(Infinity);
    });

    it("should allow free users with remaining splits", async () => {
      const userId = nextTestUserId();
      createdUserIds.push(userId);
      await createTestUser(userId, false);
      await setMonthlyUsage(userId, 2);

      const result = await canPerformStemSplit(userId);

      expect(result.allowed).toBe(true);
      expect(result.isPremium).toBe(false);
      expect(result.remainingThisMonth).toBe(3); // 5 - 2 = 3
    });

    it("should reject free users who exceeded limit", async () => {
      const userId = nextTestUserId();
      createdUserIds.push(userId);
      await createTestUser(userId, false);
      await setMonthlyUsage(userId, 5);

      const result = await canPerformStemSplit(userId);

      expect(result.allowed).toBe(false);
      expect(result.isPremium).toBe(false);
      expect(result.remainingThisMonth).toBe(0);
      expect(result.message).toContain("Upgrade to Premium");
    });

    it("should throw error if user not found", async () => {
      // Use an ID that definitely doesn't exist
      await expect(canPerformStemSplit(9999999)).rejects.toThrow("User not found");
    });
  });

  // ── getUserMonthlyUsage ──────────────────────────────────────────────────────
  describe("getUserMonthlyUsage", () => {
    it("should return 0 if no usage record exists", async () => {
      const userId = nextTestUserId();
      createdUserIds.push(userId);
      await createTestUser(userId, false);
      // No usage record created

      const usage = await getUserMonthlyUsage(userId);

      expect(usage).toBe(0);
    });

    it("should return current month usage", async () => {
      const userId = nextTestUserId();
      createdUserIds.push(userId);
      await createTestUser(userId, false);
      await setMonthlyUsage(userId, 3);

      const usage = await getUserMonthlyUsage(userId);

      expect(usage).toBe(3);
    });
  });

  // ── getRemainingMonthlyLimit ─────────────────────────────────────────────────
  describe("getRemainingMonthlyLimit", () => {
    it("should return Infinity for premium users", async () => {
      const userId = nextTestUserId();
      createdUserIds.push(userId);
      await createTestUser(userId, true);

      const remaining = await getRemainingMonthlyLimit(userId);

      expect(remaining).toBe(Infinity);
    });

    it("should return correct remaining limit for free users", async () => {
      const userId = nextTestUserId();
      createdUserIds.push(userId);
      await createTestUser(userId, false);
      await setMonthlyUsage(userId, 2);

      const remaining = await getRemainingMonthlyLimit(userId);

      expect(remaining).toBe(3); // 5 - 2 = 3
    });

    it("should return 0 when free user hits limit", async () => {
      const userId = nextTestUserId();
      createdUserIds.push(userId);
      await createTestUser(userId, false);
      await setMonthlyUsage(userId, 5);

      const remaining = await getRemainingMonthlyLimit(userId);

      expect(remaining).toBe(0);
    });
  });
});
