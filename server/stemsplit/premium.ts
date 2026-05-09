/**
 * Premium Gating for Stem Splitter
 * Enforces usage limits: 5 free splits per month, unlimited for premium users
 */

import { getDb } from "../db";
import { stemSplitUsage, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const FREE_TIER_MONTHLY_LIMIT = 5;

/**
 * Get current month's stem split usage for a user
 */
export async function getUserMonthlyUsage(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  const result = await db
    .select({ count: stemSplitUsage.count })
    .from(stemSplitUsage)
    .where(
      and(
        eq(stemSplitUsage.userId, userId),
        eq(stemSplitUsage.year, year),
        eq(stemSplitUsage.month, month)
      )
    )
    .limit(1)
    .then((rows: any[]) => rows[0]);

  return result?.count ?? 0;
}

/**
 * Check if user can perform a stem split
 * Returns { allowed: boolean, remainingThisMonth: number, isPremium: boolean }
 */
export async function canPerformStemSplit(userId: number): Promise<{
  allowed: boolean;
  remainingThisMonth: number;
  isPremium: boolean;
  message?: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Check if user is premium
  const user = await db
    .select({ isPremium: users.isPremium })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows: any[]) => rows[0]);

  if (!user) {
    throw new Error("User not found");
  }

  // Premium users have unlimited splits
  if (user.isPremium) {
    return {
      allowed: true,
      remainingThisMonth: Infinity,
      isPremium: true,
    };
  }

  // Check free tier usage
  const currentUsage = await getUserMonthlyUsage(userId);
  const remaining = Math.max(0, FREE_TIER_MONTHLY_LIMIT - currentUsage);

  if (remaining <= 0) {
    return {
      allowed: false,
      remainingThisMonth: 0,
      isPremium: false,
      message: `You've used all ${FREE_TIER_MONTHLY_LIMIT} free stem splits this month. Upgrade to Premium for unlimited splits.`,
    };
  }

  return {
    allowed: true,
    remainingThisMonth: remaining,
    isPremium: false,
  };
}

/**
 * Increment user's monthly stem split usage
 */
export async function incrementStemSplitUsage(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  // Check if record exists for this month
  const existing = await db
    .select({ id: stemSplitUsage.id })
    .from(stemSplitUsage)
    .where(
      and(
        eq(stemSplitUsage.userId, userId),
        eq(stemSplitUsage.year, year),
        eq(stemSplitUsage.month, month)
      )
    )
    .limit(1)
    .then((rows: any[]) => rows[0]);

  if (existing) {
    // Increment existing record by fetching, incrementing, and updating
    const current = await db
      .select({ count: stemSplitUsage.count })
      .from(stemSplitUsage)
      .where(eq(stemSplitUsage.id, existing.id))
      .limit(1)
      .then((rows: any[]) => rows[0]);

    if (current) {
      await db
        .update(stemSplitUsage)
        .set({
          count: current.count + 1,
          updatedAt: new Date(),
        })
        .where(eq(stemSplitUsage.id, existing.id));
    }
  } else {
    // Create new record
    await db.insert(stemSplitUsage).values({
      userId,
      year,
      month,
      count: 1,
    });
  }
}

/**
 * Get remaining splits for user this month (for UI display)
 */
export async function getRemainingMonthlyLimit(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Check if user is premium
  const user = await db
    .select({ isPremium: users.isPremium })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows: any[]) => rows[0]);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isPremium) {
    return Infinity;
  }

  const currentUsage = await getUserMonthlyUsage(userId);
  return Math.max(0, FREE_TIER_MONTHLY_LIMIT - currentUsage);
}
