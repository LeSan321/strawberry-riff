import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Play,
  Pause,
  Heart,
  Globe,
  Users,
  Sparkles,
  Loader2,
  Upload,
  Ticket,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import ConcertTicketEasterEgg from "@/components/ConcertTicketEasterEgg";

interface Track {
  id: number;
  title: string;
  artist?: string | null;
  genre?: string | null;
  description?: string | null;
  audioUrl: string;
  duration?: number | null;
  moodTags: string[];
  visibility: string;
  likes: number;
  plays: number;
  gradient?: string | null;
  userId: number;
  createdAt: Date;
}

function formatDuration(s?: number | null) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function TrackCard({ track, showLike = false }: { track: Track; showLike?: boolean }) {
  const { currentTrack, isPlaying, play, pause } = useAudioPlayer();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const isCurrentTrack = currentTrack?.id === track.id;

  const likeMutation = trpc.tracks.like.useMutation({
    onSuccess: () => utils.tracks.publicFeed.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const unlikeMutation = trpc.tracks.unlike.useMutation({
    onSuccess: () => utils.tracks.publicFeed.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const likedIds = trpc.tracks.myLikes.useQuery(undefined, { enabled: isAuthenticated });
  const isLiked = likedIds.data?.includes(track.id) ?? false;

  const handlePlay = () => {
    if (isCurrentTrack && isPlaying) {
      pause();
    } else {
      play({
        id: track.id,
        title: track.title,
        artist: track.artist,
        audioUrl: track.audioUrl,
        gradient: track.gradient,
        moodTags: track.moodTags,
      });
    }
  };

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.info("Sign in to like tracks");
      return;
    }
    if (isLiked) {
      unlikeMutation.mutate({ trackId: track.id });
    } else {
      likeMutation.mutate({ trackId: track.id });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
        <CardContent className="p-0">
          {/* Gradient header */}
          <div
            className={`h-28 bg-gradient-to-br ${track.gradient || "from-pink-400 to-purple-500"} relative cursor-pointer`}
            onClick={handlePlay}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg"
              >
                {isCurrentTrack && isPlaying ? (
                  <Pause className="w-7 h-7 text-white" />
                ) : (
                  <Play className="w-7 h-7 text-white ml-1" />
                )}
              </motion.div>
            </div>
            {isCurrentTrack && isPlaying && (
              <div className="absolute bottom-2 left-3 flex items-end gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-white/80 rounded-full"
                    animate={{ height: [4, 12, 6, 16, 8][i % 5] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: i * 0.1 }}
                  />
                ))}
              </div>
            )}
            {track.duration && (
              <span className="absolute bottom-2 right-3 text-xs text-white/80 font-medium">
                {formatDuration(track.duration)}
              </span>
            )}
          </div>

          {/* Track info */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-800 truncate text-sm">{track.title}</h3>
                {track.artist && (
                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                )}
              </div>
              {showLike && (
                <button
                  onClick={handleLike}
                  className={`flex-shrink-0 transition-colors ${
                    isLiked ? "text-pink-500" : "text-gray-300 hover:text-pink-400"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                </button>
              )}
            </div>

            {track.genre && (
              <p className="text-xs text-muted-foreground mb-2">{track.genre}</p>
            )}

            {track.moodTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {track.moodTags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs bg-purple-50 text-purple-600 border-0 py-0"
                  >
                    {tag}
                  </Badge>
                ))}
                {track.moodTags.length > 3 && (
                  <Badge variant="secondary" className="text-xs bg-gray-50 text-gray-500 border-0 py-0">
                    +{track.moodTags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" /> {track.likes}
              </span>
              <span>{new Date(track.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function HeroSection() {
  const { isAuthenticated } = useAuth();
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 text-white">
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ y: [-10, 10], opacity: [0.3, 0.8] }}
            transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, repeatType: "reverse" }}
          />
        ))}
      </div>
      <div className="container py-16 md:py-24 relative">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-medium text-pink-200">Music sharing, reimagined</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
              Share Your{" "}
              <span className="text-yellow-300">Riffs</span>
              <br />
              Your Way
            </h1>
            <p className="text-lg text-pink-100 mb-8 max-w-xl">
              Upload tracks, control who hears them, and connect with your inner circle. Strawberry Riff
              puts you in charge of your music.
            </p>
            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link href="/upload">
                  <Button
                    size="lg"
                    className="bg-white text-purple-700 hover:bg-pink-50 border-0 font-semibold shadow-lg"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload a Riff
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  className="bg-white text-purple-700 hover:bg-pink-50 border-0 font-semibold shadow-lg"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Get Started Free
                </Button>
              )}
              {/* Easter Egg Ticket */}
              <motion.button
                whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEasterEgg(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-sm font-medium transition-all"
                title="🍓 Something special..."
              >
                <Ticket className="w-4 h-4 text-yellow-300" />
                <span className="text-white/90">Special Event</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
      <ConcertTicketEasterEgg open={showEasterEgg} onClose={() => setShowEasterEgg(false)} />
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const publicFeed = trpc.tracks.publicFeed.useQuery({ limit: 50 });
  const friendFeed = trpc.tracks.friendFeed.useQuery(undefined, { enabled: isAuthenticated });

  const publicTracks = (publicFeed.data ?? []) as Track[];
  const friendTracks = (friendFeed.data ?? []) as Track[];

  return (
    <div>
      <HeroSection />

      <div className="container py-10">
        {isAuthenticated ? (
          <Tabs defaultValue="discover">
            <TabsList className="mb-6">
              <TabsTrigger value="discover" className="gap-2">
                <Globe className="w-4 h-4" /> Discover
              </TabsTrigger>
              <TabsTrigger value="inner-circle" className="gap-2">
                <Users className="w-4 h-4" /> Inner Circle
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discover">
              <FeedGrid tracks={publicTracks} loading={publicFeed.isLoading} showLike />
            </TabsContent>

            <TabsContent value="inner-circle">
              {friendTracks.length === 0 && !friendFeed.isLoading ? (
                <div className="text-center py-16">
                  <Users className="w-12 h-12 text-purple-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No inner circle tracks yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Follow friends to see their inner circle tracks here.
                  </p>
                  <Link href="/friends">
                    <Button variant="outline">Find Friends</Button>
                  </Link>
                </div>
              ) : (
                <FeedGrid tracks={friendTracks} loading={friendFeed.isLoading ?? false} showLike />
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Discover Tracks</h2>
              <Badge variant="secondary" className="text-xs">
                {publicTracks.length} public tracks
              </Badge>
            </div>
            <FeedGrid tracks={publicTracks} loading={publicFeed.isLoading} showLike={false} />
          </>
        )}
      </div>
    </div>
  );
}

function FeedGrid({
  tracks,
  loading,
  showLike,
}: {
  tracks: Track[];
  loading: boolean;
  showLike: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-20">
        <Music className="w-12 h-12 text-purple-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No tracks yet</h3>
        <p className="text-muted-foreground mb-6">
          Be the first to upload a riff and share your music!
        </p>
        <Link href="/upload">
          <Button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0">
            Upload a Riff
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <AnimatePresence>
        {tracks.map((track) => (
          <TrackCard key={track.id} track={track} showLike={showLike} />
        ))}
      </AnimatePresence>
    </div>
  );
}
