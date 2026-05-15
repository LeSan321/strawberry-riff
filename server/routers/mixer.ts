/**
 * Mixer tRPC Router
 * Handles custom stem mix export and save-to-riffs requests.
 *
 * ISOLATION GUARANTEE: This router does NOT import anything from server/stemsplit/.
 * It only reads stem URLs from the database (read-only). The StemSplit job pipeline
 * is completely untouched.
 *
 * NOTE: The old server-side FFmpeg mixing (exportCustomMix) has been superseded by
 * client-side Web Audio API mixing. The new saveMixToRiffs procedure accepts a
 * pre-rendered WAV blob (base64-encoded) from the client, uploads it to S3, and
 * creates a track record so users can share their custom blend.
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { stemSplits, tracks } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { storagePut } from "../storage";
import { createTrack } from "../db";
import { nanoid } from "nanoid";

export const mixerRouter = router({
  /**
   * Save a client-rendered custom mix to the user's My Riffs library.
   * The client renders the mix using the Web Audio API and sends the result
   * as a base64-encoded WAV or MP3 blob. This procedure uploads it to S3
   * and creates a track record so the user can share it.
   */
  saveMixToRiffs: protectedProcedure
    .input(
      z.object({
        stemSplitId: z.number().int().positive(),
        /** Base64-encoded audio data (WAV or MP3) */
        audioBase64: z.string().min(1),
        /** MIME type of the audio blob */
        mimeType: z.enum(["audio/wav", "audio/mp3", "audio/mpeg"]).default("audio/wav"),
        /** Title for the new track */
        title: z.string().min(1).max(200),
        /** Approximate duration in seconds */
        duration: z.number().int().min(0).max(7200).optional(),
        /** Human-readable blend description, e.g. "Vocals 80%, Drums 150% 🔔, Bass 100%" */
        blendDescription: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { stemSplitId, audioBase64, mimeType, title, duration, blendDescription } = input;
      const userId = ctx.user.id;

      // Verify the stem split belongs to this user and is completed
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
        throw new Error("Stem split is not yet completed");
      }

      // Look up the original track's cover art (via generationId → tracks.musicGenerationId)
      let coverArtUrl: string | null = null;
      try {
        const originalTracks = await db
          .select({ coverArtUrl: tracks.coverArtUrl })
          .from(tracks)
          .where(and(eq(tracks.musicGenerationId, record.generationId), eq(tracks.userId, userId)))
          .limit(1);
        if (originalTracks[0]?.coverArtUrl) {
          coverArtUrl = originalTracks[0].coverArtUrl;
          console.log(`[Mixer] Copied cover art from original track: ${coverArtUrl}`);
        }
      } catch (err) {
        console.warn(`[Mixer] Could not look up cover art, proceeding without it:`, err);
      }

      // Decode base64 audio and upload to S3
      const audioBuffer = Buffer.from(audioBase64, "base64");
      const ext = mimeType === "audio/wav" ? "wav" : "mp3";
      const fileKey = `custom-mixes/${userId}/${nanoid(12)}.${ext}`;
      const { url: audioUrl } = await storagePut(fileKey, audioBuffer, mimeType);

      console.log(`[Mixer] Custom mix uploaded: ${audioUrl}`);

      // Create a track record in My Riffs
      const trackId = await createTrack({
        userId,
        title: `${title} (Custom Mix)`,
        artist: ctx.user.name ?? "Unknown Artist",
        audioUrl,
        audioKey: fileKey,
        duration: duration ?? 0,
        visibility: "private",
        moodTags: JSON.stringify([]),
        gradient: "from-violet-600 to-pink-600",
        coverArtUrl,
        description: blendDescription
          ? `${blendDescription} — Custom mix created in Stems Studio`
          : `Custom mix created in Stems Studio from stem split #${stemSplitId}`,
        musicGenerationId: null,
      });

      console.log(`[Mixer] Track created: id=${trackId}`);
      return { success: true, trackId, audioUrl };
    }),
});
