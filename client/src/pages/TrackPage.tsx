import { trpc } from "@/lib/trpc";
import { AddToPlaylistButton } from "@/components/AddToPlaylistButton";
import { CoverArtDimensionsPanel } from "@/components/CoverArtDimensionsPanel";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Music,
  ArrowLeft,
  Share2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Link, useLocation, useParams } from "wouter";
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

export default function TrackPage() {
  const params = useParams<{ id: string }>();
  const trackId = parseInt(params.id ?? "0", 10);
  const { play, currentTrack, isPlaying, pause } = useAudioPlayer();
  const [, setLocation] = useLocation();
  const [shareAnimating, setShareAnimating] = useState(false);

  const { data: track, isLoading } = trpc.tracks.getById.useQuery(
    { id: trackId },
    { enabled: !isNaN(trackId) && trackId > 0, retry: false }
  );

  // Narrow to full track (after access-denied guard below)
  type FullTrack = Extract<typeof track, { accessDenied: false }>;
  const fullTrack = (!track || track.accessDenied) ? null : track as FullTrack;

  const gradient = useMemo(
    () => fullTrack?.gradient ?? CARD_GRADIENTS[trackId % CARD_GRADIENTS.length],
    [fullTrack?.gradient, trackId]
  );

  // Fetch more tracks from this creator (only when we have a creatorUserId)
  const { data: creatorProfile } = trpc.creators.publicProfile.useQuery(
    { userId: fullTrack?.creatorUserId ?? 0 },
    { enabled: !!fullTrack?.creatorUserId }
  );
  const moreTracks = useMemo(() => {
    if (!creatorProfile?.tracks) return [];
    return creatorProfile.tracks.filter((t) => t.id !== trackId).slice(0, 4);
  }, [creatorProfile?.tracks, trackId]);

  const isCurrentlyPlaying = currentTrack?.id === trackId && isPlaying;

  const handlePlay = () => {
    if (!fullTrack) return;
    if (isCurrentlyPlaying) {
      pause();
    } else {
      play({
        id: fullTrack.id,
        title: fullTrack.title,
        artist: fullTrack.artist ?? fullTrack.creatorUsername ?? "Unknown",
        audioUrl: fullTrack.audioUrl,
        gradient,
        coverArtUrl: fullTrack.coverArtUrl,
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    setShareAnimating(true);
    setTimeout(() => setShareAnimating(false), 600);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied — drop it somewhere good 🍓", {
        duration: 3000,
      });
    } catch {
      toast.info(`Share this link: ${url}`);
    }
  };

  const handleExploreVibe = (tag: string) => {
    setLocation(`/discover?vibe=${encodeURIComponent(tag)}`);
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="h-4 w-24 bg-pink-100 rounded animate-pulse" />
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm animate-pulse">
            <div className="aspect-square bg-pink-100" />
            <div className="p-8 space-y-4">
              <div className="h-7 bg-pink-100 rounded w-2/3" />
              <div className="h-4 bg-pink-50 rounded w-1/3" />
              <div className="h-4 bg-pink-50 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!track) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <Music className="w-16 h-16 text-pink-200 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Riff not found</h2>
        <p className="text-muted-foreground mb-6">
          This track may have been removed or set to private.
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

  // ── Access denied ──
  if (track.accessDenied) {
    const isInnerCircle = track.reason === "inner-circle";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">{isInnerCircle ? "🔒" : "🔐"}</div>
        <h2 className="text-2xl font-bold mb-2">
          {isInnerCircle ? "Inner Circle Only" : "Private Track"}
        </h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          {isInnerCircle
            ? "This track is shared with the creator's inner circle. Follow them to listen."
            : "This track is private. Only the creator can listen to it."}
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

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back nav */}
        <Link href="/discover">
          <button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-pink-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Discover
          </button>
        </Link>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/95 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl border border-white/10"
        >
          {/* Cover art / gradient hero */}
          <div
            className={`aspect-square bg-gradient-to-br ${gradient} relative flex items-center justify-center overflow-hidden`}
          >
            {fullTrack?.coverArtUrl && (
              <img src={fullTrack.coverArtUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {isCurrentlyPlaying && (
              <div className="absolute inset-0 ring-8 ring-white/40 pointer-events-none animate-pulse" />
            )}
            {/* Passive playing indicator only — play button moved to info row */}

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

            {/* Duration badge */}
            {fullTrack!.duration && (
              <div className="absolute top-4 right-4 bg-black/30 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                {fmt(fullTrack!.duration)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-8">
            {/* Title row with play button */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Play button — moved from cover art */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={handlePlay}
                  className="w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center text-white shadow-lg transition-all"
                  style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="w-5 h-5 fill-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  )}
                </motion.button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-white leading-tight truncate">
                    {fullTrack!.title}
                  </h1>
                  {fullTrack!.creatorUserId ? (
                    <Link href={`/creator/${fullTrack!.creatorUserId}`}>
                      <p className="text-pink-400 font-medium mt-0.5 hover:text-pink-300 cursor-pointer flex items-center gap-1">
                        {fullTrack!.artist ?? fullTrack!.creatorUsername}
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </p>
                    </Link>
                  ) : (
                    <p className="text-zinc-400 mt-0.5">
                      {fullTrack!.artist ?? "Unknown Artist"}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <AddToPlaylistButton trackId={fullTrack!.id} className="border border-white/20 hover:bg-white/10 text-white rounded-full w-9 h-9" />
                <motion.button
                  onClick={handleShare}
                  animate={shareAnimating ? { scale: [1, 1.3, 0.9, 1.1, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-pink-400 hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </motion.button>
              </div>
            </div>

            {/* Genre */}
            {fullTrack!.genre && (
              <p className="text-sm text-zinc-400 mt-3">
                Genre: <span className="font-medium text-zinc-200">{fullTrack!.genre}</span>
              </p>
            )}

            {/* description field is art direction only — not shown publicly */}

            {/* Mood tags — click to explore vibe in Discover */}
            {fullTrack!.moodTags.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Vibe</p>
                <div className="flex flex-wrap gap-2">
                  {fullTrack!.moodTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleExploreVibe(tag)}
                      title="Explore this vibe in Discover"
                      className="text-sm px-3 py-1 rounded-full bg-white/10 text-pink-300 hover:bg-white/20 hover:text-pink-200 transition-colors font-medium border border-white/10"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Tap a vibe to explore this sound in Discover →
                </p>
              </div>
            )}

            {/* Lyrics */}
            {fullTrack!.lyrics && fullTrack!.showLyricsOnShare && (
              <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs font-semibold text-purple-400 mb-3 uppercase tracking-wider">Lyrics</p>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">
                  {fullTrack!.lyrics}
                </p>
              </div>
            )}

            {/* Cover Art Dimensions */}
            {fullTrack!.coverArtDimensions && (
              <div className="mt-6">
                <CoverArtDimensionsPanel
                  dimensionsJson={fullTrack!.coverArtDimensions}
                />
              </div>
            )}

            {/* Creator card */}
            {fullTrack!.creatorUserId && (
              <Link href={`/creator/${fullTrack!.creatorUserId}`}>
                <motion.div
                  whileHover={{ y: -2 }}
                  className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {fullTrack!.creatorAvatarUrl ? (
                      <img
                        src={fullTrack!.creatorAvatarUrl}
                        alt={fullTrack!.creatorUsername ?? "Creator"}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/20 shadow-sm"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white/20 shadow-sm"
                        style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
                      >
                        {fullTrack!.creatorUsername!.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">
                        {fullTrack!.creatorUsername}
                      </p>
                      {fullTrack!.creatorBio && (
                        <p className="text-xs text-zinc-400 truncate">
                          {fullTrack!.creatorBio}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-pink-400 font-medium flex-shrink-0">
                      View profile →
                    </span>
                  </div>
                </motion.div>
              </Link>
            )}
          </div>
        </motion.div>

        {/* More from this creator */}
        {moreTracks.length > 0 && fullTrack!.creatorUserId && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">
                More from {fullTrack!.creatorUsername}
              </h2>
              <Link href={`/creator/${fullTrack!.creatorUserId}`}>
                <span className="text-xs text-pink-400 hover:underline">
                  Full profile →
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {moreTracks.map((t, i) => {
                const tGradient = t.gradient ?? CARD_GRADIENTS[i % CARD_GRADIENTS.length];
                return (
                  <Link key={t.id} href={`/track/${t.id}`}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="bg-zinc-900/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-white/10"
                    >
                      <div className={`h-20 bg-gradient-to-br ${tGradient} relative`}>
                        {t.coverArtUrl && (
                          <img src={t.coverArtUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            play({
                              id: t.id,
                              title: t.title,
                              artist: fullTrack!.creatorUsername ?? "Unknown",
                              audioUrl: t.audioUrl, audioKey: t.audioKey ?? undefined,
                              gradient: tGradient,
                              coverArtUrl: t.coverArtUrl,
                            });
                          }}
                          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20"
                        >
                          <Play className="w-6 h-6 fill-white text-white" />
                        </button>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-white truncate">{t.title}</p>
                        {t.moodTags && t.moodTags.length > 0 && (
                          <p className="text-xs text-zinc-400 truncate mt-0.5">
                            {t.moodTags.slice(0, 2).join(" · ")}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
