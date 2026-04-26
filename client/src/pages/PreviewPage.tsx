import { trpc } from "@/lib/trpc";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { Play, Pause, Music, UserPlus, Lock, Flame, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";

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

export default function PreviewPage() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const { play, currentTrack, isPlaying, pause } = useAudioPlayer();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [hasConsumed, setHasConsumed] = useState(false);
  const [localPlaysRemaining, setLocalPlaysRemaining] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const consumePlayMutation = trpc.previewLinks.consumePlay.useMutation();
  const followMutation = trpc.friends.follow.useMutation();
  const hasConsumedRef = useRef(false);

  const { data, isLoading } = trpc.previewLinks.resolve.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  // When the user presses play, consume a play
  const handlePlay = () => {
    if (!data || !data.valid) return;
    const track = data.track;

    if (isCurrentlyPlaying) {
      pause();
      return;
    }

    // Consume a play on first press (not on pause/resume)
    if (!hasConsumedRef.current) {
      hasConsumedRef.current = true;
      setHasConsumed(true);
      consumePlayMutation.mutateAsync({ token }).then((res) => {
        setLocalPlaysRemaining(res.playsRemaining);
      }).catch(() => {
        // Non-fatal — play still proceeds
      });
    }

    play({
      id: track.id,
      title: track.title,
      artist: track.artist ?? data.creator.username ?? "Unknown",
      audioUrl: track.audioUrl,
      gradient: track.gradient ?? CARD_GRADIENTS[track.id % CARD_GRADIENTS.length],
      coverArtUrl: track.coverArtUrl,
    });
  };

  const isCurrentlyPlaying =
    data?.valid && currentTrack?.id === data.track.id && isPlaying;

  const gradient =
    data?.valid
      ? data.track.gradient ?? CARD_GRADIENTS[data.track.id % CARD_GRADIENTS.length]
      : CARD_GRADIENTS[0];

  // Effective plays remaining: use local state after first consume, otherwise from server
  const playsRemaining =
    localPlaysRemaining !== null
      ? localPlaysRemaining
      : data?.valid
      ? data.link.playsRemaining
      : 0;
  const playsTotal = data?.valid ? data.link.playsTotal : 3;

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
      </div>
    );
  }

  // ── Invalid / exhausted ──
  if (!data || !data.valid) {
    const isExhausted = data && !data.valid && data.reason === "exhausted";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">{isExhausted ? "🎵" : "🔗"}</div>
        <h2 className="text-2xl font-bold mb-2">
          {isExhausted ? "Preview plays used up" : "Link not found"}
        </h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          {isExhausted
            ? "This preview link has been fully used. Follow the creator to hear this track and more."
            : "This preview link is no longer valid or has been revoked."}
        </p>
        <Link href="/discover">
          <Button
            className="rounded-full px-8"
            style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
          >
            Discover Music
          </Button>
        </Link>
      </div>
    );
  }

  const { track, creator } = data;
  const creatorUsername = creator.username ?? "this creator";

  return (
    <div className="min-h-screen py-10 px-4 bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header badge */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 bg-white border border-pink-100 rounded-full px-4 py-1.5 shadow-sm text-sm text-pink-600 font-medium">
            <Flame className="w-3.5 h-3.5" />
            Exclusive Preview — {playsRemaining} of {playsTotal} plays left
          </div>
        </div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl overflow-hidden shadow-md"
        >
          {/* Cover art / gradient hero */}
          <div
            className={`h-64 bg-gradient-to-br ${gradient} relative flex items-center justify-center overflow-hidden`}
          >
            {track.coverArtUrl && (
              <img
                src={track.coverArtUrl}
                alt="cover"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {isCurrentlyPlaying && (
              <div className="absolute inset-0 ring-8 ring-white/40 pointer-events-none animate-pulse" />
            )}

            {/* Play button */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={handlePlay}
              disabled={playsRemaining <= 0 && !hasConsumed}
              className="w-20 h-20 bg-white/25 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCurrentlyPlaying ? (
                <Pause className="w-8 h-8 fill-white" />
              ) : (
                <Play className="w-8 h-8 fill-white ml-1" />
              )}
            </motion.button>

            {/* Animated bars when playing */}
            {isCurrentlyPlaying && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-end gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-white rounded-full"
                    animate={{ height: [4, 20, 4] }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity,
                      delay: i * 0.09,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Duration */}
            {track.duration && (
              <div className="absolute top-4 right-4 bg-black/30 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                {fmt(track.duration)}
              </div>
            )}

            {/* Lock overlay when exhausted */}
            {playsRemaining <= 0 && !isCurrentlyPlaying && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm">
                <Lock className="w-10 h-10 text-white mb-2" />
                <p className="text-white text-sm font-medium">Preview plays used up</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6">
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {track.title}
            </h1>
            {track.artist && (
              <p className="text-muted-foreground mt-1 text-sm">{track.artist}</p>
            )}

            {/* Mood tags */}
            {track.moodTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {track.moodTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-pink-50 text-pink-600 border-0 px-3 py-1 text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Creator CTA card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl p-6 shadow-md border border-pink-100"
        >
          <div className="flex items-center gap-3 mb-4">
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={creatorUsername}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base border-2 border-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
              >
                {creatorUsername.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{creatorUsername}</p>
              {creator.bio && (
                <p className="text-xs text-muted-foreground truncate">{creator.bio}</p>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Like what you hear? Follow <span className="font-medium text-foreground">{creatorUsername}</span> on
            Strawberry Riff to unlock their full Inner Circle — exclusive tracks shared only with followers.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {isAuthenticated ? (
              <Button
                className="flex-1 rounded-full font-semibold"
                style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
                disabled={followMutation.isPending || isFollowing}
                onClick={() => {
                  if (!data?.valid) return;
                  followMutation.mutate(
                    { userId: data.track.userId },
                    {
                      onSuccess: () => {
                        setIsFollowing(true);
                        // Redirect to creator profile with welcome flag
                        navigate(`/creator/${encodeURIComponent(creatorUsername)}?welcome=1`);
                      },
                      onError: (err) => {
                        // If already following, just navigate
                        if (err.message?.includes("already")) {
                          navigate(`/creator/${encodeURIComponent(creatorUsername)}?welcome=1`);
                        } else {
                          toast.error("Could not follow — please try again.");
                        }
                      },
                    }
                  );
                }}
              >
                {followMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Following…</>
                ) : isFollowing ? (
                  <><UserPlus className="w-4 h-4 mr-2" /> Followed!</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" /> Follow {creatorUsername}</>
                )}
              </Button>
            ) : (
              <a
                href={getLoginUrl(`/creator/${encodeURIComponent(creatorUsername)}?welcome=1`)}
                className="flex-1"
              >
                <Button
                  className="w-full rounded-full font-semibold"
                  style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign in to Follow {creatorUsername}
                </Button>
              </a>
            )}
            <Link href="/discover" className="flex-1">
              <Button variant="outline" className="w-full rounded-full border-pink-200 text-pink-600 hover:bg-pink-50">
                <Music className="w-4 h-4 mr-2" />
                Explore Strawberry Riff
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Plays remaining indicator */}
        {playsRemaining > 0 && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                {Array.from({ length: playsTotal }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < playsRemaining ? "bg-pink-400" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span>{playsRemaining} preview {playsRemaining === 1 ? "play" : "plays"} remaining</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
