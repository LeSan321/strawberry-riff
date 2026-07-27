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
   * Returns { taskId, prompt } immediately — client polls for completion.
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
    .mutation(async ({ input }) => {
      try {
        const job = await startVocalGeneration({
          instrumentalUrl: input.instrumentalUrl,
          lyrics: input.lyrics,
          vocalArchetype: input.vocalArchetype,
          vocalGender: input.vocalGender,
          vocalSpectrumValue: input.vocalSpectrumValue,
          styleNotes: input.styleNotes,
        });

        return {
          taskId: job.taskId,
          prompt: job.prompt,
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
