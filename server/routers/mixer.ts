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
import { createTrack, createMusicGeneration } from "../db";
import { nanoid } from "nanoid";
import * as fs from "fs";
import { mixStems, cleanupFile } from "../mixer/mixer";

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

  /**
   * Server-side vocal overlay mix.
   * Takes a vocal stem URL + an instrumental URL, runs ffmpeg to combine them,
   * uploads the result to S3, and saves it as a music_generation record so it
   * appears in the user's My Riffs library.
   *
   * The vocal stem typically comes from a StemSplit job on a vocal-take generation.
   * The instrumental is any completed music_generation with audioUrl.
   */
  vocalOverlay: protectedProcedure
    .input(
      z.object({
        /** URL of the extracted vocal stem (from StemSplit) */
        vocalStemUrl: z.string().url(),
        /** URL of the instrumental track */
        instrumentalUrl: z.string().url(),
        /** Volume for the vocal stem (0.0–2.0, default 1.0) */
        vocalVolume: z.number().min(0).max(2).default(1.0),
        /** Volume for the instrumental (0.0–2.0, default 0.9 to let vocals sit on top) */
        instrumentalVolume: z.number().min(0).max(2).default(0.9),
        /** Title for the resulting track */
        title: z.string().min(1).max(200),
        /** Optional: ID of the vocal-take generation (for metadata) */
        vocalGenerationId: z.number().int().positive().optional(),
        /** Optional: ID of the instrumental generation (for metadata) */
        instrumentalGenerationId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      console.log(`[Mixer/VocalOverlay] Starting mix for user ${userId}: "${input.title}"`);
      console.log(`[Mixer/VocalOverlay] Vocal: ${input.vocalStemUrl.substring(0, 80)}...`);
      console.log(`[Mixer/VocalOverlay] Instrumental: ${input.instrumentalUrl.substring(0, 80)}...`);

      // Create a placeholder generation record so the UI can poll for status
      const generationId = await createMusicGeneration({
        userId,
        title: input.title,
        prompt: "vocal-overlay",
        lyrics: "",
        duration: 0,
        audioUrl: "",
        audioKey: "",
        status: "generating",
        metadata: JSON.stringify({
          generationType: "vocal-overlay",
          vocalGenerationId: input.vocalGenerationId ?? null,
          instrumentalGenerationId: input.instrumentalGenerationId ?? null,
          vocalVolume: input.vocalVolume,
          instrumentalVolume: input.instrumentalVolume,
        }),
        aceStepTaskId: null,
        errorMessage: null,
        isFavorited: false,
        referenceAudioUrl: null,
        voiceReferenceUrl: null,
        vocalSpectrumValue: 50,
        visualBrief: null,
        isSplit: false,
      });

      if (!generationId) {
        throw new Error("Failed to create generation record for vocal overlay");
      }

      // Run the mix in the background (fire-and-forget)
      (async () => {
        let outputPath: string | null = null;
        try {
          // Mix: vocal stem + instrumental (drums/bass/other set to 0)
          outputPath = await mixStems(
            {
              vocalUrl: input.vocalStemUrl,
              drumsUrl: input.instrumentalUrl, // use instrumental as the "drums" slot — it's the full backing track
              bassUrl: null,
              otherUrl: null,
            },
            {
              vocals: input.vocalVolume,
              drums: input.instrumentalVolume,
              bass: 0,
              other: 0,
            }
          );

          // Upload to S3
          const audioBuffer = fs.readFileSync(outputPath);
          const audioKey = `vocal-overlays/${userId}/${generationId}-${nanoid(8)}.mp3`;
          const { url: audioUrl } = await storagePut(audioKey, audioBuffer, "audio/mpeg");

          // Update generation record to complete
          const { updateMusicGenerationStatus } = await import("../db");
          await updateMusicGenerationStatus(generationId, "complete", {
            audioUrl,
            audioKey,
            metadata: JSON.stringify({
              generationType: "vocal-overlay",
              vocalGenerationId: input.vocalGenerationId ?? null,
              instrumentalGenerationId: input.instrumentalGenerationId ?? null,
              vocalVolume: input.vocalVolume,
              instrumentalVolume: input.instrumentalVolume,
            }),
          });

          console.log(`[Mixer/VocalOverlay] Mix complete for generation ${generationId}: ${audioUrl}`);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[Mixer/VocalOverlay] Mix failed for generation ${generationId}:`, message);
          const { updateMusicGenerationStatus } = await import("../db");
          await updateMusicGenerationStatus(generationId, "failed", {
            errorMessage: `Mix failed: ${message}`,
          });
        } finally {
          if (outputPath) cleanupFile(outputPath);
        }
      })();

      return { id: generationId, status: "generating" as const };
    }),
});
