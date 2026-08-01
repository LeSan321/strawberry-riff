/**
 * Vocal Projects Router
 *
 * Provides tRPC procedures for the Add Vocals feature:
 *   - vocalProjects.start  — kick off a MiniMax vocal generation over an instrumental
 *   - vocalProjects.poll   — check status / retrieve the finished audio URL
 *
 * Phase 3 (backend only): no DB persistence yet — the task_id is returned to the
 * client and stored in React state. DB persistence is added in Phase 4.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { startVocalGeneration, pollVocalGeneration } from "../vocalPipeline";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

const vocalArchetypeEnum = z.enum([
  "intimate-bedroom",
  "raw-emotional",
  "soulful-belter",
  "gritty-rock",
  "confident-pop",
  "lo-fi-whisper",
  "powerful-anthem",
  "storyteller-folk",
] as const);

export const vocalProjectsRouter = router({
  /**
   * Start a vocal generation job.
   *
   * When MiniMax returns audio synchronously (the common fast path), this mutation
   * uploads the buffer to S3 immediately and returns { taskId: "DONE", audioUrl }.
   * The client should check for taskId === "DONE" and skip the poll step.
   *
   * When MiniMax starts an async task, returns { taskId, prompt } — client polls.
   */
  start: protectedProcedure
    .input(
      z.object({
        /** URL to the instrumental track (must be publicly accessible, >15s) */
        instrumentalUrl: z.string().url(),
        /** Song lyrics to sing */
        lyrics: z.string().min(1).max(3500),
        /** Vocal archetype */
        vocalArchetype: vocalArchetypeEnum,
        /** Vocal gender */
        vocalGender: z.enum(["male", "female", "neutral"]).default("neutral"),
        /** Spectrum slider 0-100 */
        vocalSpectrumValue: z.number().min(0).max(100).default(50),
        /** Optional extra style notes */
        styleNotes: z.string().max(500).optional(),
        /** Source track ID (for reference, not persisted yet) */
        trackId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const job = await startVocalGeneration({
          instrumentalUrl: input.instrumentalUrl,
          lyrics: input.lyrics,
          vocalArchetype: input.vocalArchetype,
          vocalGender: input.vocalGender,
          vocalSpectrumValue: input.vocalSpectrumValue,
          styleNotes: input.styleNotes,
        });

        // Sync path: MiniMax returned audio immediately — upload to S3 now
        if (job.syncBuffer) {
          const ext = job.syncMimeType === "audio/wav" ? "wav" : "mp3";
          const audioKey = `vocal-takes/${ctx.user.id}/${nanoid(12)}.${ext}`;
          const { url } = await storagePut(audioKey, job.syncBuffer, job.syncMimeType ?? "audio/mpeg");
          console.log("[vocalProjects.start] Sync upload complete:", url.substring(0, 60));
          return {
            taskId: "DONE" as const,
            prompt: job.prompt,
            audioUrl: url,
          };
        }

        // Async path: return task ID for client polling
        return {
          taskId: job.taskId,
          prompt: job.prompt,
          audioUrl: undefined,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[vocalProjects.start] Error:", message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to start vocal generation: ${message}`,
        });
      }
    }),

  /**
   * Poll a vocal generation job.
   * Note: pollVocalGeneration blocks until completion (up to 10 min).
   * The client should call this in a background mutation with a long timeout.
   * Only call this when start returned a real taskId (not "DONE").
   */
  poll: protectedProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const result = await pollVocalGeneration(input.taskId);

      if (result.status === "failed") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.errorMessage ?? "Vocal generation failed",
        });
      }

      return {
        status: result.status,
        audioUrl: result.audioUrl,
      };
    }),
});
