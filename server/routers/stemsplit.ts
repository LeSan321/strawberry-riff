/**
 * StemSplit tRPC Router
 * Procedures for initiating stem splits and checking status
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

import { startStemSplit, getStemSplitStatus } from "../stemsplit/client";
import {
  createStemSplit,
  getStemSplitByJobId,
  getStemSplitById,
  getUserStemSplits,
  getTrackStemSplit,
} from "../stemsplit/db";
import { canPerformStemSplit, incrementStemSplitUsage, getRemainingMonthlyLimit } from "../stemsplit/premium";
import { getTrackById } from "../db";

export const stemsplitRouter = router({
  /**
   * Start a new stem split job for a track
   * Creates a database record and initiates the StemSplit API request
   */
  startStemSplit: protectedProcedure
    .input(
      z.object({
        generationId: z.number().int().positive("Generation ID must be a positive integer"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { generationId } = input;
      const userId = ctx.user.id;

      // Check premium gating
      const premiumCheck = await canPerformStemSplit(userId);
      if (!premiumCheck.allowed) {
      return {
        success: false,
        error: "LIMIT_EXCEEDED",
        message: premiumCheck.message,
        remainingThisMonth: premiumCheck.remainingThisMonth,
        isPremium: premiumCheck.isPremium,
        jobId: null,
        status: null,
      };
      }

      // Verify generation exists and belongs to the user
      const { getDb } = await import('../db');
      const { musicGenerations } = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const generation = await db
        .select()
        .from(musicGenerations)
        .where(eq(musicGenerations.id, generationId))
        .limit(1)
        .then((rows: any[]) => rows[0]);

      if (!generation) {
        throw new Error("Generation not found");
      }

      if (generation.userId !== userId) {
        throw new Error("You can only split stems for your own generations");
      }

      if (generation.status !== "complete") {
        throw new Error("Generation must be complete before splitting stems");
      }

      // Get the generation audio URL
      if (!generation.audioUrl) {
        throw new Error("Generation does not have an audio file");
      }

      try {
        // Start the stem split via StemSplit API
        const stemSplitJob = await startStemSplit(generation.audioUrl);

        // Create database record (use generationId as trackId for now)
        const dbRecord = await createStemSplit(userId, generationId, stemSplitJob.jobId);

        // Increment usage counter
        await incrementStemSplitUsage(userId);

        // Get remaining splits for this month
        const remaining = await getRemainingMonthlyLimit(userId);

      return {
        success: true,
        jobId: stemSplitJob.jobId,
        status: "pending",
        message: "Stem split job started",
        remainingThisMonth: remaining,
        isPremium: premiumCheck.isPremium,
        error: null,
      };
      } catch (error) {
        console.error("[StemSplit] Error starting stem split:", error);
        throw new Error("Failed to start stem split: " + (error as Error).message);
      }
    }),

  /**
   * Get the status of a stem split job
   * Polls the StemSplit API and returns current status
   */
  getStemSplitStatus: protectedProcedure
    .input(
      z.object({
        jobId: z.string().min(1, "Job ID is required"),
      })
    )
    .query(async ({ input, ctx }) => {
      const { jobId } = input;
      const userId = ctx.user.id;

      // Get the stem split record from database
      const stemSplit = await getStemSplitByJobId(jobId);
      if (!stemSplit) {
        throw new Error("Stem split job not found");
      }

      // Verify the user owns this stem split
      if (stemSplit.userId !== userId) {
        throw new Error("You do not have permission to view this stem split");
      }

      // If already completed, return cached results
      if (stemSplit.status === "completed") {
        return {
          jobId,
          status: "completed",
          stems: {
            vocalUrl: stemSplit.vocalUrl,
            drumsUrl: stemSplit.drumsUrl,
            bassUrl: stemSplit.bassUrl,
            otherUrl: stemSplit.otherUrl,
            pianoUrl: stemSplit.pianoUrl,
          },
          completedAt: stemSplit.completedAt,
        };
      }

      // If failed, return error
      if (stemSplit.status === "failed") {
        return {
          jobId,
          status: "failed",
          error: stemSplit.errorMessage || "Unknown error",
        };
      }

      // Poll the StemSplit API for current status
      try {
        const jobStatus = await getStemSplitStatus(jobId);
        return {
          jobId,
          status: jobStatus.status,
        };
      } catch (error) {
        console.error("[StemSplit] Error getting status:", error);
        throw new Error("Failed to get stem split status: " + (error as Error).message);
      }
    }),

  /**
   * Get all stem splits for the current user
   * Returns a list of all stem split jobs with their status
   */
  getUserStemSplits: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    try {
      const stemSplits = await getUserStemSplits(userId);

      return stemSplits.map((split) => ({
        id: split.id,
        jobId: split.jobId,
        trackId: split.trackId,
        status: split.status,
        createdAt: split.createdAt,
        completedAt: split.completedAt,
        stems: split.status === "completed" ? {
          vocalUrl: split.vocalUrl,
          drumsUrl: split.drumsUrl,
          bassUrl: split.bassUrl,
          otherUrl: split.otherUrl,
          pianoUrl: split.pianoUrl,
        } : null,
        error: split.errorMessage,
      }));
    } catch (error) {
      console.error("[StemSplit] Error getting user stem splits:", error);
      throw new Error("Failed to get stem splits: " + (error as Error).message);
    }
  }),



  /**
   * Get stem split for a specific track
   * Returns the most recent stem split for a track
   */
  getTrackStemSplit: protectedProcedure
    .input(
      z.object({
        generationId: z.number().int().positive("Generation ID must be a positive integer"),
      })
    )
    .query(async ({ input, ctx }) => {
      const { generationId } = input;
      const userId = ctx.user.id;

      // Verify generation exists and belongs to the user
      const { getDb } = await import('../db');
      const { musicGenerations } = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const generation = await db
        .select()
        .from(musicGenerations)
        .where(eq(musicGenerations.id, generationId))
        .limit(1)
        .then((rows: any[]) => rows[0]);

      if (!generation) {
        throw new Error("Generation not found");
      }

      if (generation.userId !== userId) {
        throw new Error("You do not have permission to view this generation's stem splits");
      }

      try {
        const stemSplit = await getTrackStemSplit(generationId);

        if (!stemSplit) {
          return null;
        }

        return {
          id: stemSplit.id,
          jobId: stemSplit.jobId,
          status: stemSplit.status,
          createdAt: stemSplit.createdAt,
          completedAt: stemSplit.completedAt,
          stems: stemSplit.status === "completed" ? {
            vocalUrl: stemSplit.vocalUrl,
            drumsUrl: stemSplit.drumsUrl,
            bassUrl: stemSplit.bassUrl,
            otherUrl: stemSplit.otherUrl,
            pianoUrl: stemSplit.pianoUrl,
          } : null,
          error: stemSplit.errorMessage,
        };
      } catch (error) {
        console.error("[StemSplit] Error getting track stem split:", error);
        throw new Error("Failed to get track stem split: " + (error as Error).message);
      }
    }),
});
