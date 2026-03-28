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
  getFollowers,
  getFollowing,
  getInnerCircleTracks,
  getLikedTrackIds,
  getPlaylistById,
  getPlaylistTracks,
  getPlaylistsByUserId,
  getProfileByUserId,
  getPublicTracks,
  getTrackById,
  getTracksByUserId,
  getUserById,
  isFollowing,
  likeTrack,
  removeTrackFromPlaylist,
  unfollowUser,
  unlikeTrack,
  updatePlaylist,
  updateTrack,
  upsertProfile,
} from "./db";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

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
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const uid = input.userId ?? ctx.user?.id;
      if (!uid) return null;
      return getProfileByUserId(uid);
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

  publicFeed: publicProcedure
    .input(z.object({ limit: z.number().int().max(100).default(50) }))
    .query(async ({ input }) => {
      const trackList = await getPublicTracks(input.limit);
      return trackList.map((t) => ({
        ...t,
        moodTags: t.moodTags ? (JSON.parse(t.moodTags) as string[]) : [],
      }));
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, moodTags, ...rest } = input;
      await updateTrack(id, ctx.user.id, {
        ...rest,
        moodTags: moodTags ? JSON.stringify(moodTags) : undefined,
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updatePlaylist(id, ctx.user.id, data);
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
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  profiles: profilesRouter,
  tracks: tracksRouter,
  friends: friendsRouter,
  playlists: playlistsRouter,
});

export type AppRouter = typeof appRouter;
