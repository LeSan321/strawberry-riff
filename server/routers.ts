import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addTrackToPlaylist,
  createPlaylist,
  createTrack,
  deletePlaylist,
  deleteTrack,
  followUser,
  getAllUsers,
  getFollowerCount,
  getFollowers,
  getFollowing,
  getFollowingCount,
  getInnerCircleTracks,
  getLikedTrackIds,
  getPlaylistById,
  getPlaylistTracks,
  getPlaylistsByUserId,
  getProfileByUserId,
  getPublicTracks,
  getPublicTracksByUserId,
  getTrackById,
  getTrackWithCreator,
  getTracksByUserId,
  getUserByDisplayName,
  getUserById,
  isFollowing,
  likeTrack,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  unfollowUser,
  unlikeTrack,
  updatePlaylist,
  updateTrack,
  upsertProfile,
  getVibePresets,
  createVibePreset,
  deleteVibePreset,
  createMusicGeneration,
  getMusicGenerationById,
  getMusicGenerationsByUserId,
  updateMusicGenerationStatus,
  deleteMusicGeneration,
  getMusicGenerationHistory,
  countGenerationsThisMonth,
} from "./db";
import { systemRouter } from "./_core/systemRouter";
import { stripeRouter } from "./routers/stripe";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { startMusicGeneration, pollMusicGeneration, fetchAudioBytes, validateMusicGenerationParams } from "./musicGeneration";
import { getIntensityGuidance, getRefinementGuidance, buildSystemMessage, IntensityLevel, RefinementType } from "./promptTemplates";

