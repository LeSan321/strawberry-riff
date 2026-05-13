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
  markGenerationAsSplit,
} from "../stemsplit/db";
import { canPerformStemSplit, incrementStemSplitUsage, getRemainingMonthlyLimit } from "../stemsplit/premium";
import { mixStems, cleanupFile } from "../stemsplit/mixer";
import { storagePut } from "../storage";


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
        console.log(`[StemSplit] Job ${jobId} status:`, jobStatus.status);
        
        // If job is complete, update database with stems
        if (jobStatus.status === "COMPLETED" && jobStatus.outputs) {
          const { updateStemSplitStems, updateStemSplitStatus } = await import('../stemsplit/db');
          await updateStemSplitStems(jobId, {
            vocalUrl: jobStatus.outputs.vocals?.url,
            drumsUrl: jobStatus.outputs.drums?.url,
            bassUrl: jobStatus.outputs.bass?.url,
            otherUrl: jobStatus.outputs.other?.url,
            pianoUrl: jobStatus.outputs.piano?.url,
          });
          await updateStemSplitStatus(jobId, "completed");
          
          // Mark the generation as split
          await markGenerationAsSplit(stemSplit.trackId);
          
          return {
            jobId,
            status: "completed",
            stems: {
              vocalUrl: jobStatus.outputs.vocals?.url,
              drumsUrl: jobStatus.outputs.drums?.url,
              bassUrl: jobStatus.outputs.bass?.url,
              otherUrl: jobStatus.outputs.other?.url,
              pianoUrl: jobStatus.outputs.piano?.url,
            },
            completedAt: new Date(),
          };
        }
        
        // If job failed, update database
        if (jobStatus.status === "FAILED") {
          const { updateStemSplitStatus } = await import('../stemsplit/db');
          await updateStemSplitStatus(jobId, "failed");
          return {
            jobId,
            status: "failed",
            error: jobStatus.errorMessage || "Job failed",
          };
        }
        
        // Still processing - normalize status to lowercase
        return {
          jobId,
          status: jobStatus.status?.toLowerCase() || "processing",
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
   * Download all stems as a ZIP file
   * Server-side ZIP creation to avoid CORS issues
   */
  downloadStemsZip: protectedProcedure
    .input(
      z.object({
        generationId: z.number().int().positive("Generation ID must be a positive integer"),
      })
    )
    .mutation(async ({ input, ctx }) => {
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
        throw new Error("You do not have permission to download these stems");
      }

      try {
        const stemSplit = await getTrackStemSplit(generationId);

        if (!stemSplit || stemSplit.status !== "completed") {
          throw new Error("Stems not ready for download");
        }

        // Check that at least one stem URL exists
        if (!stemSplit.vocalUrl && !stemSplit.drumsUrl && !stemSplit.bassUrl && !stemSplit.otherUrl && !stemSplit.pianoUrl) {
          throw new Error("No stem URLs available");
        }

        // Return stem URLs for server-side processing
        return {
          success: true,
          stems: {
            vocalUrl: stemSplit.vocalUrl,
            drumsUrl: stemSplit.drumsUrl,
            bassUrl: stemSplit.bassUrl,
            otherUrl: stemSplit.otherUrl,
            pianoUrl: stemSplit.pianoUrl,
          },
          trackTitle: generation.title || "stems",
        };
      } catch (error) {
        console.error("[StemSplit] Error preparing stems for download:", error);
        throw new Error("Failed to prepare stems for download: " + (error as Error).message);
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

  /**
   * Export a custom mix with user-adjusted stem volumes
   * Mixes stems server-side using ffmpeg and uploads to S3
   */
  exportCustomMix: protectedProcedure
    .input(
      z.object({
        generationId: z.number().int().positive("Generation ID must be a positive integer"),
        stemVolumes: z.object({
          Vocals: z.number().min(0).max(100),
          Instrumental: z.number().min(0).max(100),
          Drums: z.number().min(0).max(100),
          Bass: z.number().min(0).max(100),
          Other: z.number().min(0).max(100),
        }),
        mixName: z.string().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { generationId, stemVolumes, mixName } = input;
      const userId = ctx.user.id;

      console.log(`[Export] User ${userId} exporting custom mix for generation ${generationId}`);
      console.log(`[Export] Stem volumes:`, stemVolumes);

      // Verify generation exists and belongs to the user
      const { getDb } = await import("../db");
      const { musicGenerations } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
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
        throw new Error("You do not have permission to export this mix");
      }

      try {
        // Get stem split data
        const stemSplit = await getTrackStemSplit(generationId);

        if (!stemSplit || stemSplit.status !== "completed") {
          throw new Error("Stems not ready for export");
        }

        // Build stems array with volumes - filter out null URLs
        const allStems = [
          stemSplit.vocalUrl ? { url: stemSplit.vocalUrl, volume: stemVolumes.Vocals, name: "Vocals" } : null,
          stemSplit.drumsUrl ? { url: stemSplit.drumsUrl, volume: stemVolumes.Drums, name: "Drums" } : null,
          stemSplit.bassUrl ? { url: stemSplit.bassUrl, volume: stemVolumes.Bass, name: "Bass" } : null,
          stemSplit.otherUrl ? { url: stemSplit.otherUrl, volume: stemVolumes.Instrumental, name: "Instrumental" } : null,
          stemSplit.pianoUrl ? { url: stemSplit.pianoUrl, volume: stemVolumes.Other, name: "Other" } : null,
        ];
        const stemsToMix = allStems.filter((stem): stem is { url: string; volume: number; name: string } => stem !== null && stem.volume > 0);

        if (stemsToMix.length === 0) {
          throw new Error("All stems are muted - nothing to mix");
        }

        console.log(`[Export] Mixing ${stemsToMix.length} stems...`);

        // Mix stems using ffmpeg
        const mixedFilePath = await mixStems(stemsToMix);

        try {
          // Read the mixed file
          const { readFile } = await import("fs/promises");
          const audioBuffer = await readFile(mixedFilePath);

          // Upload to S3
          const fileName = `${generation.title || "mix"}_${mixName || "custom"}_${Date.now()}.mp3`;
          const fileKey = `custom-mixes/${userId}/${fileName}`;

          console.log(`[Export] Uploading mix to S3: ${fileKey}`);
          const { url } = await storagePut(fileKey, audioBuffer, "audio/mpeg");

          console.log(`[Export] Mix exported successfully: ${url}`);

          return {
            success: true,
            url,
            fileName,
            message: "Mix exported successfully",
          };
        } finally {
          // Cleanup the temporary mixed file
          await cleanupFile(mixedFilePath);
        }
      } catch (error) {
        console.error("[Export] Error exporting custom mix:", error);
        throw new Error(`Failed to export custom mix: ${(error as Error).message}`);
      }
    }),
});
