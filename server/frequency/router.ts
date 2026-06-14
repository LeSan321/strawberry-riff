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

/** Extract Clerk token from tRPC context auth header */
function extractClerkToken(ctx: { authHeader?: string }): string | undefined {
  const authHeader = (ctx as any).authHeader as string | undefined;
  return authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
}

async function bridgeFetch(
  path: string,
  options: RequestInit = {},
  timeoutMs: number = 30000,
  clerkToken?: string
): Promise<Response> {
  const url = `${ENV.studiosBridgeUrl}/api/bridge${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> ?? {}),
    };
    
    // Use Clerk Bearer token if provided, otherwise fall back to x-bridge-key for backward compatibility
    if (clerkToken) {
      headers["Authorization"] = `Bearer ${clerkToken}`;
    } else if (ENV.studiosBridgeKey) {
      headers["x-bridge-key"] = ENV.studiosBridgeKey;
    }
    
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export const frequencyRouter = router({
  /**
   * Get the current user's default frequency from Studios.
   * Returns { hasFrequency: false, frequency: null } on any error — never throws.
   * This ensures the FrequencyModal always resolves and never freezes.
   */
  getDefault: protectedProcedure.query(async ({ ctx }) => {
    if (!ENV.studiosBridgeUrl) {
      console.log("[Frequency] getDefault: bridge URL not configured, returning no-frequency");
      return { hasFrequency: false, frequency: null };
    }
    const clerkToken = extractClerkToken(ctx);
    if (!clerkToken) {
      console.log("[Frequency] getDefault: no Clerk token in context, returning no-frequency");
      return { hasFrequency: false, frequency: null };
    }
    try {
      const res = await bridgeFetch(`/frequency/default`, {}, 15000, clerkToken);
      if (!res.ok) {
        const body = await res.text().catch(() => "(unreadable)");
        console.warn(`[Frequency] getDefault: Studios returned ${res.status} — body: ${body.slice(0, 300)}`);
        return { hasFrequency: false, frequency: null };
      }
      const data = await res.json() as {
        hasFrequency: boolean;
        frequency: {
          id: number;
          frequencyName: string;
          arcType: string;
          synthesisFingerprint: string | null;
          vocabularyJson: string;
          createdAt: string;
        } | null;
      };
      console.log(`[Frequency] getDefault: hasFrequency=${data.hasFrequency}`);
      return data;
    } catch (err) {
      console.error("[Frequency] getDefault: bridge call failed:", err);
      return { hasFrequency: false, frequency: null };
    }
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
      const clerkToken = extractClerkToken(ctx);
      // Studios expects q1/q2/q3/q4 — map from Riff's verbose field names
      const res = await bridgeFetch("/frequency/synthesize", {
        method: "POST",
        body: JSON.stringify({
          q1: input.q1_sound_space,
          q2: input.q2_light_color,
          q3: input.q3_world_texture,
          q4: input.q4_arc_time,
        }),
      }, 120000, clerkToken); // 120 seconds for LLM synthesis
      const responseText = await res.text().catch(() => "{}");
      console.log(`[Frequency] synthesize: Studios returned ${res.status} — body: ${responseText.slice(0, 800)}`);
      if (!res.ok) {
        let errMsg = "Synthesis failed";
        try { errMsg = (JSON.parse(responseText) as any).error ?? errMsg; } catch { /* ignore */ }
        throw new Error(errMsg);
      }
      let parsed: any;
      try { parsed = JSON.parse(responseText); } catch {
        throw new Error("Studios returned invalid JSON from synthesize");
      }
      // Normalise response — Studios may return the synthesis at top level or nested under 'synthesis'
      const synthesis = parsed.synthesis ?? parsed;
      console.log(`[Frequency] synthesize: synthesis keys: ${Object.keys(synthesis).join(", ")}`);
      // Resolve vocabulary — Studios may return it as a parsed object OR as a JSON string
      let vocab = synthesis.vocabulary;
      if (!vocab && synthesis.vocabularyJson) {
        try {
          vocab = typeof synthesis.vocabularyJson === "string"
            ? JSON.parse(synthesis.vocabularyJson)
            : synthesis.vocabularyJson;
        } catch { vocab = {}; }
      }
      vocab = vocab ?? {};

      /**
       * Flatten vocabulary entries — Studios returns each term as either:
       *   a) a plain string: "New Frontier"
       *   b) an object: { term: "New Frontier", instruction: "Depict..." }
       * The FrequencyModal renders plain strings, so flatten objects to their .term value.
       */
      const flattenTerms = (arr: any[]): string[] =>
        arr.map((t) => (typeof t === "string" ? t : t?.term ?? String(t)));

      // Ensure every expected array field exists so the UI never crashes on .map()
      const safeVocab = {
        emotionalRegister: flattenTerms(Array.isArray(vocab.emotionalRegister) ? vocab.emotionalRegister : []),
        colorAndLight: flattenTerms(Array.isArray(vocab.colorAndLight) ? vocab.colorAndLight : []),
        environment: flattenTerms(Array.isArray(vocab.environment) ? vocab.environment : []),
        texture: flattenTerms(Array.isArray(vocab.texture) ? vocab.texture : []),
        arcTerms: flattenTerms(Array.isArray(vocab.arcTerms) ? vocab.arcTerms : []),
        forbiddenTerms: flattenTerms(Array.isArray(vocab.forbiddenTerms) ? vocab.forbiddenTerms : []),
      };
      console.log(`[Frequency] synthesize: vocab keys: ${Object.keys(safeVocab).join(", ")}, environment count: ${safeVocab.environment.length}, sample: ${safeVocab.environment[0] ?? "none"}`);
      return {
        success: true,
        synthesis: {
          reflection: synthesis.reflection ?? synthesis.synthesisFingerprint ?? "",
          // Studios returns 'suggestedName', not 'frequencyName'
          frequencyName: synthesis.suggestedName ?? synthesis.frequencyName ?? synthesis.name ?? "My Frequency",
          arcType: synthesis.arcType ?? "expansive_mythic",
          vocabulary: safeVocab,
        },
      };
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
      const clerkToken = extractClerkToken(ctx);
      const res = await bridgeFetch("/frequency/save", {
        method: "POST",
        body: JSON.stringify(input),
      }, 30000, clerkToken);
      if (!res.ok) {
        const body = await res.text().catch(() => "{}");
        console.error(`[Frequency] save: Studios returned ${res.status} — body: ${body.slice(0, 500)}`);
        let errMsg = "Save failed";
        try { errMsg = (JSON.parse(body) as any).error ?? errMsg; } catch { /* ignore */ }
        throw new Error(errMsg);
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
      // Get Clerk session token for Studios bridge authentication
      const clerkToken = extractClerkToken(ctx);
      if (!clerkToken) {
        console.error("[Frequency] generateCoverArt: no Clerk token available");
        throw new Error("Authentication required for cover art generation");
      }

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
      console.log(`[Frequency] generateCoverArt: lyrics resolved (${resolvedLyrics ? "from track" : "Blooming Frontier fallback"}), calling Studios bridge`);

      // Runway ML image generation takes 30–90 seconds, so use a 2-minute timeout
      // Use Studios' REST bridge endpoint — plain JSON, no tRPC wire format needed
      const res = await bridgeFetch("/cover-art/generate", {
        method: "POST",
        body: JSON.stringify({
          lyrics: finalLyrics,
          genre: input.genre,
          arcPosition: input.arcPosition ?? "arriving",
          steeringNote: input.steeringNote,
        }),
      }, 120000, clerkToken); // 120 seconds for Runway image generation, pass Clerk token

      if (!res.ok) {
        const body = await res.text().catch(() => "{}");
        console.error(`[Frequency] generateCoverArt: Studios returned ${res.status} — body: ${body.slice(0, 500)}`);
        let errMsg = "Cover art generation failed";
        try { errMsg = (JSON.parse(body) as any).error ?? errMsg; } catch { /* ignore */ }
        throw new Error(errMsg);
      }

      // Studios now returns { imageUrl: "..." } directly
      const data = await res.json() as { imageUrl: string };
      console.log(`[Frequency] generateCoverArt: success, imageUrl=${data.imageUrl?.slice(0, 60)}...`);
      return {
        success: true,
        coverArtUrl: data.imageUrl,
        riffTrackId: input.trackId ?? Date.now(),
        arcPosition: input.arcPosition ?? "arriving",
        usedPersonalFrequency: false,
      };
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
