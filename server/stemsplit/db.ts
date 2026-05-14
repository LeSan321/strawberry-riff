/**
 * StemSplit Database Helpers
 * CRUD operations for stem split jobs
 */

import { getDb } from "../db";
import { stemSplits } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Create a new stem split job record
 */
export async function createStemSplit(
  userId: number,
  generationId: number,
  jobId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const result = await db.insert(stemSplits).values({
    userId,
    generationId,
    jobId,
    status: "pending",
  });
  return result;
}

/**
 * Get stem split by job ID
 */
export async function getStemSplitByJobId(jobId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(stemSplits).where(eq(stemSplits.jobId, jobId));
  return result[0] || null;
}

/**
 * Get stem split by ID
 */
export async function getStemSplitById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(stemSplits).where(eq(stemSplits.id, id));
  return result[0] || null;
}

/**
 * Get all stem splits for a user
 */
export async function getUserStemSplits(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(stemSplits).where(eq(stemSplits.userId, userId));
}

/**
 * Get stem split for a specific generation
 */
export async function getTrackStemSplit(generationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(stemSplits).where(eq(stemSplits.generationId, generationId));
  return result[0] || null;
}

/**
 * Update stem split status
 */
export async function updateStemSplitStatus(
  jobId: string,
  status: "pending" | "processing" | "completed" | "failed",
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const updateData: any = {
    status,
  };

  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }

  if (status === "completed") {
    updateData.completedAt = new Date();
  }

  return await db
    .update(stemSplits)
    .set(updateData)
    .where(eq(stemSplits.jobId, jobId));
}

/**
 * Update stem split with completed stem URLs
 */
export async function updateStemSplitStems(
  jobId: string,
  stems: {
    vocalUrl?: string;
    drumsUrl?: string;
    bassUrl?: string;
    otherUrl?: string;
    pianoUrl?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .update(stemSplits)
    .set({
      ...stems,
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(stemSplits.jobId, jobId));
}

/**
 * Delete stem split record
 */
export async function deleteStemSplit(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db.delete(stemSplits).where(eq(stemSplits.id, id));
}

/**
 * Mark a music generation as split
 */
export async function markGenerationAsSplit(generationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { musicGenerations } = await import("../../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  return await db
    .update(musicGenerations)
    .set({ isSplit: true })
    .where(eq(musicGenerations.id, generationId));
}

/**
 * Update stem split URLs (used to refresh expired pre-signed URLs)
 */
export async function updateStemSplitUrls(
  id: number,
  urls: {
    vocalUrl?: string | null;
    drumsUrl?: string | null;
    bassUrl?: string | null;
    otherUrl?: string | null;
    pianoUrl?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .update(stemSplits)
    .set(urls)
    .where(eq(stemSplits.id, id));
}
