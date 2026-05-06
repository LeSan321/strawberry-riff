import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { inferDimensions, serializeDimensions, type MusicGenerationMetadata } from './dimensionInference';
import { getDb } from '../db';
import { eq } from 'drizzle-orm';
import { tracks, musicGenerations } from '../../drizzle/schema';

/**
 * Cover Art Router
 * 
 * Handles cover art dimension inference and generation
 */
export const coverArtRouter = router({
  /**
   * Infer dimensions for a track based on its linked musicGeneration
   * 
   * This is called automatically when a track is created, but can also
   * be called manually to re-infer dimensions if needed.
   */
  inferDimensionsForTrack: protectedProcedure
    .input(z.object({
      trackId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      // Get the track
      const trackResults = await db.select().from(tracks).where(eq(tracks.id, input.trackId)).limit(1);
      const track = trackResults[0];

      if (!track) {
        throw new Error('Track not found');
      }

      // Check authorization
      if (track.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      // Get the linked musicGeneration
      if (!track.musicGenerationId) {
        throw new Error('Track has no linked musicGeneration');
      }

      const musicGenResults = await db.select().from(musicGenerations).where(eq(musicGenerations.id, track.musicGenerationId)).limit(1);
      const musicGen = musicGenResults[0];

      if (!musicGen) {
        throw new Error('Linked musicGeneration not found');
      }

      // Extract metadata from musicGeneration
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: musicGen.vocalSpectrumValue ?? 50,
        visualBrief: musicGen.visualBrief ?? undefined,
        prompt: musicGen.prompt,
        moodTags: [],
        genre: track.genre ?? undefined,
        duration: track.duration ?? 0,
        vocalGender: undefined,
      };

      // Infer dimensions
      const dimensions = inferDimensions(metadata);

      // Serialize and store
      const serialized = serializeDimensions(dimensions);

      // Update track with dimensions
      await db.update(tracks).set({
        coverArtDimensions: serialized,
      }).where(eq(tracks.id, input.trackId));

      return {
        success: true,
        dimensions,
      };
    }),

  /**
   * Get inferred dimensions for a track
   */
  getDimensions: protectedProcedure
    .input(z.object({
      trackId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      const trackResults = await db.select().from(tracks).where(eq(tracks.id, input.trackId)).limit(1);
      const track = trackResults[0];

      if (!track) {
        throw new Error('Track not found');
      }

      // Check authorization (allow if track is public or user owns it)
      if (track.visibility !== 'public' && track.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      if (!track.coverArtDimensions) {
        return null;
      }

      return JSON.parse(track.coverArtDimensions);
    }),
});
