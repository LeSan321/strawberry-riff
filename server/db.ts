import { and, desc, eq, inArray, ne, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Friend,
  InsertPlaylist,
  InsertProfile,
  InsertTrack,
  InsertUser,
  Playlist,
  PlaylistTrack,
  Profile,
  Track,
  User,
  friends,
  playlistTracks,
  playlists,
  profiles,
  trackLikes,
  tracks,
  users,
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
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

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
  data: Partial<Pick<Track, "title" | "artist" | "genre" | "description" | "moodTags" | "visibility" | "gradient">>
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
  data: Partial<Pick<Playlist, "title" | "description" | "gradient">>
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
