/**
 * Mixer tRPC Router
 * Handles custom stem mix export requests.
 *
 * ISOLATION GUARANTEE: This router does NOT import anything from server/stemsplit/.
 * It only reads stem URLs from the database (read-only) and delegates mixing
 * to server/mixer/mixer.ts. The StemSplit job pipeline is completely untouched.
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { stemSplits } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { mixStems, cleanupFile } from "../mixer/mixer";
import { storagePut } from "../storage";
import * as fs from "fs";

export const mixerRouter = router({
  /**
   * Export a custom mix with user-adjusted stem volumes.
   * Reads stem URLs from a completed stem split record (read-only),
   * mixes them server-side with ffmpeg, uploads to S3, and returns the URL.
   */
  exportCustomMix: protectedProcedure
    .input(
      z.object({
        stemSplitId: z.number().int().positive(),
        volumes: z.object({
          vocals: z.number().min(0).max(2).default(1),
          drums: z.number().min(0).max(2).default(1),
          bass: z.number().min(0).max(2).default(1),
          other: z.number().min(0).max(2).default(1),
          piano: z.number().min(0).max(2).default(1),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { stemSplitId, volumes } = input;
      const userId = ctx.user.id;

      // Read-only: fetch the stem split record to get URLs
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const records = await db
        .select()
        .from(stemSplits)
        .where(and(eq(stemSplits.id, stemSplitId), eq(stemSplits.userId, userId)))
        .limit(1);

      const record = records[0];
      if (!record) {
        throw new Error("Stem split not found or you do not have permission to access it");
      }

      if (record.status !== "completed") {
        throw new Error("Stem split is not yet completed — please wait for splitting to finish");
      }

      if (!record.vocalUrl && !record.drumsUrl && !record.bassUrl && !record.otherUrl) {
        throw new Error("No stem URLs found — the stem split may have failed");
      }

      // Mix the stems using the isolated mixer utility
      let mixedFilePath: string | null = null;
      try {
        console.log(`[Mixer] Starting custom mix for stemSplitId=${stemSplitId}, userId=${userId}`);

        mixedFilePath = await mixStems(
          {
            vocalUrl: record.vocalUrl,
            drumsUrl: record.drumsUrl,
            bassUrl: record.bassUrl,
            otherUrl: record.otherUrl,
            pianoUrl: record.pianoUrl,
          },
          volumes
        );

        // Upload the mixed file to S3
        const fileBuffer = fs.readFileSync(mixedFilePath);
        const fileKey = `custom-mixes/${userId}/${stemSplitId}-${Date.now()}.mp3`;
        const { url } = await storagePut(fileKey, fileBuffer, "audio/mpeg");

        console.log(`[Mixer] Custom mix uploaded: ${url}`);
        return { success: true, url };
      } catch (error) {
        console.error("[Mixer] Error creating custom mix:", error);
        throw new Error("Failed to create custom mix: " + (error as Error).message);
      } finally {
        // Always clean up the temp file
        if (mixedFilePath) {
          cleanupFile(mixedFilePath);
        }
      }
    }),
});
