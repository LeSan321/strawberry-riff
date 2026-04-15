import { describe, expect, it, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

// ─── Mock db helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getPlaylistById: vi.fn(),
  getPlaylistTracks: vi.fn(),
  addTrackToPlaylist: vi.fn(),
  removeTrackFromPlaylist: vi.fn(),
  createPlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
  getPlaylistsByUserId: vi.fn(),
  updatePlaylist: vi.fn(),
}));

import {
  getPlaylistById,
  getPlaylistTracks,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  getPlaylistsByUserId,
} from "./db";
import { appRouter } from "./routers";

// ─── Helpers ──────────────────────────────────────────────────────────────────
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-open-id",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const mockPlaylist = {
  id: 10,
  userId: 1,
  title: "Test Playlist",
  description: null,
  gradient: "from-purple-400 to-pink-400",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("playlists.addTrack", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds a track to a playlist the user owns", async () => {
    vi.mocked(getPlaylistById).mockResolvedValue(mockPlaylist);
    vi.mocked(getPlaylistTracks).mockResolvedValue([]);
    vi.mocked(addTrackToPlaylist).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeCtx(1));
    await expect(
      caller.playlists.addTrack({ playlistId: 10, trackId: 42 })
    ).resolves.not.toThrow();

    expect(addTrackToPlaylist).toHaveBeenCalledWith(10, 42, 0);
  });

  it("throws FORBIDDEN when user does not own the playlist", async () => {
    vi.mocked(getPlaylistById).mockResolvedValue(mockPlaylist); // owned by userId 1
    const caller = appRouter.createCaller(makeCtx(99)); // different user

    await expect(
      caller.playlists.addTrack({ playlistId: 10, trackId: 42 })
    ).rejects.toThrow(TRPCError);
  });

  it("throws NOT_FOUND when playlist does not exist", async () => {
    vi.mocked(getPlaylistById).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx(1));

    await expect(
      caller.playlists.addTrack({ playlistId: 999, trackId: 42 })
    ).rejects.toThrow(TRPCError);
  });

  it("positions the new track after existing tracks", async () => {
    const existingTracks = [
      { id: 1, playlistId: 10, trackId: 5, position: 0, addedAt: new Date() },
      { id: 2, playlistId: 10, trackId: 7, position: 1, addedAt: new Date() },
    ];
    vi.mocked(getPlaylistById).mockResolvedValue(mockPlaylist);
    vi.mocked(getPlaylistTracks).mockResolvedValue(existingTracks);
    vi.mocked(addTrackToPlaylist).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeCtx(1));
    await caller.playlists.addTrack({ playlistId: 10, trackId: 42 });

    // position should be existingTracks.length = 2
    expect(addTrackToPlaylist).toHaveBeenCalledWith(10, 42, 2);
  });
});

describe("playlists.removeTrack", () => {
  beforeEach(() => vi.clearAllMocks());

  it("removes a track from a playlist the user owns", async () => {
    vi.mocked(getPlaylistById).mockResolvedValue(mockPlaylist);
    vi.mocked(removeTrackFromPlaylist).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeCtx(1));
    await expect(
      caller.playlists.removeTrack({ playlistId: 10, trackId: 42 })
    ).resolves.not.toThrow();

    expect(removeTrackFromPlaylist).toHaveBeenCalledWith(10, 42);
  });

  it("throws FORBIDDEN when user does not own the playlist", async () => {
    vi.mocked(getPlaylistById).mockResolvedValue(mockPlaylist);
    const caller = appRouter.createCaller(makeCtx(99));

    await expect(
      caller.playlists.removeTrack({ playlistId: 10, trackId: 42 })
    ).rejects.toThrow(TRPCError);
  });
});

describe("playlists.getTracks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns tracks for a given playlist", async () => {
    // moodTags is stored as a JSON string in the DB; the router parses it
    const dbTracks = [
      { id: 1, title: "Song A", artist: "Artist A", audioUrl: "http://a.mp3", gradient: null, moodTags: JSON.stringify(["chill"]) },
    ];
    vi.mocked(getPlaylistById).mockResolvedValue(mockPlaylist);
    vi.mocked(getPlaylistTracks).mockResolvedValue(dbTracks as never);

    const caller = appRouter.createCaller(makeCtx(1));
    const result = await caller.playlists.getTracks({ playlistId: 10 });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 1, title: "Song A", moodTags: ["chill"] });
  });
});

describe("playlists.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns playlists with track counts for the authenticated user", async () => {
    vi.mocked(getPlaylistsByUserId).mockResolvedValue([mockPlaylist]);
    vi.mocked(getPlaylistTracks).mockResolvedValue([]);

    const caller = appRouter.createCaller(makeCtx(1));
    const result = await caller.playlists.list();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 10, title: "Test Playlist", trackCount: 0 });
  });
});
