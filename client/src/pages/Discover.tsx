import { trpc } from "@/lib/trpc";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { Play, Pause, Heart, Music, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Link } from "wouter";

const CARD_GRADIENTS = [
  "from-purple-400 via-pink-400 to-pink-500",
  "from-blue-400 via-purple-400 to-purple-500",
  "from-teal-400 via-cyan-400 to-green-400",
  "from-amber-400 via-orange-400 to-pink-400",
  "from-indigo-400 via-violet-400 to-purple-500",
  "from-rose-400 via-pink-400 to-fuchsia-500",
];

const ALL_MOODS = [
  "chill", "energetic", "melancholy", "euphoric", "defiant",
  "hopeful", "introspective", "romantic", "experimental", "ambient",
];

function TrackCard({ track, index }: {
  track: {
    id: number;
    title: string;
    artist?: string | null;
    audioUrl: string;
    duration?: number | null;
    moodTags: string[];
    gradient?: string | null;
  };
  index: number;
}) {
  const { play, currentTrack, isPlaying, pause } = useAudioPlayer();
  const { isAuthenticated } = useAuth();
  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
  const [liked, setLiked] = useState(false);
  const [likeCount] = useState(Math.floor(Math.random() * 200) + 20);

  const gradient = track.gradient ?? CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  const fmt = (s?: number | null) => {
    if (!s) return "";
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handlePlay = () => {
    if (isCurrentlyPlaying) {
      pause();
    } else {
      play({ id: track.id, title: track.title, artist: track.artist ?? "Unknown", audioUrl: track.audioUrl });
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
      {/* Gradient art */}
      <div className={`h-40 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlay}
          className="w-14 h-14 bg-white/25 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors shadow-lg"
        >
          {isCurrentlyPlaying ? (
            <Pause className="w-6 h-6 fill-white" />
          ) : (
            <Play className="w-6 h-6 fill-white ml-0.5" />
          )}
        </motion.button>

        {/* Animated bars when playing */}
        {isCurrentlyPlaying && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-white rounded-full"
                animate={{ height: [4, 16, 4] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-semibold text-foreground truncate">{track.title}</p>
        <p className="text-sm text-muted-foreground truncate mb-2">{track.artist ?? "Unknown Artist"}</p>

        {/* Mood tags */}
        {track.moodTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {track.moodTags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 bg-pink-50 text-pink-600 border-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {isAuthenticated ? (
            <button
              onClick={() => setLiked(l => !l)}
              className="flex items-center gap-1 hover:text-pink-500 transition-colors"
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
              <span>{likeCount + (liked ? 1 : 0)}</span>
            </button>
          ) : (
            <a href={getLoginUrl()} className="flex items-center gap-1 hover:text-pink-500 transition-colors">
              <Heart className="w-4 h-4" />
              <span>{likeCount}</span>
            </a>
          )}
          {track.duration && (
            <span className="text-xs">{fmt(track.duration)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Discover() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const { data: tracks, isLoading } = trpc.tracks.publicFeed.useQuery({ limit: 100 });

  const filtered = useMemo(() => {
    if (!tracks) return [];
    return tracks.filter((t) => {
      const matchSearch = !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.artist ?? "").toLowerCase().includes(search.toLowerCase());
      const matchMood = !selectedMood || t.moodTags.includes(selectedMood);
      return matchSearch && matchMood;
    });
  }, [tracks, search, selectedMood]);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3"
            style={{
              background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Discover Riffs
          </h1>
          <p className="text-muted-foreground text-lg">
            Fresh drops from the community — curated by humans, not math.
          </p>
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5 inline-flex items-center gap-3 bg-white rounded-2xl px-6 py-3 shadow-sm border border-pink-100"
            >
              <Music className="w-5 h-5 text-pink-500" />
              <span className="text-sm text-muted-foreground">
                Listening as a guest —{" "}
                <a href={getLoginUrl()} className="text-pink-600 font-semibold hover:underline">
                  Sign in
                </a>{" "}
                to upload your own riffs and connect with creators
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Search + Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-4 shadow-sm mb-8 flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or artist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-0 bg-muted/40 rounded-xl focus-visible:ring-pink-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {ALL_MOODS.slice(0, 6).map((mood) => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    selectedMood === mood
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-pink-50 hover:text-pink-600"
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Track grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-40 bg-pink-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-pink-100 rounded w-3/4" />
                  <div className="h-3 bg-pink-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <Music className="w-16 h-16 text-pink-200 mx-auto mb-4" />
            {tracks?.length === 0 ? (
              <>
                <h3 className="text-xl font-bold mb-2">The stage is warming up</h3>
                <p className="text-muted-foreground mb-6">No public tracks yet — be the first to drop a riff!</p>
                {isAuthenticated ? (
                  <Link href="/upload">
                    <Button className="rounded-full px-8"
                      style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}>
                      Upload First Riff
                    </Button>
                  </Link>
                ) : (
                  <a href={getLoginUrl()}>
                    <Button className="rounded-full px-8"
                      style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}>
                      Join & Upload
                    </Button>
                  </a>
                )}
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-2">No matches found</h3>
                <p className="text-muted-foreground mb-4">Try a different search or mood filter</p>
                <Button variant="outline" onClick={() => { setSearch(""); setSelectedMood(null); }}
                  className="rounded-full border-pink-300 text-pink-600 hover:bg-pink-50">
                  Clear filters
                </Button>
              </>
            )}
          </motion.div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filtered.length} {filtered.length === 1 ? "riff" : "riffs"} {selectedMood ? `tagged "${selectedMood}"` : "in the community"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((track, i) => (
                <TrackCard key={track.id} track={track} index={i} />
              ))}
            </div>
          </>
        )}

        {/* CTA for guests */}
        {!isAuthenticated && tracks && tracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center rounded-3xl py-14 px-6 text-white"
            style={{ background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)" }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Your riff belongs here too</h2>
            <p className="text-white/85 mb-7 max-w-md mx-auto">
              Join the community. Upload your tracks, connect with creators, and claim your sonic space.
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg" className="rounded-full px-10 bg-white text-pink-600 hover:bg-white/90 font-semibold">
                Start for Free
              </Button>
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}
