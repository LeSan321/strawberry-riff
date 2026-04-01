import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getProfileByUserId: vi.fn().mockResolvedValue(null),
  upsertProfile: vi.fn().mockResolvedValue(undefined),
  createTrack: vi.fn().mockResolvedValue(1),
  getTrackById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    title: "Test Track",
    artist: "Test Artist",
    genre: "Pop",
    description: null,
    audioUrl: "https://example.com/audio.mp3",
    audioKey: "audio/1/abc.mp3",
    duration: 180,
    moodTags: '["Chill","Dreamy"]',
    visibility: "public",
    gradient: "from-pink-400 to-purple-500",
    likes: 0,
    plays: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getTracksByUserId: vi.fn().mockResolvedValue([]),
  getPublicTracks: vi.fn().mockResolvedValue([]),
  getInnerCircleTracks: vi.fn().mockResolvedValue([]),
  updateTrack: vi.fn().mockResolvedValue(undefined),
  deleteTrack: vi.fn().mockResolvedValue(undefined),
  likeTrack: vi.fn().mockResolvedValue(undefined),
  unlikeTrack: vi.fn().mockResolvedValue(undefined),
  getLikedTrackIds: vi.fn().mockResolvedValue([]),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getFollowing: vi.fn().mockResolvedValue([]),
  getFollowers: vi.fn().mockResolvedValue([]),
  getUserById: vi.fn().mockResolvedValue(null),
  followUser: vi.fn().mockResolvedValue(undefined),
  unfollowUser: vi.fn().mockResolvedValue(undefined),
  isFollowing: vi.fn().mockResolvedValue(false),
  getPlaylistsByUserId: vi.fn().mockResolvedValue([]),
  getPlaylistById: vi.fn().mockResolvedValue(null),
  getPlaylistTracks: vi.fn().mockResolvedValue([]),
  createPlaylist: vi.fn().mockResolvedValue(1),
  updatePlaylist: vi.fn().mockResolvedValue(undefined),
  deletePlaylist: vi.fn().mockResolvedValue(undefined),
  addTrackToPlaylist: vi.fn().mockResolvedValue(undefined),
  removeTrackFromPlaylist: vi.fn().mockResolvedValue(undefined),
  getUserByDisplayName: vi.fn().mockResolvedValue(undefined),
  getPublicTracksByUserId: vi.fn().mockResolvedValue([]),
  getFollowerCount: vi.fn().mockResolvedValue(0),
  getFollowingCount: vi.fn().mockResolvedValue(0),
  setUserPremium: vi.fn().mockResolvedValue(undefined),
  getUserByStripeCustomerId: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/file.mp3", key: "audio/1/abc.mp3" }),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
function makeAuthCtx(overrides?: Partial<TrpcContext["user"]>): TrpcContext {
  const clearedCookies: unknown[] = [];
  return {
    user: {
      id: 1,
      openId: "user-1",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (_name: string, _opts: unknown) => clearedCookies.push({ _name, _opts }),
    } as TrpcContext["res"],
  };
}

function makeAnonCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns null for anonymous users", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated users", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
    expect(result?.email).toBe("test@example.com");
  });

  it("logout clears session cookie and returns success", async () => {
    const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true });
  });
});

// ─── Profiles ─────────────────────────────────────────────────────────────────
describe("profiles", () => {
  it("get returns null when no profile exists", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.profiles.get({ userId: 1 });
    expect(result).toBeNull();
  });

  it("upsert requires authentication", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(
      caller.profiles.upsert({ displayName: "Test", bio: "Hello" })
    ).rejects.toThrow();
  });

  it("upsert succeeds for authenticated users", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.profiles.upsert({
      displayName: "Test Creator",
      bio: "Making music",
      profileComplete: true,
    });
    expect(result).toBeNull(); // mocked to return null
  });

  it("uploadAvatar requires authentication", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(
      caller.profiles.uploadAvatar({ base64: "abc", mimeType: "image/jpeg" })
    ).rejects.toThrow();
  });

  it("uploadAvatar returns a CDN URL", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.profiles.uploadAvatar({ base64: "abc123", mimeType: "image/png" });
    expect(result.url).toContain("https://");
  });
});

