import { and, desc, eq, gte, inArray, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Friend,
  InsertPlaylist,
  InsertProfile,
  InsertTrack,
  InsertUser,
  MusicGeneration,
  MusicGenerationHistory,
  Playlist,
  PlaylistTrack,
  Profile,
  Track,
  User,
  InsertLyricsDraft,
  LyricsDraft,
  VibePreset,
  friends,
  lyricsDrafts,
  musicGenerationHistory,
  musicGenerations,
  playlistTracks,
  playlists,
  profiles,
  trackLikes,
  tracks,
  users,
  vibePresets,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<{ isNew: boolean }> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return { isNew: false };

  // Check if user already exists before upserting
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.openId, user.openId)).limit(1);
  const isNew = existing.length === 0;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  return { isNew };
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateStudioTheme(userId: number, theme: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ studioTheme: theme }).where(eq(users.id, userId));
}

// ─── Profiles ─────────────────────────────────────────────────────────────────
export async function getProfileByUserId(userId: number): Promise<Profile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertProfile(data: InsertProfile): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(profiles)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        displayName: data.displayName,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        profileComplete: data.profileComplete,
      },
    });
}

// ─── Tracks ───────────────────────────────────────────────────────────────────
export async function createTrack(data: InsertTrack): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(tracks).values(data);
  return (result[0] as any).insertId as number;
}

export async function getTrackById(id: number): Promise<Track | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tracks).where(eq(tracks.id, id)).limit(1);
  return result[0];
}

export async function getTracksByUserId(userId: number): Promise<Track[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tracks).where(eq(tracks.userId, userId)).orderBy(desc(tracks.createdAt));
}

export async function getPublicTracks(limit = 50): Promise<Track[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tracks)
    .where(eq(tracks.visibility, "public"))
    .orderBy(desc(tracks.createdAt))
    .limit(limit);
}

export async function getInnerCircleTracks(followerUserId: number): Promise<Track[]> {
  const db = await getDb();
  if (!db) return [];
  // Get IDs of users the current user follows
  const following = await db
    .select({ followingId: friends.followingId })
    .from(friends)
    .where(eq(friends.followerId, followerUserId));
  const followingIds = following.map((f) => f.followingId);
  if (followingIds.length === 0) return [];
  return db
    .select()
    .from(tracks)
    .where(
      and(
        inArray(tracks.userId, followingIds),
        or(eq(tracks.visibility, "inner-circle"), eq(tracks.visibility, "public"))
      )
    )
    .orderBy(desc(tracks.createdAt));
}

export async function updateTrack(
  id: number,
  userId: number,
  data: Partial<Pick<Track, "title" | "artist" | "genre" | "description" | "moodTags" | "visibility" | "gradient" | "coverArtUrl">>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(tracks)
    .set(data)
    .where(and(eq(tracks.id, id), eq(tracks.userId, userId)));
}

export async function deleteTrack(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(tracks).where(and(eq(tracks.id, id), eq(tracks.userId, userId)));
}

export async function incrementTrackPlays(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(tracks)
    .set({ plays: db.$count(tracks, eq(tracks.id, id)) } as any)
    .where(eq(tracks.id, id));
  // Simpler raw increment
  await (db as any).execute(`UPDATE tracks SET plays = plays + 1 WHERE id = ${id}`);
}

// ─── Track Likes ──────────────────────────────────────────────────────────────
export async function likeTrack(userId: number, trackId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(trackLikes).values({ userId, trackId });
    await (db as any).execute(`UPDATE tracks SET likes = likes + 1 WHERE id = ${trackId}`);
  } catch {
    // already liked — ignore duplicate key
  }
}

export async function unlikeTrack(userId: number, trackId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const result = await db
    .delete(trackLikes)
    .where(and(eq(trackLikes.userId, userId), eq(trackLikes.trackId, trackId)));
  if ((result[0] as any).affectedRows > 0) {
    await (db as any).execute(`UPDATE tracks SET likes = GREATEST(likes - 1, 0) WHERE id = ${trackId}`);
  }
}

export async function getLikedTrackIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ trackId: trackLikes.trackId })
    .from(trackLikes)
    .where(eq(trackLikes.userId, userId));
  return result.map((r) => r.trackId);
}

// ─── Friends ──────────────────────────────────────────────────────────────────
export async function followUser(followerId: number, followingId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(friends).values({ followerId, followingId });
  } catch {
    // already following
  }
}

export async function unfollowUser(followerId: number, followingId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(friends)
    .where(and(eq(friends.followerId, followerId), eq(friends.followingId, followingId)));
}

export async function getFollowing(userId: number): Promise<Friend[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(friends).where(eq(friends.followerId, userId));
}

