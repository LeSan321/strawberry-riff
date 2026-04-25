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
  studioTheme: varchar("studioTheme", { length: 64 }).default("forest-studio").notNull(),
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
  coverArtUrl: text("coverArtUrl"),
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
  coverArtUrl: text("coverArtUrl"),
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

// ─── Music Generations ────────────────────────────────────────────────────────
export const musicGenerations = mysqlTable("music_generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  prompt: text("prompt").notNull(), // ACE-Step prompt (tags/description)
  lyrics: text("lyrics").notNull(), // Song lyrics with structure
  duration: int("duration").notNull(), // Duration in seconds (60, 120, 240)
  audioUrl: text("audioUrl").notNull(), // S3 URL to generated MP3
  audioKey: text("audioKey").notNull(), // S3 key for reference
  status: mysqlEnum("status", ["generating", "complete", "failed"])
    .default("generating")
    .notNull(),
  aceStepTaskId: varchar("aceStepTaskId", { length: 100 }), // ACE-Step task ID for polling
  metadata: text("metadata"), // JSON metadata from ACE-Step
  errorMessage: text("errorMessage"), // Error details if generation failed
  isFavorited: boolean("isFavorited").default(false).notNull(), // User marked as favorite
  referenceAudioUrl: text("referenceAudioUrl"), // Optional style reference audio URL
  voiceReferenceUrl: text("voiceReferenceUrl"), // Optional voice reference audio URL
  visualBrief: text("visualBrief"), // JSON: auto-generated visual brief (camera, lighting, color, emotion, scene)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MusicGeneration = typeof musicGenerations.$inferSelect;
export type InsertMusicGeneration = typeof musicGenerations.$inferInsert;

// ─── Music Generation History (for retakes/extends) ────────────────────────────
export const musicGenerationHistory = mysqlTable("music_generation_history", {
  id: int("id").autoincrement().primaryKey(),
  generationId: int("generationId").notNull(),
  operation: mysqlEnum("operation", ["generate", "retake", "extend"])
    .default("generate")
    .notNull(),
  audioUrl: text("audioUrl"), // URL of this variation
  audioKey: text("audioKey"), // S3 key for this variation
  aceStepTaskId: varchar("aceStepTaskId", { length: 100 }),
  metadata: text("metadata"), // JSON metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MusicGenerationHistory = typeof musicGenerationHistory.$inferSelect;

// ─── Lyrics Drafts ────────────────────────────────────────────────────────────
export const lyricsDrafts = mysqlTable("lyrics_drafts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull().default("Untitled"),
  fusion: varchar("fusion", { length: 200 }),       // Selected fusion name
  mood: varchar("mood", { length: 200 }),            // Mood/emotional feeling
  topic: varchar("topic", { length: 500 }),          // Theme/topic
  perspective: varchar("perspective", { length: 100 }), // Narrative perspective
  hookSeed: varchar("hookSeed", { length: 500 }),    // Hook seed phrase
  structure: varchar("structure", { length: 200 }), // Song structure tags
  writingTeam: varchar("writingTeam", { length: 100 }), // Writing team member
  generatedLyrics: text("generatedLyrics"),          // Full AI-generated lyrics
  stickinessAnalysis: text("stickinessAnalysis"),    // AI stickiness notes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LyricsDraft = typeof lyricsDrafts.$inferSelect;
export type InsertLyricsDraft = typeof lyricsDrafts.$inferInsert;

// ─── Style Library ────────────────────────────────────────────────────────────
export const styleLibrary = mysqlTable("style_library", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),          // User-given name for this style
  prompt: text("prompt").notNull(),                           // The music style prompt
  sourceGenerationId: int("sourceGenerationId"),              // Optional: which generation it came from
  sourceTitle: varchar("sourceTitle", { length: 200 }),       // Title of the source generation
  notes: text("notes"),                                       // Optional user notes
  usageCount: int("usageCount").default(0).notNull(),         // How many times used
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StyleLibraryEntry = typeof styleLibrary.$inferSelect;
export type InsertStyleLibraryEntry = typeof styleLibrary.$inferInsert;