// ─── Auth ─────────────────────────────────────────────────────────────────────
const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// ─── Profiles ─────────────────────────────────────────────────────────────────
const profilesRouter = router({
  get: publicProcedure
    .input(z.object({ userId: z.number().int().optional() }))
    .query(async ({ ctx, input }) => {
      const uid = input.userId ?? ctx.user?.id;
      if (!uid) return null;
      const profile = await getProfileByUserId(uid);
      return profile ?? null;
    }),

  upsert: protectedProcedure
    .input(
      z.object({
        displayName: z.string().max(100).optional(),
        bio: z.string().max(500).optional(),
        avatarUrl: z.string().url().optional().or(z.literal("")),
        profileComplete: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertProfile({
        userId: ctx.user.id,
        displayName: input.displayName ?? null,
        bio: input.bio ?? null,
        avatarUrl: input.avatarUrl || null,
        profileComplete: input.profileComplete ?? false,
      });
      return getProfileByUserId(ctx.user.id);
    }),

  uploadAvatar: protectedProcedure
    .input(
      z.object({
        base64: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.split("/")[1] || "jpg";
      const key = `avatars/${ctx.user.id}-${nanoid(8)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),
});

// ─── Tracks ───────────────────────────────────────────────────────────────────
const tracksRouter = router({
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        mimeType: z.string(),
        base64: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.fileName.split(".").pop() || "mp3";
      const key = `audio/${ctx.user.id}/${nanoid(12)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url, key };
    }),

  uploadCoverArt: protectedProcedure
    .input(z.object({ base64: z.string(), mimeType: z.string(), context: z.enum(["track", "playlist"]).default("track") }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.split("/")[1] || "jpg";
      const key = `cover-art/${ctx.user.id}/${nanoid(12)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        artist: z.string().max(200).optional(),
        genre: z.string().max(100).optional(),
        description: z.string().max(1000).optional(),
        audioUrl: z.string().url(),
        audioKey: z.string(),
        duration: z.number().int().optional(),
        moodTags: z.array(z.string()).optional(),
        visibility: z.enum(["private", "inner-circle", "public"]).default("private"),
        gradient: z.string().optional(),
        coverArtUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createTrack({
        userId: ctx.user.id,
        title: input.title,
        artist: input.artist ?? null,
        genre: input.genre ?? null,
        description: input.description ?? null,
        audioUrl: input.audioUrl,
        audioKey: input.audioKey,
        duration: input.duration ?? null,
        moodTags: input.moodTags ? JSON.stringify(input.moodTags) : null,
        visibility: input.visibility,
        gradient: input.gradient ?? "from-pink-400 to-purple-500",
        coverArtUrl: input.coverArtUrl ?? null,
      });
      return getTrackById(id);
    }),

  myTracks: protectedProcedure.query(async ({ ctx }) => {
    const trackList = await getTracksByUserId(ctx.user.id);
    return trackList.map((t) => ({
      ...t,
      moodTags: t.moodTags ? (JSON.parse(t.moodTags) as string[]) : [],
    }));
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const result = await getTrackWithCreator(input.id);
      if (!result) return null;
      return {
        ...result.track,
        moodTags: result.track.moodTags ? (JSON.parse(result.track.moodTags) as string[]) : [],
        creatorUsername: result.creatorUsername,
        creatorAvatarUrl: result.creatorAvatarUrl,
        creatorBio: result.creatorBio,
      };
    }),

  publicFeed: publicProcedure
    .input(z.object({ limit: z.number().int().max(100).default(50) }))
    .query(async ({ input }) => {
      const trackList = await getPublicTracks(input.limit);
      return Promise.all(
        trackList.map(async (t) => {
          const profile = await getProfileByUserId(t.userId);
          const creator = await getUserById(t.userId);
          return {
            ...t,
            moodTags: t.moodTags ? (JSON.parse(t.moodTags) as string[]) : [],
            creatorUsername: profile?.displayName ?? null,
            creatorIsPremium: creator?.isPremium ?? false,
          };
        })
      );
    }),

  friendFeed: protectedProcedure.query(async ({ ctx }) => {
    const trackList = await getInnerCircleTracks(ctx.user.id);
    return trackList.map((t) => ({
      ...t,
      moodTags: t.moodTags ? (JSON.parse(t.moodTags) as string[]) : [],
    }));
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        title: z.string().min(1).max(200).optional(),
        artist: z.string().max(200).optional(),
        genre: z.string().max(100).optional(),
        description: z.string().max(1000).optional(),
        moodTags: z.array(z.string()).optional(),
        visibility: z.enum(["private", "inner-circle", "public"]).optional(),
        gradient: z.string().optional(),
        coverArtUrl: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, moodTags, coverArtUrl, ...rest } = input;
      await updateTrack(id, ctx.user.id, {
        ...rest,
        moodTags: moodTags ? JSON.stringify(moodTags) : undefined,
        coverArtUrl: coverArtUrl !== undefined ? (coverArtUrl || null) : undefined,
      });
      return getTrackById(id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteTrack(input.id, ctx.user.id);
      return { success: true };
    }),

  like: protectedProcedure
    .input(z.object({ trackId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await likeTrack(ctx.user.id, input.trackId);
      return { success: true };
    }),

  unlike: protectedProcedure
    .input(z.object({ trackId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await unlikeTrack(ctx.user.id, input.trackId);
      return { success: true };
    }),

  myLikes: protectedProcedure.query(async ({ ctx }) => {
    return getLikedTrackIds(ctx.user.id);
  }),
});

// ─── Friends ──────────────────────────────────────────────────────────────────
const friendsRouter = router({
  allUsers: protectedProcedure.query(async ({ ctx }) => {
    const allUsers = await getAllUsers(ctx.user.id);
    const followingList = await getFollowing(ctx.user.id);
    const followingIds = new Set(followingList.map((f) => f.followingId));
    return Promise.all(
      allUsers.map(async (u) => {
        const profile = await getProfileByUserId(u.id);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          displayName: profile?.displayName ?? u.name,
          avatarUrl: profile?.avatarUrl ?? null,
          bio: profile?.bio ?? null,
          isFollowing: followingIds.has(u.id),
        };
      })
    );
  }),

  following: protectedProcedure.query(async ({ ctx }) => {
    const list = await getFollowing(ctx.user.id);
    return Promise.all(
      list.map(async (f) => {
        const u = await getUserById(f.followingId);
        const profile = u ? await getProfileByUserId(u.id) : null;
        return {
          id: f.followingId,
          name: u?.name ?? "Unknown",
          displayName: profile?.displayName ?? u?.name ?? "Unknown",
          avatarUrl: profile?.avatarUrl ?? null,
          bio: profile?.bio ?? null,
          followedAt: f.createdAt,
        };
      })
    );
  }),

  followers: protectedProcedure.query(async ({ ctx }) => {
    const list = await getFollowers(ctx.user.id);
    return Promise.all(
      list.map(async (f) => {
        const u = await getUserById(f.followerId);
        const profile = u ? await getProfileByUserId(u.id) : null;
        return {
          id: f.followerId,
          name: u?.name ?? "Unknown",
          displayName: profile?.displayName ?? u?.name ?? "Unknown",
          avatarUrl: profile?.avatarUrl ?? null,
        };
      })
    );
  }),

  follow: protectedProcedure
    .input(z.object({ userId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot follow yourself" });
      await followUser(ctx.user.id, input.userId);
      return { success: true };
    }),

  unfollow: protectedProcedure
    .input(z.object({ userId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await unfollowUser(ctx.user.id, input.userId);
      return { success: true };
    }),

  friendTracks: protectedProcedure.query(async ({ ctx }) => {
    const trackList = await getInnerCircleTracks(ctx.user.id);
    return trackList.map((t) => ({
      ...t,
      moodTags: t.moodTags ? (JSON.parse(t.moodTags) as string[]) : [],
    }));
  }),
});

// ─── Playlists ────────────────────────────────────────────────────────────────
const playlistsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const list = await getPlaylistsByUserId(ctx.user.id);
    return Promise.all(
      list.map(async (pl) => {
        const pts = await getPlaylistTracks(pl.id);
        return { ...pl, trackCount: pts.length };
      })
    );
  }),

  getTracks: protectedProcedure
    .input(z.object({ playlistId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const pl = await getPlaylistById(input.playlistId);
      if (!pl || pl.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const trackList = await getPlaylistTracks(input.playlistId);
      return trackList.map((t) => ({
        ...t,
        moodTags: t.moodTags ? (JSON.parse(t.moodTags) as string[]) : [],
      }));
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(500).optional(),
        gradient: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createPlaylist({
        userId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        gradient: input.gradient ?? "from-purple-400 to-pink-400",
      });
      return getPlaylistById(id);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(500).optional(),
        gradient: z.string().optional(),
        coverArtUrl: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, coverArtUrl, ...data } = input;
      await updatePlaylist(id, ctx.user.id, {
        ...data,
        coverArtUrl: coverArtUrl !== undefined ? (coverArtUrl || null) : undefined,
      });
      return getPlaylistById(id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deletePlaylist(input.id, ctx.user.id);
      return { success: true };
    }),

  addTrack: protectedProcedure
    .input(z.object({ playlistId: z.number().int(), trackId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const pl = await getPlaylistById(input.playlistId);
      if (!pl || pl.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const existing = await getPlaylistTracks(input.playlistId);
      await addTrackToPlaylist(input.playlistId, input.trackId, existing.length);
      return { success: true };
    }),

  removeTrack: protectedProcedure
    .input(z.object({ playlistId: z.number().int(), trackId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const pl = await getPlaylistById(input.playlistId);
      if (!pl || pl.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await removeTrackFromPlaylist(input.playlistId, input.trackId);
      return { success: true };
    }),

  reorderTracks: protectedProcedure
    .input(
      z.object({
        playlistId: z.number().int(),
        trackIds: z.array(z.number().int()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pl = await getPlaylistById(input.playlistId);
      if (!pl || pl.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await reorderPlaylistTracks(input.playlistId, input.trackIds);
      return { success: true };
    }),
});

// ─── Creators (public profiles) ─────────────────────────────────────────────
const creatorsRouter = router({
  publicProfile: publicProcedure
    .input(z.object({ username: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const found = await getUserByDisplayName(input.username);
      if (!found) throw new TRPCError({ code: "NOT_FOUND", message: "Creator not found" });
      const { user, profile } = found;

      const publicTracks = await getPublicTracksByUserId(user.id);
      const followerCount = await getFollowerCount(user.id);
      const followingCount = await getFollowingCount(user.id);

      // If the requesting user is logged in, check if they already follow this creator
      const viewerIsFollowing = ctx.user
        ? await isFollowing(ctx.user.id, user.id)
        : false;

      return {
        userId: user.id,
        displayName: profile.displayName ?? user.name ?? "Creator",
        bio: profile.bio ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        isPremium: user.isPremium ?? false,
        followerCount,
        followingCount,
        trackCount: publicTracks.length,
        isOwnProfile: ctx.user?.id === user.id,
        viewerIsFollowing,
        tracks: publicTracks.map((t) => ({
          ...t,
          moodTags: t.moodTags ? (JSON.parse(t.moodTags) as string[]) : [],
        })),
      };
    }),
});

// ─── Vibe Presets ────────────────────────────────────────────────────────────
const vibePresetsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const presets = await getVibePresets(ctx.user.id);
    return presets.map((p) => ({
      ...p,
      tags: JSON.parse(p.tags) as string[],
    }));
  }),

  save: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        tags: z.array(z.string()).min(1).max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const preset = await createVibePreset(ctx.user.id, input.name, input.tags);
      if (!preset) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return { ...preset, tags: JSON.parse(preset.tags) as string[] };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteVibePreset(input.id, ctx.user.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});

// ─── Music Generation ─────────────────────────────────────────────────────────
const musicGenerationRouter = router({
  generate: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        prompt: z.string().min(1).max(1000),
        lyrics: z.string().min(1),
        intensity: z.enum(["subtle", "balanced", "aggressive"]).default("balanced"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check monthly generation limit
      const used = await countGenerationsThisMonth(ctx.user.id);
      const limit = ctx.user.isPremium ? Infinity : 5;
      if (used >= limit) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Monthly generation limit reached. Upgrade to Premium for unlimited generations.",
        });
      }

      // Validate parameters (prompt stays as-is, not concatenated with intensity)
      const validation = validateMusicGenerationParams(input.prompt, input.lyrics);
      if (!validation.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: validation.error });
      }

      // Create generation record (store intensity in metadata for future reference)
      const generationId = await createMusicGeneration({
        userId: ctx.user.id,
        title: input.title,
        prompt: input.prompt,
        lyrics: input.lyrics,
        duration: 0,
        audioUrl: "",
        audioKey: "",
        status: "generating",
        metadata: null,
        aceStepTaskId: null,
        errorMessage: null,
      });

      if (!generationId) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create generation record" });
      }

      // Start generation in background (fire-and-forget)
      // Pass intensity as system context, not appended to prompt
      startMusicGeneration(input.prompt, input.lyrics, input.intensity as IntensityLevel)
        .then(async (predictionId) => {
          const result = await pollMusicGeneration(predictionId);
          const audioBuffer = await fetchAudioBytes(result.audioUrl);
          const ext = result.mimeType === "audio/wav" ? "wav" : "mp3";
          const audioKey = `music/${ctx.user.id}/${generationId}-${nanoid(8)}.${ext}`;
          const { url } = await storagePut(audioKey, audioBuffer, result.mimeType);
          await updateMusicGenerationStatus(generationId, "complete", {
            audioUrl: url,
            audioKey: audioKey,
            metadata: JSON.stringify({ predictionId }),
          });
        })
        .catch(async (error: unknown) => {
          const raw = error instanceof Error ? error.message : String(error);
          console.error(`[Music Generation] Failed for ID ${generationId}:`, raw);
          // Sanitize: never expose raw API errors (keys, credits, internal details) to users
          let userMessage = "Generation failed — the AI service encountered an issue. Please try again.";
          if (raw.toLowerCase().includes("insufficient credit") || raw.includes("402")) {
            userMessage = "Generation temporarily unavailable. Please try again shortly.";
          } else if (raw.toLowerCase().includes("timeout") || raw.toLowerCase().includes("timed out")) {
            userMessage = "Generation timed out — the AI service took too long. Please try again.";
          } else if (raw.toLowerCase().includes("rate limit") || raw.includes("429")) {
            userMessage = "Too many requests — please wait a moment and try again.";
          }
          await updateMusicGenerationStatus(generationId, "failed", {
            errorMessage: userMessage,
          });
        });

      return { id: generationId, status: "generating" };
    }),

  monthlyUsage: protectedProcedure.query(async ({ ctx }) => {
    const used = await countGenerationsThisMonth(ctx.user.id);
    const isPremium = ctx.user.isPremium ?? false;
    const limit = isPremium ? null : 5;
    return { used, limit, isPremium };
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      return getMusicGenerationById(input.id);
    }),

  myGenerations: protectedProcedure.query(async ({ ctx }) => {
    return getMusicGenerationsByUserId(ctx.user.id);
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await deleteMusicGeneration(input.id, ctx.user.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),

  regenerate: protectedProcedure
    .input(
      z.object({
        generationId: z.number().int(),
        refinement: z.enum(["more_aggressive", "less_busy", "different_vibe"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check monthly generation limit
      const used = await countGenerationsThisMonth(ctx.user.id);
      const limit = ctx.user.isPremium ? Infinity : 5;
      if (used >= limit) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Monthly generation limit reached. Upgrade to Premium for unlimited generations.",
        });
      }

      // Get the original generation
      const original = await getMusicGenerationById(input.generationId);
      if (!original) throw new TRPCError({ code: "NOT_FOUND" });
      if (original.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (original.status !== "complete") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only refine completed generations" });
      }

      // Validate parameters (prompt stays as-is, refinement passed as system guidance)
      const validation = validateMusicGenerationParams(original.prompt, original.lyrics);
      if (!validation.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: validation.error });
      }

      // Create new generation record (store original prompt, refinement passed separately)
      const generationId = await createMusicGeneration({
        userId: ctx.user.id,
        title: original.title,
        prompt: original.prompt,
        lyrics: original.lyrics,
        duration: 0,
        audioUrl: "",
        audioKey: "",
        status: "generating",
        metadata: null,
        aceStepTaskId: null,
        errorMessage: null,
      });

      if (!generationId) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create generation record" });
      }

      // Start generation in background (fire-and-forget)
      // Pass refinement as system guidance, not appended to prompt
      startMusicGeneration(original.prompt, original.lyrics, undefined, input.refinement)
        .then(async (predictionId) => {
          const result = await pollMusicGeneration(predictionId);
          const audioBuffer = await fetchAudioBytes(result.audioUrl);
          const ext = result.mimeType === "audio/wav" ? "wav" : "mp3";
          const audioKey = `music/${ctx.user.id}/${generationId}-${nanoid(8)}.${ext}`;
          const { url } = await storagePut(audioKey, audioBuffer, result.mimeType);
          await updateMusicGenerationStatus(generationId, "complete", {
            audioUrl: url,
            audioKey: audioKey,
            metadata: JSON.stringify({ predictionId }),
          });
        })
        .catch(async (error: unknown) => {
          const raw = error instanceof Error ? error.message : String(error);
          console.error(`[Music Generation] Failed for ID ${generationId}:`, raw);
          let userMessage = "Generation failed — the AI service encountered an issue. Please try again.";
          if (raw.toLowerCase().includes("insufficient credit") || raw.includes("402")) {
            userMessage = "Generation temporarily unavailable. Please try again shortly.";
          } else if (raw.toLowerCase().includes("timeout") || raw.toLowerCase().includes("timed out")) {
            userMessage = "Generation timed out — the AI service took too long. Please try again.";
          } else if (raw.toLowerCase().includes("rate limit") || raw.includes("429")) {
            userMessage = "Too many requests — please wait a moment and try again.";
          }
          await updateMusicGenerationStatus(generationId, "failed", {
            errorMessage: userMessage,
          });
        });

      return { id: generationId, status: "generating" };
    }),

  getHistory: protectedProcedure
    .input(z.object({ generationId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const generation = await getMusicGenerationById(input.generationId);
      if (!generation || generation.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getMusicGenerationHistory(input.generationId);
    }),

  publish: protectedProcedure
    .input(
      z.object({
        generationId: z.number().int(),
        visibility: z.enum(["private", "inner-circle", "public"]).default("private"),
        moodTags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const generation = await getMusicGenerationById(input.generationId);
      if (!generation) throw new TRPCError({ code: "NOT_FOUND" });
      if (generation.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (generation.status !== "complete" || !generation.audioUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Generation is not complete yet" });
      }
      const trackId = await createTrack({
        userId: ctx.user.id,
        title: generation.title,
        artist: null,
        genre: null,
        description: `Generated with MiniMax Music 2.5 • AI`,
        audioUrl: generation.audioUrl,
        audioKey: generation.audioKey,
        duration: generation.duration,
        moodTags: input.moodTags ? JSON.stringify(input.moodTags) : null,
        visibility: input.visibility,
        gradient: "from-purple-500 to-pink-500",
        coverArtUrl: null,
      });
      return getTrackById(trackId);
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  profiles: profilesRouter,
  tracks: tracksRouter,
  friends: friendsRouter,
  playlists: playlistsRouter,
  creators: creatorsRouter,
  stripe: stripeRouter,
  vibePresets: vibePresetsRouter,
  musicGeneration: musicGenerationRouter,
});

export type AppRouter = typeof appRouter;