export async function getFollowers(userId: number): Promise<Friend[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(friends).where(eq(friends.followingId, userId));
}

export async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(friends)
    .where(and(eq(friends.followerId, followerId), eq(friends.followingId, followingId)))
    .limit(1);
  return result.length > 0;
}

export async function getUserByDisplayName(displayName: string): Promise<{ user: User; profile: Profile } | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  // Case-insensitive match on displayName
  const profileResult = await db
    .select()
    .from(profiles)
    .where(sql`LOWER(${profiles.displayName}) = LOWER(${displayName})`)
    .limit(1);
  if (!profileResult[0]) return undefined;
  const userResult = await db.select().from(users).where(eq(users.id, profileResult[0].userId)).limit(1);
  if (!userResult[0]) return undefined;
  return { user: userResult[0], profile: profileResult[0] };
}

export async function getPublicTracksByUserId(userId: number): Promise<Track[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tracks)
    .where(and(eq(tracks.userId, userId), eq(tracks.visibility, "public")))
    .orderBy(desc(tracks.createdAt));
}

export async function getFollowerCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(friends).where(eq(friends.followingId, userId));
  return result.length;
}

export async function getFollowingCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(friends).where(eq(friends.followerId, userId));
  return result.length;
}

export async function getAllUsers(excludeId?: number): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  if (excludeId) {
    return db.select().from(users).where(ne(users.id, excludeId));
  }
  return db.select().from(users);
}

// ─── Playlists ────────────────────────────────────────────────────────────────
export async function createPlaylist(data: InsertPlaylist): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(playlists).values(data);
  return (result[0] as any).insertId as number;
}

export async function getPlaylistsByUserId(userId: number): Promise<Playlist[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(playlists).where(eq(playlists.userId, userId)).orderBy(desc(playlists.createdAt));
}

export async function getPlaylistById(id: number): Promise<Playlist | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(playlists).where(eq(playlists.id, id)).limit(1);
  return result[0];
}

export async function updatePlaylist(
  id: number,
  userId: number,
  data: Partial<Pick<Playlist, "title" | "description" | "gradient" | "coverArtUrl">>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(playlists)
    .set(data)
    .where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
}

export async function deletePlaylist(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(playlistTracks).where(eq(playlistTracks.playlistId, id));
  await db.delete(playlists).where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
}

export async function addTrackToPlaylist(playlistId: number, trackId: number, position: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(playlistTracks).values({ playlistId, trackId, position });
  } catch {
    // already in playlist
  }
}

export async function removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(playlistTracks)
    .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)));
}

export async function getPlaylistTracks(playlistId: number): Promise<Track[]> {
  const db = await getDb();
  if (!db) return [];
  const pts = await db
    .select()
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, playlistId))
    .orderBy(playlistTracks.position);
  if (pts.length === 0) return [];
  const trackIds = pts.map((pt) => pt.trackId);
  return db.select().from(tracks).where(inArray(tracks.id, trackIds));
}

export async function reorderPlaylistTracks(playlistId: number, trackIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Update each track's position in order
  await Promise.all(
    trackIds.map((trackId, index) =>
      db
        .update(playlistTracks)
        .set({ position: index })
        .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)))
    )
  );
}

// ─── Stripe / Premium ─────────────────────────────────────────────────────────
export async function setUserPremium(
  userId: number,
  data: {
    isPremium: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    premiumSince?: Date | null;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({
      isPremium: data.isPremium,
      ...(data.stripeCustomerId !== undefined && { stripeCustomerId: data.stripeCustomerId }),
      ...(data.stripeSubscriptionId !== undefined && { stripeSubscriptionId: data.stripeSubscriptionId }),
      ...(data.premiumSince !== undefined && { premiumSince: data.premiumSince }),
    })
    .where(eq(users.id, userId));
}

export async function getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  return result[0];
}

export async function getTrackWithCreator(trackId: number): Promise<{
  track: Track;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  creatorBio: string | null;
} | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      track: tracks,
      creatorUsername: profiles.displayName,
      creatorAvatarUrl: profiles.avatarUrl,
      creatorBio: profiles.bio,
    })
    .from(tracks)
    .leftJoin(profiles, eq(tracks.userId, profiles.userId))
    .where(and(eq(tracks.id, trackId), eq(tracks.visibility, "public")))
    .limit(1);
  if (!result[0]) return undefined;
  return {
    track: result[0].track,
    creatorUsername: result[0].creatorUsername ?? null,
    creatorAvatarUrl: result[0].creatorAvatarUrl ?? null,
    creatorBio: result[0].creatorBio ?? null,
  };
}

