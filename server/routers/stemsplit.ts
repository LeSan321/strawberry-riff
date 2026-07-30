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
import { resolveAudioUrl, storagePut } from "../storage";
import { getDb } from "../db";
import { musicGenerations } from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Download a stem file from a (potentially expiring) URL and re-upload to our R2 bucket.
 * Returns a permanent public R2 URL, or null if download/upload fails.
 */
async function mirrorStemToR2(
  stemUrl: string | undefined | null,
  stemName: string,
  generationId: number
): Promise<string | null> {
  if (!stemUrl) return null;
  try {
    const res = await fetch(stemUrl);
    if (!res.ok) {
      console.warn(`[StemSplit] Failed to download ${stemName} stem (HTTP ${res.status}): ${stemUrl.slice(0, 80)}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const key = `stems/${generationId}/${stemName}-${Date.now()}.mp3`;
    const { url } = await storagePut(key, buffer, 'audio/mpeg');
    console.log(`[StemSplit] Mirrored ${stemName} stem → ${url}`);
    return url;
  } catch (err) {
    console.warn(`[StemSplit] Error mirroring ${stemName} stem:`, err);
    return null;
  }
}


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
        // The StemSplit API must be able to fetch the audio file.
        // Our S3 bucket is private, so we must pass a presigned GET URL
        // (valid 24h) rather than the raw storage path.
        const publicAudioUrl = await resolveAudioUrl(generation.audioUrl);
        console.log(`[StemSplit] Resolved audio URL for generationId=${generationId}: ${publicAudioUrl.slice(0, 120)}...`);

        // Start the stem split via StemSplit API
        const stemSplitJob = await startStemSplit(publicAudioUrl);

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
            guitarUrl: stemSplit.guitarUrl,
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
        
        // If job is complete, mirror stems to R2 then update database with permanent URLs
        if (jobStatus.status === "COMPLETED" && jobStatus.outputs) {
          const { updateStemSplitStems, updateStemSplitStatus } = await import('../stemsplit/db');
          const gId = stemSplit.generationId;

          // Download each stem from StemSplit's expiring presigned URLs and re-upload to our R2
          console.log(`[StemSplit] Mirroring stems to R2 for generationId=${gId}...`);
          const [vocalUrl, drumsUrl, bassUrl, otherUrl, pianoUrl, guitarUrl] = await Promise.all([
            mirrorStemToR2(jobStatus.outputs.vocals?.url, 'vocals', gId),
            mirrorStemToR2(jobStatus.outputs.drums?.url, 'drums', gId),
            mirrorStemToR2(jobStatus.outputs.bass?.url, 'bass', gId),
            mirrorStemToR2(jobStatus.outputs.other?.url, 'other', gId),
            mirrorStemToR2(jobStatus.outputs.piano?.url, 'piano', gId),
            mirrorStemToR2(jobStatus.outputs.guitar?.url, 'guitar', gId),
          ]);

          await updateStemSplitStems(jobId, {
            vocalUrl: vocalUrl ?? jobStatus.outputs.vocals?.url,
            drumsUrl: drumsUrl ?? jobStatus.outputs.drums?.url,
            bassUrl: bassUrl ?? jobStatus.outputs.bass?.url,
            otherUrl: otherUrl ?? jobStatus.outputs.other?.url,
            pianoUrl: pianoUrl ?? jobStatus.outputs.piano?.url,
            guitarUrl: guitarUrl ?? jobStatus.outputs.guitar?.url,
          });
          await updateStemSplitStatus(jobId, "completed");
          
          // Mark the generation as split
          await markGenerationAsSplit(stemSplit.generationId);
          
          const stems = {
            vocalUrl: vocalUrl ?? jobStatus.outputs.vocals?.url,
            drumsUrl: drumsUrl ?? jobStatus.outputs.drums?.url,
            bassUrl: bassUrl ?? jobStatus.outputs.bass?.url,
            otherUrl: otherUrl ?? jobStatus.outputs.other?.url,
            pianoUrl: pianoUrl ?? jobStatus.outputs.piano?.url,
            guitarUrl: guitarUrl ?? jobStatus.outputs.guitar?.url,
          };

          return {
            jobId,
            status: "completed",
            stems,
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
      const splits = await getUserStemSplits(userId);
      // Batch-fetch generation titles so the Blend tab can show track names
      const generationIds = Array.from(new Set(splits.map((s) => s.generationId)));
      let titleMap: Record<number, string> = {};
      if (generationIds.length > 0) {
        const db = await getDb();
        if (db) {
          const gens = await db
            .select({ id: musicGenerations.id, title: musicGenerations.title })
            .from(musicGenerations)
            .where(inArray(musicGenerations.id, generationIds));
          titleMap = Object.fromEntries(gens.map((g) => [g.id, g.title]));
        }
      }
      return splits.map((split) => ({
        id: split.id,
        jobId: split.jobId,
        generationId: split.generationId,
        generationTitle: titleMap[split.generationId] ?? null,
        status: split.status,
        createdAt: split.createdAt,
        completedAt: split.completedAt,
        stems: split.status === "completed" ? {
          vocalUrl: split.vocalUrl,
          drumsUrl: split.drumsUrl,
          bassUrl: split.bassUrl,
          otherUrl: split.otherUrl,
          pianoUrl: split.pianoUrl,
          guitarUrl: split.guitarUrl,
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
        if (!stemSplit.vocalUrl && !stemSplit.drumsUrl && !stemSplit.bassUrl && !stemSplit.otherUrl && !stemSplit.pianoUrl && !stemSplit.guitarUrl) {
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
            guitarUrl: stemSplit.guitarUrl,
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
            guitarUrl: stemSplit.guitarUrl,
          } : null,
          error: stemSplit.errorMessage,
        };
      } catch (error) {
        console.error("[StemSplit] Error getting track stem split:", error);
        throw new Error("Failed to get track stem split: " + (error as Error).message);
      }
    }),
});
