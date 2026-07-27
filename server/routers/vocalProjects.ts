/**
 * Vocal Projects tRPC Router — Platinum Tier
 *
 * Procedures:
 *   - start:   Create a new vocal project and kick off the async pipeline
 *   - get:     Fetch a single vocal project (for polling status)
 *   - list:    List all vocal projects for the current user
 *   - getVocalStemOptions: Return completed generations that have a vocal stem available
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { vocalProjects, musicGenerations, stemSplits } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { runVocalPipeline } from "../vocalPipeline";
import { TRPCError } from "@trpc/server";

export const vocalProjectsRouter = router({
  /**
   * Start a new vocal project.
   * Validates inputs, creates the DB row, then fires the pipeline in the background.
   */
  start: protectedProcedure
    .input(
      z.object({
        fusionGenerationId: z.number().int().positive(),
        /** Optional: generation ID whose vocal stem will be used as voice_file */
        vocalSourceGenerationId: z.number().int().positive().optional(),
        lyrics: z.string().min(10, "Lyrics must be at least 10 characters").max(5000),
        styleAnchor: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      // Premium gate — only Platinum users can use Add Vocals
      if (!ctx.user.isPremium) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Add Vocals is a Platinum feature. Upgrade to access this workflow.",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Verify the fusion generation exists and belongs to this user
      const fusion = await db
        .select()
        .from(musicGenerations)
        .where(and(eq(musicGenerations.id, input.fusionGenerationId), eq(musicGenerations.userId, userId)))
        .limit(1)
        .then((r) => r[0]);

      if (!fusion) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fusion generation not found" });
      }
      if (fusion.status !== "complete" || !fusion.audioUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Fusion generation must be complete" });
      }

      // Resolve vocal stem URL if a source generation was provided
      let vocalStemUrl: string | null = null;
      if (input.vocalSourceGenerationId) {
        const stemRecord = await db
          .select()
          .from(stemSplits)
          .where(
            and(
              eq(stemSplits.generationId, input.vocalSourceGenerationId),
              eq(stemSplits.userId, userId),
              eq(stemSplits.status, "completed")
            )
          )
          .limit(1)
          .then((r) => r[0]);

        if (!stemRecord?.vocalUrl) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selected vocal source does not have a completed stem split with a vocal track. Run StemSplit on that generation first.",
          });
        }
        vocalStemUrl = stemRecord.vocalUrl;
      }

      // Create the vocal project row
      const [inserted] = await db.insert(vocalProjects).values({
        userId,
        fusionGenerationId: input.fusionGenerationId,
        fusionAudioUrl: fusion.audioUrl,
        fusionTitle: fusion.title,
        vocalSourceGenerationId: input.vocalSourceGenerationId ?? null,
        vocalStemUrl,
        lyrics: input.lyrics,
        styleAnchor: input.styleAnchor,
        status: "pending",
      });

      const projectId = (inserted as unknown as { insertId: number }).insertId;

      // Fire the pipeline asynchronously — don't await so the HTTP response returns immediately
      runVocalPipeline({
        projectId,
        fusionAudioUrl: fusion.audioUrl,
        fusionTitle: fusion.title,
        vocalStemUrl,
        styleAnchor: input.styleAnchor,
        lyrics: input.lyrics,
        userId,
      }).catch((err) => {
        console.error(`[VocalPipeline] Project ${projectId} failed:`, err);
      });

      return { projectId, status: "pending" };
    }),

  /**
   * Get a single vocal project by ID (for status polling).
   */
  get: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const project = await db
        .select()
        .from(vocalProjects)
        .where(and(eq(vocalProjects.id, input.projectId), eq(vocalProjects.userId, ctx.user.id)))
        .limit(1)
        .then((r) => r[0]);

      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Vocal project not found" });
      return project;
    }),

  /**
   * List all vocal projects for the current user, newest first.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    return db
      .select()
      .from(vocalProjects)
      .where(eq(vocalProjects.userId, ctx.user.id))
      .orderBy(desc(vocalProjects.createdAt))
      .limit(50);
  }),

  /**
   * Return completed generations that have a vocal stem available (for the voice source picker).
   * These are generations where StemSplit has completed and vocalUrl is set.
   */
  getVocalStemOptions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const rows = await db
      .select({
        generationId: stemSplits.generationId,
        vocalUrl: stemSplits.vocalUrl,
        title: musicGenerations.title,
        createdAt: stemSplits.createdAt,
      })
      .from(stemSplits)
      .innerJoin(musicGenerations, eq(musicGenerations.id, stemSplits.generationId))
      .where(
        and(
          eq(stemSplits.userId, ctx.user.id),
          eq(stemSplits.status, "completed")
        )
      )
      .orderBy(desc(stemSplits.createdAt))
      .limit(30);

    // Only return rows that actually have a vocal stem
    return rows.filter((r) => r.vocalUrl != null);
  }),
});