// ─── Vibe Presets ─────────────────────────────────────────────────────────────
export async function getVibePresets(userId: number): Promise<VibePreset[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(vibePresets)
    .where(eq(vibePresets.userId, userId))
    .orderBy(desc(vibePresets.createdAt));
}

export async function createVibePreset(
  userId: number,
  name: string,
  tags: string[]
): Promise<VibePreset | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .insert(vibePresets)
    .values({ userId, name, tags: JSON.stringify(tags) });
  const id = (result as any)[0]?.insertId;
  if (!id) return null;
  const rows = await db.select().from(vibePresets).where(eq(vibePresets.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function deleteVibePreset(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .delete(vibePresets)
    .where(and(eq(vibePresets.id, id), eq(vibePresets.userId, userId)));
  return (result as any)[0]?.affectedRows > 0;
}


// ─── Music Generations ────────────────────────────────────────────────────────
export async function createMusicGeneration(
  data: Omit<MusicGeneration, "id" | "createdAt" | "updatedAt" | "completedAt">
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(musicGenerations).values(data);
  return (result as any)[0]?.insertId ?? null;
}

export async function getMusicGenerationById(id: number): Promise<MusicGeneration | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(musicGenerations)
    .where(eq(musicGenerations.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getMusicGenerationsByUserId(userId: number): Promise<MusicGeneration[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(musicGenerations)
    .where(eq(musicGenerations.userId, userId))
    .orderBy(desc(musicGenerations.createdAt));
}

export async function updateMusicGenerationStatus(
  id: number,
  status: "generating" | "complete" | "failed",
  updates?: { audioUrl?: string; audioKey?: string; metadata?: string; errorMessage?: string; visualBrief?: string }
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const completedAt = status === "complete" ? new Date() : undefined;
  const result = await db
    .update(musicGenerations)
    .set({
      status,
      completedAt,
      ...updates,
    })
    .where(eq(musicGenerations.id, id));
  return (result as any)[0]?.affectedRows > 0;
}

export async function deleteMusicGeneration(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Delete history first
  await db.delete(musicGenerationHistory).where(eq(musicGenerationHistory.generationId, id));
  // Then delete the generation
  const result = await db
    .delete(musicGenerations)
    .where(and(eq(musicGenerations.id, id), eq(musicGenerations.userId, userId)));
  return (result as any)[0]?.affectedRows > 0;
}

export async function toggleMusicGenerationFavorite(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const generation = await db
    .select({ isFavorited: musicGenerations.isFavorited })
    .from(musicGenerations)
    .where(and(eq(musicGenerations.id, id), eq(musicGenerations.userId, userId)))
    .limit(1);
  if (!generation[0]) return false;
  const newStatus = !generation[0].isFavorited;
  const result = await db
    .update(musicGenerations)
    .set({ isFavorited: newStatus })
    .where(and(eq(musicGenerations.id, id), eq(musicGenerations.userId, userId)));
  return (result as any)[0]?.affectedRows > 0;
}

export async function addMusicGenerationHistory(
  generationId: number,
  operation: "generate" | "retake" | "extend",
  audioUrl: string,
  audioKey: string,
  metadata?: string
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(musicGenerationHistory).values({
    generationId,
    operation,
    audioUrl,
    audioKey,
    metadata,
  });
  return (result as any)[0]?.insertId ?? null;
}

export async function getMusicGenerationHistory(generationId: number): Promise<MusicGenerationHistory[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(musicGenerationHistory)
    .where(eq(musicGenerationHistory.generationId, generationId))
    .orderBy(desc(musicGenerationHistory.createdAt));
}

export async function countGenerationsThisMonth(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(musicGenerations)
    .where(
      and(
        eq(musicGenerations.userId, userId),
        gte(musicGenerations.createdAt, startOfMonth)
      )
    );
  return Number(rows[0]?.count ?? 0);
}

// ─── Lyrics Drafts ────────────────────────────────────────────────────────────
export async function createLyricsDraft(data: InsertLyricsDraft): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(lyricsDrafts).values(data);
  return (result as any)[0]?.insertId ?? null;
}

export async function getLyricsDraftsByUserId(userId: number): Promise<LyricsDraft[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(lyricsDrafts)
    .where(eq(lyricsDrafts.userId, userId))
    .orderBy(desc(lyricsDrafts.createdAt));
}

export async function getLyricsDraftById(id: number): Promise<LyricsDraft | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(lyricsDrafts)
    .where(eq(lyricsDrafts.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function deleteLyricsDraft(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .delete(lyricsDrafts)
    .where(and(eq(lyricsDrafts.id, id), eq(lyricsDrafts.userId, userId)));
  return (result as any)[0]?.affectedRows > 0;
}
