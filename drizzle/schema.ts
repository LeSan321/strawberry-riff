import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 64 }),
  isPremium: boolean("isPremium").default(false).notNull(),
  premiumSince: timestamp("premiumSince"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Creator Profiles ─────────────────────────────────────────────────────────
export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 100 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  profileComplete: boolean("profileComplete").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

// ─── Tracks ───────────────────────────────────────────────────────────────────
export const tracks = mysqlTable("tracks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  artist: varchar("artist", { length: 200 }),
  genre: varchar("genre", { length: 100 }),
  description: text("description"),
  audioUrl: text("audioUrl").notNull(),
  audioKey: text("audioKey").notNull(),
  duration: int("duration"), // seconds
  moodTags: text("moodTags"), // JSON array stored as text
  visibility: mysqlEnum("visibility", ["private", "inner-circle", "public"])
    .default("private")
    .notNull(),
  likes: int("likes").default(0).notNull(),
  plays: int("plays").default(0).notNull(),
  gradient: varchar("gradient", { length: 100 }).default("from-pink-400 to-purple-500"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;

// ─── Track Likes ──────────────────────────────────────────────────────────────
export const trackLikes = mysqlTable("track_likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  trackId: int("trackId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrackLike = typeof trackLikes.$inferSelect;

// ─── Friends (follows) ────────────────────────────────────────────────────────
export const friends = mysqlTable("friends", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(), // the user who follows
  followingId: int("followingId").notNull(), // the user being followed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Friend = typeof friends.$inferSelect;

// ─── Playlists ────────────────────────────────────────────────────────────────
export const playlists = mysqlTable("playlists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  gradient: varchar("gradient", { length: 100 }).default("from-purple-400 to-pink-400"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = typeof playlists.$inferInsert;

// ─── Playlist Tracks (join table) ─────────────────────────────────────────────
export const playlistTracks = mysqlTable("playlist_tracks", {
  id: int("id").autoincrement().primaryKey(),
  playlistId: int("playlistId").notNull(),
  trackId: int("trackId").notNull(),
  position: int("position").default(0).notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type PlaylistTrack = typeof playlistTracks.$inferSelect;

// ─── Vibe Presets ─────────────────────────────────────────────────────────────
export const vibePresets = mysqlTable("vibe_presets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  tags: text("tags").notNull(), // JSON array of tag strings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VibePreset = typeof vibePresets.$inferSelect;
export type InsertVibePreset = typeof vibePresets.$inferInsert;
