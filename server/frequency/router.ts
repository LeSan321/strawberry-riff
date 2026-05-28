/**
 * Frequency Router — proxies Visual Universe calls to Strawberry Studios bridge API.
 * Studios owns the LLM synthesis and vocabulary storage; Riff owns the UI.
 */
import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { ENV } from '../_core/env';

const ARC_TYPES = [
  "expansive_mythic",
  "witnessing_lateral",
  "intimate_relational",
  "sustained_ambient",
  "erosive_revelatory",
  "cyclical_return",
] as const;

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
    const res = await bridgeFetch(`/frequency/${ctx.user.id}`);
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
          riffUserId: ctx.user.id,
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
          riffUserId: ctx.user.id,
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
   * If the user has no frequency, falls back to Studios platform default vocabulary.
   */
  generateCoverArt: protectedProcedure
    .input(z.object({
      trackId: z.number().int().positive().optional(),
      lyrics: z.string().optional(),
      genre: z.string().optional(),
      arcPosition: z.enum(["gathering", "arriving", "open"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const res = await bridgeFetch("/cover-art/generate", {
        method: "POST",
        body: JSON.stringify({
          riffUserId: ctx.user.id,
          riffTrackId: input.trackId,
          lyrics: input.lyrics,
          genre: input.genre,
          arcPosition: input.arcPosition ?? "arriving",
        }),
      });
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
