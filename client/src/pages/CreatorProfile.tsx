import { trpc } from "@/lib/trpc";
import { AddToPlaylistButton } from "@/components/AddToPlaylistButton";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Heart,
  Music,
  Users,
  UserPlus,
  UserCheck,
  ArrowLeft,
  Share2,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { StrawberryBadge } from "@/components/StrawberryBadge";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CARD_GRADIENTS = [
  "from-purple-400 via-pink-400 to-pink-500",
  "from-blue-400 via-purple-400 to-purple-500",
  "from-teal-400 via-cyan-400 to-green-400",
  "from-amber-400 via-orange-400 to-pink-400",
  "from-indigo-400 via-violet-400 to-purple-500",
  "from-rose-400 via-pink-400 to-fuchsia-500",
];

function fmt(s?: number | null) {
  if (!s) return "";
  const m = Math.floor(s / 60),
    sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Track card ───────────────────────────────────────────────────────────────
function TrackCard({
  track,
  index,
}: {
  track: {
    id: number;
    title: string;
    artist?: string | null;
    audioUrl: string;
    duration?: number | null;
    moodTags: string[];
    gradient?: string | null;
    coverArtUrl?: string | null;
    likes: number;
  };
  index: number;
}) {
  const { play, currentTrack, isPlaying, pause } = useAudioPlayer();
  const { isAuthenticated } = useAuth();
  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
  const [liked, setLiked] = useState(false);
  const [shareAnimating, setShareAnimating] = useState(false);

  const gradient =
    track.gradient ?? CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  const handlePlay = () => {
    if (isCurrentlyPlaying) {
      pause();
    } else {
      play({
        id: track.id,
        title: track.title,
        artist: track.artist ?? "Unknown",
        audioUrl: track.audioUrl,
        gradient,
        coverArtUrl: track.coverArtUrl,
      });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/track/${track.id}`;
    setShareAnimating(true);
    setTimeout(() => setShareAnimating(false), 600);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied — drop it somewhere good 🍓", { duration: 2500 });
    } catch {
      toast.info(`Share: ${url}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 6) * 0.07 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
    >
      {/* Cover art / gradient */}
      <div
        className={`h-36 bg-gradient-to-br ${gradient} relative flex items-center justify-center overflow-hidden`}
      >
        {track.coverArtUrl && (
          <img src={track.coverArtUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {isCurrentlyPlaying && (
          <div className="absolute inset-0 ring-4 ring-white/60 rounded-none pointer-events-none animate-pulse" />
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlay}
          className="w-12 h-12 bg-white/25 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors shadow-lg"
        >
          {isCurrentlyPlaying ? (
            <Pause className="w-5 h-5 fill-white" />
          ) : (
            <Play className="w-5 h-5 fill-white ml-0.5" />
          )}
        </motion.button>

        {isCurrentlyPlaying && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-white rounded-full"
                animate={{ height: [4, 14, 4] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-semibold text-foreground truncate">{track.title}</p>
        {track.moodTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 mb-3">
            {track.moodTags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs px-2 py-0.5 bg-pink-50 text-pink-600 border-0"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {isAuthenticated ? (
            <button
              onClick={() => setLiked((l) => !l)}
              className="flex items-center gap-1 hover:text-pink-500 transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`}
              />
              <span>{track.likes + (liked ? 1 : 0)}</span>
            </button>
          ) : (
            <a
              href={getLoginUrl()}
              className="flex items-center gap-1 hover:text-pink-500 transition-colors"
            >
              <Heart className="w-4 h-4" />
              <span>{track.likes}</span>
            </a>
          )}
          <div className="flex items-center gap-1">
            {track.duration && (
              <span className="text-xs text-muted-foreground">{fmt(track.duration)}</span>
            )}
            <AddToPlaylistButton trackId={track.id} />
            <motion.button
              onClick={handleShare}
              animate={shareAnimating ? { scale: [1, 1.4, 0.85, 1.1, 1] } : {}}
              transition={{ duration: 0.4 }}
              className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors ${shareAnimating ? "text-pink-500" : "text-gray-400 hover:text-pink-500"}`}
              title="Copy track link"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({
  url,
  name,
  size = "lg",
}: {
  url?: string | null;
  name: string;
  size?: "lg" | "xl";
}) {
  const dim = size === "xl" ? "w-28 h-28 text-4xl" : "w-20 h-20 text-2xl";
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${dim} rounded-full object-cover border-4 border-white shadow-lg`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center border-4 border-white shadow-lg font-bold text-white`}
      style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center px-5">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CreatorProfile() {
  const params = useParams<{ username: string }>();
  const username = params.username ?? "";
  const { user, isAuthenticated } = useAuth();

  // Show welcome toast when arriving from a preview link follow
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("welcome") === "1") {
      // Small delay so the page has a moment to render first
      const timer = setTimeout(() => {
        toast.success(
          <div className="flex items-start gap-2">
            <span className="text-lg">🍓</span>
            <div>
              <p className="font-semibold text-sm">You're now following {username}!</p>
              <p className="text-xs text-muted-foreground mt-0.5">Their Inner Circle tracks will appear in your Friends feed.</p>
            </div>
          </div>,
          { duration: 5000 }
        );
        // Clean the query param from the URL without a page reload
        const url = new URL(window.location.href);
        url.searchParams.delete("welcome");
        window.history.replaceState({}, "", url.toString());
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [username]);

  const {
    data: creator,
    isLoading,
    error,
  } = trpc.creators.publicProfile.useQuery(
    { username },
    { enabled: username.length > 0, retry: false }
  );

  const utils = trpc.useUtils();
  const followMutation = trpc.friends.follow.useMutation({
    onSuccess: () => utils.creators.publicProfile.invalidate({ username }),
  });
  const unfollowMutation = trpc.friends.unfollow.useMutation({
    onSuccess: () => utils.creators.publicProfile.invalidate({ username }),
  });

  const handleFollowToggle = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!creator) return;
    if (creator.viewerIsFollowing) {
      unfollowMutation.mutate({ userId: creator.userId });
    } else {
      followMutation.mutate({ userId: creator.userId });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied to clipboard!");
    } catch {
      toast.info(`Share this link: ${url}`);
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-sm animate-pulse">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-28 h-28 rounded-full bg-pink-100" />
              <div className="flex-1 space-y-3">
                <div className="h-7 bg-pink-100 rounded w-48" />
                <div className="h-4 bg-pink-50 rounded w-72" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-pink-50 h-48 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (error || !creator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <Music className="w-16 h-16 text-pink-200 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Creator not found</h2>
        <p className="text-muted-foreground mb-6">
          No creator with the username <strong>@{username}</strong> exists yet.
        </p>
        <Link href="/discover">
          <Button
            className="rounded-full px-8"
            style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
          >
            Browse Discover
          </Button>
        </Link>
      </div>
    );
  }

  const isFollowPending =
    followMutation.isPending || unfollowMutation.isPending;

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Back nav */}
        <Link href="/discover">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-pink-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Discover
          </button>
        </Link>

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm overflow-hidden"
        >
          {/* Banner */}
          <div
            className="h-32 w-full"
            style={{
              background: "linear-gradient(135deg, #fce7f3 0%, #ede9fe 50%, #dbeafe 100%)",
            }}
          />

          {/* Profile info */}
          <div className="px-6 pb-6 -mt-14">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <Avatar url={creator.avatarUrl} name={creator.displayName} size="xl" />

              {/* Action buttons */}
              <div className="flex items-center gap-2 sm:mb-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="rounded-full border-pink-200 text-pink-600 hover:bg-pink-50 gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </Button>

                {!creator.isOwnProfile && (
                  <Button
                    size="sm"
                    onClick={handleFollowToggle}
                    disabled={isFollowPending}
                    className="rounded-full gap-1.5 min-w-[110px]"
                    style={
                      creator.viewerIsFollowing
                        ? undefined
                        : {
                            background:
                              "linear-gradient(135deg, #ec4899, #a855f7)",
                          }
                    }
                    variant={creator.viewerIsFollowing ? "outline" : "default"}
                  >
                    <AnimatePresence mode="wait">
                      {creator.viewerIsFollowing ? (
                        <motion.span
                          key="following"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Following
                        </motion.span>
                      ) : (
                        <motion.span
                          key="follow"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Follow
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                )}

                {creator.isOwnProfile && (
                  <Link href="/profile-setup">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-pink-200 text-pink-600 hover:bg-pink-50"
                    >
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Name + bio */}
            <div className="mt-4">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                {creator.displayName}
                {creator.isPremium && (
                  <StrawberryBadge size={20} />
                )}
              </h1>
              {creator.bio && (
                <p className="text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
                  {creator.bio}
                </p>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-0 mt-5 border-t border-border pt-5 divide-x divide-border">
              <StatPill value={creator.trackCount} label="Riffs" />
              <StatPill value={creator.followerCount} label="Followers" />
              <StatPill value={creator.followingCount} label="Following" />
            </div>
          </div>
        </motion.div>

        {/* Tracks section */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Music className="w-5 h-5 text-pink-500" />
            <h2 className="text-xl font-bold">
              Public Riffs
              {creator.trackCount > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({creator.trackCount})
                </span>
              )}
            </h2>
          </div>

          {creator.tracks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-3xl"
            >
              <Music className="w-14 h-14 text-pink-100 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-1">No public riffs yet</h3>
              <p className="text-muted-foreground text-sm">
                {creator.isOwnProfile
                  ? "Upload your first riff and set it to public to share it here."
                  : `${creator.displayName} hasn't shared any public riffs yet.`}
              </p>
              {creator.isOwnProfile && (
                <Link href="/upload">
                  <Button
                    className="mt-5 rounded-full px-8"
                    style={{
                      background: "linear-gradient(135deg, #ec4899, #a855f7)",
                    }}
                  >
                    Upload a Riff
                  </Button>
                </Link>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {creator.tracks.map((track, i) => (
                <TrackCard key={track.id} track={track} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Guest CTA */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl py-12 px-6 text-white text-center"
            style={{ background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)" }}
          >
            <Users className="w-10 h-10 mx-auto mb-3 text-white/80" />
            <h2 className="text-xl font-bold mb-2">
              Join Strawberry Riff
            </h2>
            <p className="text-white/85 mb-6 max-w-sm mx-auto text-sm">
              Follow {creator.displayName}, upload your own riffs, and find your
              inner circle.
            </p>
            <a href={getLoginUrl()}>
              <Button
                size="lg"
                className="rounded-full px-10 bg-white text-pink-600 hover:bg-white/90 font-semibold"
              >
                Start for Free
              </Button>
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}
