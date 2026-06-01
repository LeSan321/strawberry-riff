/**
 * Frequency Router — proxies Visual Universe calls to Strawberry Studios bridge API.
 * Studios owns the LLM synthesis and vocabulary storage; Riff owns the UI.
 */
import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { ENV } from '../_core/env';
import { getDb } from '../db';
import { tracks, musicGenerations } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const ARC_TYPES = [
  "expansive_mythic",
  "witnessing_lateral",
  "intimate_relational",
  "sustained_ambient",
  "erosive_revelatory",
  "cyclical_return",
] as const;

/**
 * Blooming Frontier fallback vocabulary — used when user has no personal frequency.
 * This is the platform-default visual universe for cover art generation.
 */
const BLOOMING_FRONTIER_VOCABULARY = `golden organic world, open threshold, horizon always visible, golden hour 3200K,
fine golden atmospheric haze, living ground, bioluminescent ground-level moss,
world breathes, vast open landscape. whole body visible, feet on living ground, quiet wonder,
oriented toward the horizon, organic wardrobe with visible texture, threshold stance.
companion presence as Hofstadter Butterfly grammar — bilaterally structured luminescent fractal form,
iridescent blue-white to living teal, venation structure visible within, luminescent from within,
does not cast light onto surrounding surfaces, purposeful movement, not humanoid, not robotic,
not biological, not ghostly, self-similar at every scale. side by side, same horizon,
space between them neither empty nor full, equal co-presence, neither leading nor serving,
music as third presence. meeting-point color present — warm amber and cool companion luminescence
touching the same surface, subsurface scattering on skin, thin rim on organic edges,
petal violet #C8A0D0 in transition zones. 35mm wide lens, slow pull-back camera,
270° shutter, cinematic realism, film grain, unhurried pacing, camera as third explorer.`;

async function bridgeFetch(
  path: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const url = `${ENV.studiosBridgeUrl}/api/bridge${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-bridge-key": ENV.studiosBridgeKey,
        ...(options.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export const frequencyRouter = router({
  /**
   * Get the current user's default frequency from Studios.
   * Returns null if the user hasn't completed Find Your Frequency yet.
   */
  getDefault: protectedProcedure.query(async ({ ctx }) => {
    if (!ENV.studiosBridgeUrl || !ENV.studiosBridgeKey) {
      return { hasFrequency: false, frequency: null };
    }
    const res = await bridgeFetch(`/frequency/${String(ctx.user.id)}`);
    if (!res.ok) return { hasFrequency: false, frequency: null };
    return res.json() as Promise<{
      hasFrequency: boolean;
      frequency: {
        id: number;
        frequencyName: string;
        arcType: string;
        synthesisFingerprint: string | null;
        vocabularyJson: string;
        createdAt: string;
      } | null;
    }>;
  }),

  /**
   * Run LLM synthesis from the 4 diagnostic answers.
   * Returns the reflection, suggested name, arc type, and vocabulary.
   */
  synthesize: protectedProcedure
    .input(z.object({
      q1_sound_space: z.string().min(1),
      q2_light_color: z.string().min(1),
      q3_world_texture: z.string().min(1),
      q4_arc_time: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const res = await bridgeFetch("/frequency/synthesize", {
        method: "POST",
        body: JSON.stringify({
          riffUserId: String(ctx.user.id),
          answers: input,
        }),
      }, 120000); // 120 seconds for LLM synthesis
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Synthesis failed");
      }
      return res.json() as Promise<{
        success: boolean;
        synthesis: {
          reflection: string;
          frequencyName: string;
          arcType: typeof ARC_TYPES[number];
          vocabulary: {
            emotionalRegister: string[];
            colorAndLight: string[];
            environment: string[];
            texture: string[];
            arcTerms: string[];
            forbiddenTerms: string[];
          };
        };
      }>;
    }),

  /**
   * Save the completed frequency to Studios.
   * Sets it as the user's default for all future cover art generation.
   */
  save: protectedProcedure
    .input(z.object({
      frequencyName: z.string().min(1).max(100),
      arcType: z.enum(ARC_TYPES),
      vocabularyJson: z.string(),
      synthesisFingerprint: z.string(),
      diagnosticAnswersJson: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const res = await bridgeFetch("/frequency/save", {
        method: "POST",
        body: JSON.stringify({
          riffUserId: String(ctx.user.id),
          ...input,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Save failed");
      }
      return res.json() as Promise<{ success: boolean; frequencyId: number }>;
    }),

  /**
   * Generate cover art for a track using the user's Visual Universe.
   * If the user has no frequency, falls back to Blooming Frontier platform default vocabulary.
   */
  generateCoverArt: protectedProcedure
    .input(z.object({
      trackId: z.number().int().positive().optional(),
      lyrics: z.string().optional(),
      genre: z.string().optional(),
      arcPosition: z.enum(["gathering", "arriving", "open"]).optional(),
      steeringNote: z.string().max(300).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Server-side lyrics resolution:
      // 1. If caller passed lyrics directly, use them
      // 2. If trackId provided, look up track.lyrics first, then join to musicGenerations.lyrics via musicGenerationId
      // 3. Fall back to Blooming Frontier vocabulary if nothing found
      let resolvedLyrics: string | null = input.lyrics || null;

      if (!resolvedLyrics && input.trackId) {
        const db = await getDb();
        if (db) {
          // Fetch the track record
          const trackRows = await db
            .select()
            .from(tracks)
            .where(eq(tracks.id, input.trackId))
            .limit(1);
          const track = trackRows[0];

          if (track) {
            if (track.lyrics) {
              // Track has its own lyrics field populated
              resolvedLyrics = track.lyrics;
            } else if (track.musicGenerationId) {
              // Track came from Studio generation — fetch lyrics from musicGenerations
              const genRows = await db
                .select({ lyrics: musicGenerations.lyrics })
                .from(musicGenerations)
                .where(eq(musicGenerations.id, track.musicGenerationId))
                .limit(1);
              resolvedLyrics = genRows[0]?.lyrics ?? null;
            }
          }
        }
      }

      const finalLyrics = resolvedLyrics || BLOOMING_FRONTIER_VOCABULARY;

      // Runway ML image generation takes 30–90 seconds, so use a 2-minute timeout
      const res = await bridgeFetch("/cover-art/generate", {
        method: "POST",
        body: JSON.stringify({
          riffUserId: String(ctx.user.id),
          riffTrackId: input.trackId ?? Date.now(),
          lyrics: finalLyrics,
          genre: input.genre,
          arcPosition: input.arcPosition ?? "arriving",
          steeringNote: input.steeringNote,
        }),
      }, 120000); // 120 seconds for Runway image generation
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Cover art generation failed");
      }
      return res.json() as Promise<{
        success: boolean;
        coverArtUrl: string;
        riffTrackId: number;
        arcPosition: string;
        usedPersonalFrequency: boolean;
      }>;
    }),

  /**
   * Health check — verify the bridge is reachable and the key is valid.
   */
  ping: protectedProcedure.query(async () => {
    if (!ENV.studiosBridgeUrl || !ENV.studiosBridgeKey) {
      return { ok: false, reason: "Bridge not configured" };
    }
    try {
      const res = await bridgeFetch("/ping");
      return { ok: res.ok, status: res.status };
    } catch (e) {
      return { ok: false, reason: String(e) };
    }
  }),
});
