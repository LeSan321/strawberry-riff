import { trpc } from "@/lib/trpc";
import { AddToPlaylistButton } from "@/components/AddToPlaylistButton";
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
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
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

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="h-4 w-24 bg-pink-100 rounded animate-pulse" />
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm animate-pulse">
            <div className="h-72 bg-pink-100" />
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
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-pink-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Discover
          </button>
        </Link>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl overflow-hidden shadow-sm"
        >
          {/* Cover art / gradient hero */}
          <div
            className={`h-72 bg-gradient-to-br ${gradient} relative flex items-center justify-center overflow-hidden`}
          >
            {fullTrack?.coverArtUrl && (
              <img src={fullTrack.coverArtUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {isCurrentlyPlaying && (
              <div className="absolute inset-0 ring-8 ring-white/40 pointer-events-none animate-pulse" />
            )}
            {/* Play button */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={handlePlay}
              className="w-20 h-20 bg-white/25 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors shadow-xl"
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

            {/* Duration badge */}
            {fullTrack!.duration && (
              <div className="absolute top-4 right-4 bg-black/30 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                {fmt(fullTrack!.duration)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground leading-tight truncate">
                  {fullTrack!.title}
                </h1>
                {fullTrack!.creatorUsername ? (
                  <Link href={`/creator/${encodeURIComponent(fullTrack!.creatorUsername)}`}>
                    <p className="text-pink-600 font-medium mt-1 hover:underline cursor-pointer flex items-center gap-1">
                      {fullTrack!.artist ?? fullTrack!.creatorUsername}
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </p>
                  </Link>
                ) : (
                  <p className="text-muted-foreground mt-1">
                    {fullTrack!.artist ?? "Unknown Artist"}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <AddToPlaylistButton trackId={fullTrack!.id} className="border border-purple-200 hover:bg-purple-50 rounded-full w-9 h-9" />
                <motion.button
                  onClick={handleShare}
                  animate={shareAnimating ? { scale: [1, 1.3, 0.9, 1.1, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-pink-200 text-pink-600 hover:bg-pink-50 transition-colors text-sm font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </motion.button>
              </div>
            </div>

            {/* Genre */}
            {fullTrack!.genre && (
              <p className="text-sm text-muted-foreground mt-3">
                Genre: <span className="font-medium text-foreground">{fullTrack!.genre}</span>
              </p>
            )}

            {/* Description */}
            {fullTrack!.description && (
              <p className="text-muted-foreground mt-3 leading-relaxed text-sm">
                {fullTrack!.description}
              </p>
            )}

            {/* Mood tags */}
            {fullTrack!.moodTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {fullTrack!.moodTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-pink-50 text-pink-600 border-0 px-3 py-1"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Creator card */}
            {fullTrack!.creatorUsername && (
              <Link href={`/creator/${encodeURIComponent(fullTrack!.creatorUsername)}`}>
                <motion.div
                  whileHover={{ y: -2 }}
                  className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {fullTrack!.creatorAvatarUrl ? (
                      <img
                        src={fullTrack!.creatorAvatarUrl}
                        alt={fullTrack!.creatorUsername}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm"
                        style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
                      >
                        {fullTrack!.creatorUsername!.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">
                        {fullTrack!.creatorUsername}
                      </p>
                      {fullTrack!.creatorBio && (
                        <p className="text-xs text-muted-foreground truncate">
                          {fullTrack!.creatorBio}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-pink-600 font-medium flex-shrink-0">
                      View profile →
                    </span>
                  </div>
                </motion.div>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