// ─── Tracks ───────────────────────────────────────────────────────────────────
describe("tracks", () => {
  it("publicFeed is accessible without authentication", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    const result = await caller.tracks.publicFeed({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("myTracks requires authentication", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.tracks.myTracks()).rejects.toThrow();
  });

  it("myTracks returns empty array when user has no tracks", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.tracks.myTracks();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(
      caller.tracks.create({
        title: "My Track",
        audioUrl: "https://example.com/audio.mp3",
        audioKey: "audio/1/abc.mp3",
        visibility: "public",
      })
    ).rejects.toThrow();
  });

  it("create returns the new track", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.tracks.create({
      title: "My Track",
      artist: "Me",
      audioUrl: "https://example.com/audio.mp3",
      audioKey: "audio/1/abc.mp3",
      visibility: "public",
      moodTags: ["Chill", "Dreamy"],
    });
    expect(result).not.toBeNull();
    expect(result?.title).toBe("Test Track"); // from mock
  });

  it("delete requires authentication", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.tracks.delete({ id: 1 })).rejects.toThrow();
  });

  it("delete returns success for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.tracks.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("like requires authentication", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.tracks.like({ trackId: 1 })).rejects.toThrow();
  });

  it("like returns success", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.tracks.like({ trackId: 1 });
    expect(result).toEqual({ success: true });
  });

  it("unlike returns success", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.tracks.unlike({ trackId: 1 });
    expect(result).toEqual({ success: true });
  });

  it("myLikes returns an array", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.tracks.myLikes();
    expect(Array.isArray(result)).toBe(true);
  });

  it("friendFeed requires authentication", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.tracks.friendFeed()).rejects.toThrow();
  });
});

// ─── Friends ──────────────────────────────────────────────────────────────────
describe("friends", () => {
  it("allUsers requires authentication", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.friends.allUsers()).rejects.toThrow();
  });

  it("allUsers returns empty when no other users", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.friends.allUsers();
    expect(Array.isArray(result)).toBe(true);
  });

  it("follow requires authentication", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.friends.follow({ userId: 2 })).rejects.toThrow();
  });

  it("follow returns success", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.friends.follow({ userId: 2 });
    expect(result).toEqual({ success: true });
  });

  it("follow throws when trying to follow yourself", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    await expect(caller.friends.follow({ userId: 1 })).rejects.toThrow("Cannot follow yourself");
  });

  it("unfollow returns success", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.friends.unfollow({ userId: 2 });
    expect(result).toEqual({ success: true });
  });

  it("following returns an array", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.friends.following();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Playlists ────────────────────────────────────────────────────────────────
describe("playlists", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.playlists.list()).rejects.toThrow();
  });

  it("list returns empty array when no playlists", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.playlists.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.playlists.create({ title: "My Playlist" })).rejects.toThrow();
  });

  it("create returns null (mocked getPlaylistById returns null)", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.playlists.create({ title: "My Playlist" });
    expect(result).toBeNull(); // mock returns null
  });

  it("delete requires authentication", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.playlists.delete({ id: 1 })).rejects.toThrow();
  });

  it("delete returns success", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.playlists.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("getTracks throws FORBIDDEN when playlist not owned by user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    // getPlaylistById returns null in mock → FORBIDDEN
    await expect(caller.playlists.getTracks({ playlistId: 99 })).rejects.toThrow();
  });
});

