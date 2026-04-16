import { trpc } from "@/lib/trpc";
import { AddToPlaylistButton } from "@/components/AddToPlaylistButton";
import { StrawberryBadge } from "@/components/StrawberryBadge";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { Play, Pause, Heart, Music, Search, Shuffle, X, Link as LinkIcon, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const CARD_GRADIENTS = [
  "from-purple-400 via-pink-400 to-pink-500",
  "from-blue-400 via-purple-400 to-purple-500",
  "from-teal-400 via-cyan-400 to-green-400",
  "from-amber-400 via-orange-400 to-pink-400",
  "from-indigo-400 via-violet-400 to-purple-500",
  "from-rose-400 via-pink-400 to-fuchsia-500",
];



interface DiscoverTrack {
  id: number;
  title: string;
  artist?: string | null;
  audioUrl: string;
  duration?: number | null;
  moodTags: string[];
  gradient?: string | null;
  coverArtUrl?: string | null;
  creatorUsername?: string | null;
  creatorIsPremium?: boolean;
}

function TrackCard({ track, index, queue }: {
  track: DiscoverTrack;
  index: number;
  queue: DiscoverTrack[];
}) {
  const { play, currentTrack, isPlaying, pause } = useAudioPlayer();
  const { isAuthenticated } = useAuth();
  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
  const [liked, setLiked] = useState(false);
  const [likeCount] = useState(Math.floor(Math.random() * 200) + 20);
  const [shareAnimating, setShareAnimating] = useState(false);

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
      play(
        { id: track.id, title: track.title, artist: track.artist ?? "Unknown", audioUrl: track.audioUrl, gradient: track.gradient, moodTags: track.moodTags, coverArtUrl: track.coverArtUrl },
        queue.map((t) => ({ id: t.id, title: t.title, artist: t.artist, audioUrl: t.audioUrl, gradient: t.gradient, moodTags: t.moodTags, coverArtUrl: t.coverArtUrl }))
      );
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
      <div className={`h-40 bg-gradient-to-br ${gradient} relative flex items-center justify-center overflow-hidden`}>
        {track.coverArtUrl && (
          <img src={track.coverArtUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
        )}
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
        {track.creatorUsername ? (
          <Link href={`/creator/${encodeURIComponent(track.creatorUsername)}`}>
            <p className="text-sm text-muted-foreground truncate mb-2 hover:text-pink-600 transition-colors cursor-pointer flex items-center gap-1">
              <span className="truncate">{track.artist ?? track.creatorUsername ?? "Unknown Artist"}</span>
              {track.creatorIsPremium && (
                <StrawberryBadge size={14} className="flex-shrink-0" />
              )}
            </p>
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground truncate mb-2">{track.artist ?? "Unknown Artist"}</p>
        )}

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

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Discover() {
  const { isAuthenticated } = useAuth();
  const { play } = useAudioPlayer();
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [shuffled, setShuffled] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  const { data: tracks, isLoading } = trpc.tracks.publicFeed.useQuery({ limit: 100 });
  const { data: presets, refetch: refetchPresets } = trpc.vibePresets.list.useQuery(undefined, { enabled: isAuthenticated });
  const savePresetMutation = trpc.vibePresets.save.useMutation({
    onSuccess: () => { refetchPresets(); setSavePresetOpen(false); setPresetName(""); toast.success("Vibe preset saved!"); },
    onError: () => toast.error("Failed to save preset"),
  });
  const deletePresetMutation = trpc.vibePresets.delete.useMutation({
    onSuccess: () => { refetchPresets(); toast.success("Preset removed"); },
  });

  // Derive all tags actually in use from the fetched tracks
  const availableTags = useMemo(() => {
    if (!tracks) return [];
    const tagSet = new Set<string>();
    tracks.forEach((t) => t.moodTags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [tracks]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleShuffle = useCallback(() => {
    setShuffled(true);
    setShuffleSeed((s) => s + 1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setSelectedTags([]);
    setShuffled(false);
  }, []);

  const loadPreset = useCallback((tags: string[]) => {
    setSelectedTags(tags);
    setSearch("");
    setShuffled(false);
  }, []);

  const filtered = useMemo(() => {
    if (!tracks) return [];
    let result = tracks.filter((t) => {
      const matchSearch = !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.artist ?? "").toLowerCase().includes(search.toLowerCase());
      const matchTags = selectedTags.length === 0 ||
        selectedTags.every((tag) => t.moodTags.includes(tag));
      return matchSearch && matchTags;
    });
    if (shuffled) result = shuffleArray(result);
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, search, selectedTags, shuffled, shuffleSeed]);

  const handlePlayAll = useCallback(() => {
    if (filtered.length === 0) return;
    const queue = filtered.map((t) => ({ id: t.id, title: t.title, artist: t.artist, audioUrl: t.audioUrl, gradient: t.gradient, moodTags: t.moodTags }));
    play(queue[0], queue);
    toast.success(`Playing ${filtered.length} riff${filtered.length > 1 ? "s" : ""}`);
  }, [filtered, play]);

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
          className="bg-white rounded-2xl p-4 shadow-sm mb-8"
        >
          {/* Search row */}
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or artist..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-0 bg-muted/40 rounded-xl focus-visible:ring-pink-300"
              />
            </div>
            {/* Shuffle button */}
            <Button
              variant="outline"
              onClick={handleShuffle}
              className={`rounded-xl gap-2 border-pink-200 flex-shrink-0 ${
                shuffled ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0" : "text-pink-600 hover:bg-pink-50"
              }`}
              title="Shuffle results"
            >
              <Shuffle className="w-4 h-4" />
              <span className="hidden sm:inline">Shuffle</span>
            </Button>
          </div>

          {/* Mood tag cloud */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-muted-foreground mr-1">Vibe:</span>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-pink-50 hover:text-pink-600"
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && isAuthenticated && (
                <button
                  onClick={() => setSavePresetOpen(true)}
                  className="text-xs px-2 py-1.5 rounded-full text-purple-500 hover:text-purple-700 flex items-center gap-0.5 ml-1 border border-purple-200 hover:bg-purple-50"
                  title="Save this vibe as a preset"
                >
                  <Bookmark className="w-3 h-3" /> Save vibe
                </button>
              )}
              {(selectedTags.length > 0 || search) && (
                <button
                  onClick={clearFilters}
                  className="text-xs px-2 py-1.5 rounded-full text-gray-400 hover:text-gray-600 flex items-center gap-0.5 ml-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          )}

          {/* Saved vibe presets */}
          {isAuthenticated && presets && presets.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center mt-2.5 pt-2.5 border-t border-muted/40">
              <span className="text-xs text-muted-foreground mr-1">Saved:</span>
              {presets.map((preset) => (
                <div key={preset.id} className="flex items-center gap-0.5 group">
                  <button
                    onClick={() => loadPreset(preset.tags)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                      JSON.stringify(selectedTags.slice().sort()) === JSON.stringify(preset.tags.slice().sort())
                        ? "bg-purple-100 text-purple-700 border border-purple-300"
                        : "bg-muted/40 text-muted-foreground hover:bg-purple-50 hover:text-purple-600"
                    }`}
                  >
                    <BookmarkCheck className="w-3 h-3 inline mr-1" />
                    {preset.name}
                  </button>
                  <button
                    onClick={() => deletePresetMutation.mutate({ id: preset.id })}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-0.5"
                    title="Delete preset"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
                <Button variant="outline" onClick={clearFilters}
                  className="rounded-full border-pink-300 text-pink-600 hover:bg-pink-50">
                  Clear filters
                </Button>
              </>
            )}
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "riff" : "riffs"}
                {selectedTags.length > 0 && (
                  <span> tagged {selectedTags.map((t) => `"${t}"`).join(" + ")}</span>
                )}
                {shuffled && <span className="ml-1 text-purple-500">· shuffled</span>}
              </p>
              <Button
                onClick={handlePlayAll}
                size="sm"
                className="rounded-full gap-1.5 text-xs"
                style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Play All
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((track, i) => (
                <TrackCard key={track.id} track={track} index={i} queue={filtered} />
              ))}
            </div>
          </>
        )}

        {/* Save Preset Dialog */}
        <Dialog open={savePresetOpen} onOpenChange={setSavePresetOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Save Vibe Preset</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Saving: {selectedTags.map((t) => `"${t}"`).join(" + ")}
            </p>
            <Input
              placeholder="Name this vibe (e.g. Late Night Mood)"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && presetName.trim() && savePresetMutation.mutate({ name: presetName.trim(), tags: selectedTags })}
              className="mt-1"
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setSavePresetOpen(false)}>Cancel</Button>
              <Button
                onClick={() => savePresetMutation.mutate({ name: presetName.trim(), tags: selectedTags })}
                disabled={!presetName.trim() || savePresetMutation.isPending}
                style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
              >
                {savePresetMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