// ─── Creators (public profiles) ───────────────────────────────────────────────
describe("creators", () => {
  beforeEach(async () => {
    const db = await import("./db");
    vi.mocked(db.isFollowing).mockReset();
    vi.mocked(db.isFollowing).mockResolvedValue(false);
  });
  it("publicProfile throws NOT_FOUND when creator does not exist", async () => {
    const { getUserByDisplayName } = await import("./db");
    vi.mocked(getUserByDisplayName).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.creators.publicProfile({ username: "nobody" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("publicProfile is accessible without authentication", async () => {
    const { getUserByDisplayName, getPublicTracksByUserId, getFollowerCount, getFollowingCount, isFollowing } =
      await import("./db");
    vi.mocked(getUserByDisplayName).mockResolvedValueOnce({
      user: {
        id: 42,
        openId: "creator-42",
        name: "Jam",
        email: "jam@example.com",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      profile: {
        id: 10,
        userId: 42,
        displayName: "Jam",
        bio: "I make beats",
        avatarUrl: null,
        profileComplete: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    vi.mocked(getPublicTracksByUserId).mockResolvedValueOnce([]);
    vi.mocked(getFollowerCount).mockResolvedValueOnce(5);
    vi.mocked(getFollowingCount).mockResolvedValueOnce(3);
    vi.mocked(isFollowing).mockResolvedValueOnce(false);

    const caller = appRouter.createCaller(makeAnonCtx());
    const result = await caller.creators.publicProfile({ username: "Jam" });

    expect(result.displayName).toBe("Jam");
    expect(result.bio).toBe("I make beats");
    expect(result.followerCount).toBe(5);
    expect(result.followingCount).toBe(3);
    expect(result.trackCount).toBe(0);
    expect(result.isOwnProfile).toBe(false);
    expect(result.viewerIsFollowing).toBe(false);
    expect(Array.isArray(result.tracks)).toBe(true);
  });

  it("publicProfile marks isOwnProfile true for the profile owner", async () => {
    const { getUserByDisplayName, getPublicTracksByUserId, getFollowerCount, getFollowingCount, isFollowing } =
      await import("./db");
    vi.mocked(getUserByDisplayName).mockResolvedValueOnce({
      user: {
        id: 1, // same as makeAuthCtx user id
        openId: "user-1",
        name: "Test User",
        email: "test@example.com",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      profile: {
        id: 1,
        userId: 1,
        displayName: "Test User",
        bio: null,
        avatarUrl: null,
        profileComplete: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    vi.mocked(getPublicTracksByUserId).mockResolvedValueOnce([]);
    vi.mocked(getFollowerCount).mockResolvedValueOnce(0);
    vi.mocked(getFollowingCount).mockResolvedValueOnce(0);
    vi.mocked(isFollowing).mockResolvedValueOnce(false);

    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.creators.publicProfile({ username: "Test User" });

    expect(result.isOwnProfile).toBe(true);
  });

  it("publicProfile shows viewerIsFollowing true when authenticated viewer follows creator", async () => {
    const { getUserByDisplayName, getPublicTracksByUserId, getFollowerCount, getFollowingCount, isFollowing } =
      await import("./db");
    vi.mocked(getUserByDisplayName).mockResolvedValueOnce({
      user: {
        id: 99,
        openId: "creator-99",
        name: "Melody",
        email: "melody@example.com",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      profile: {
        id: 20,
        userId: 99,
        displayName: "Melody",
        bio: null,
        avatarUrl: null,
        profileComplete: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    vi.mocked(getPublicTracksByUserId).mockResolvedValueOnce([]);
    vi.mocked(getFollowerCount).mockResolvedValueOnce(12);
    vi.mocked(getFollowingCount).mockResolvedValueOnce(7);
    vi.mocked(isFollowing).mockResolvedValueOnce(true); // viewer is following

    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.creators.publicProfile({ username: "Melody" });

    expect(result.viewerIsFollowing).toBe(true);
    expect(result.followerCount).toBe(12);
  });
});

// ─── Stripe ───────────────────────────────────────────────────────────────────
import { getUserById } from "./db";

// Mock the stripe module so no real API calls are made
vi.mock("stripe", () => {
  const mockCheckoutCreate = vi.fn().mockResolvedValue({
    url: "https://checkout.stripe.com/pay/test_session",
  });
  const mockCustomerCreate = vi.fn().mockResolvedValue({ id: "cus_test123" });

  const mockPortalCreate = vi.fn().mockResolvedValue({
    url: "https://billing.stripe.com/session/test_portal",
  });

  const MockStripe = vi.fn().mockImplementation(() => ({
    checkout: { sessions: { create: mockCheckoutCreate } },
    customers: { create: mockCustomerCreate },
    billingPortal: { sessions: { create: mockPortalCreate } },
  }));

  return { default: MockStripe };
});

describe("stripe", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    vi.mocked(getUserById).mockResolvedValue({
      id: 1,
      openId: "user-1",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role: "user",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      isPremium: false,
      premiumSince: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as any);
  });

  it("status returns isPremium: false for a non-premium user", async () => {
    vi.mocked(getUserById).mockResolvedValueOnce({
      id: 1,
      isPremium: false,
      premiumSince: null,
    } as any);
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.stripe.status();
    expect(result.isPremium).toBe(false);
  });

  it("status returns isPremium: true for a premium user", async () => {
    const since = new Date("2026-01-01");
    vi.mocked(getUserById).mockResolvedValueOnce({
      id: 1,
      isPremium: true,
      premiumSince: since,
    } as any);
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.stripe.status();
    expect(result.isPremium).toBe(true);
    expect(result.premiumSince).toEqual(since);
  });

  it("status throws UNAUTHORIZED for anonymous users", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.stripe.status()).rejects.toThrow();
  });

  it("createCheckoutSession returns a Stripe checkout URL", async () => {
    const caller = appRouter.createCaller(
      makeAuthCtx({ stripeCustomerId: null } as any)
    );
    const result = await caller.stripe.createCheckoutSession();
    expect(result.url).toContain("checkout.stripe.com");
  });

  it("createCheckoutSession throws UNAUTHORIZED for anonymous users", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.stripe.createCheckoutSession()).rejects.toThrow();
  });
});

describe("stripe.createPortalSession", () => {
  it("returns a portal URL for a premium user with a stripeCustomerId", async () => {
    vi.mocked(getUserById).mockResolvedValueOnce({
      id: 1,
      isPremium: true,
      stripeCustomerId: "cus_test123",
    } as any);
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.stripe.createPortalSession();
    expect(result.url).toContain("billing.stripe.com");
  });

  it("throws BAD_REQUEST when user has no stripeCustomerId", async () => {
    vi.mocked(getUserById).mockResolvedValueOnce({
      id: 1,
      isPremium: false,
      stripeCustomerId: null,
    } as any);
    const caller = appRouter.createCaller(makeAuthCtx());
    await expect(caller.stripe.createPortalSession()).rejects.toThrow("No active subscription found.");
  });

  it("throws UNAUTHORIZED for anonymous users", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.stripe.createPortalSession()).rejects.toThrow();
  });
});
