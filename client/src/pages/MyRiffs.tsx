import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Play,
  Pause,
  Edit2,
  Trash2,
  Globe,
  Lock,
  Users,
  Plus,
  Clock,
  Heart,
  BarChart2,
  Loader2,
  Check,
  X,
  Link as LinkIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "wouter";
import { AddToPlaylistButton } from "@/components/AddToPlaylistButton";

type Visibility = "private" | "inner-circle" | "public";

const VISIBILITY_CONFIG = {
  private: { label: "Private", icon: Lock, color: "bg-gray-100 text-gray-600" },
  "inner-circle": { label: "Inner Circle", icon: Users, color: "bg-blue-100 text-blue-600" },
  public: { label: "Public", icon: Globe, color: "bg-green-100 text-green-600" },
};

function formatDuration(s?: number | null) {
  if (!s) return "--:--";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Track {
  id: number;
  title: string;
  artist?: string | null;
  genre?: string | null;
  description?: string | null;
  audioUrl: string;
  duration?: number | null;
  moodTags: string[];
  visibility: Visibility;
  likes: number;
  plays: number;
  gradient?: string | null;
  coverArtUrl?: string | null;
  createdAt: Date;
}

interface EditDialogProps {
  track: Track;
  onClose: () => void;
}

function EditDialog({ track, onClose }: EditDialogProps) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    title: track.title,
    artist: track.artist ?? "",
    genre: track.genre ?? "",
    description: track.description ?? "",
    visibility: track.visibility,
    moodTags: track.moodTags.join(", "),
  });

  const updateMutation = trpc.tracks.update.useMutation({
    onSuccess: () => {
      utils.tracks.myTracks.invalidate();
      toast.success("Track updated!");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: track.id,
      title: form.title,
      artist: form.artist || undefined,
      genre: form.genre || undefined,
      description: form.description || undefined,
      visibility: form.visibility as Visibility,
      moodTags: form.moodTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit Track</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div>
          <Label>Title</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Artist</Label>
            <Input
              value={form.artist}
              onChange={(e) => setForm((p) => ({ ...p, artist: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Genre</Label>
            <Input
              value={form.genre}
              onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="mt-1 resize-none"
            rows={2}
          />
        </div>
        <div>
          <Label>Mood Tags (comma-separated)</Label>
          <Input
            value={form.moodTags}
            onChange={(e) => setForm((p) => ({ ...p, moodTags: e.target.value }))}
            className="mt-1"
            placeholder="Chill, Dreamy, Lo-fi"
          />
        </div>
        <div>
          <Label>Visibility</Label>
          <Select
            value={form.visibility}
            onValueChange={(v) => setForm((p) => ({ ...p, visibility: v as Visibility }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private — Only me</SelectItem>
              <SelectItem value="inner-circle">Inner Circle — Friends</SelectItem>
              <SelectItem value="public">Public — Everyone</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0"
        >
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function TrackCard({ track }: { track: Track }) {
  const { currentTrack, isPlaying, play, pause } = useAudioPlayer();
  const utils = trpc.useUtils();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareAnimating, setShareAnimating] = useState(false);

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

  const isCurrentTrack = currentTrack?.id === track.id;

  const deleteMutation = trpc.tracks.delete.useMutation({
    onSuccess: () => {
      utils.tracks.myTracks.invalidate();
      toast.success("Track deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.tracks.update.useMutation({
    onSuccess: () => utils.tracks.myTracks.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const visConfig = VISIBILITY_CONFIG[track.visibility];
  const VisIcon = visConfig.icon;

  const cycleVisibility = () => {
    const order: Visibility[] = ["private", "inner-circle", "public"];
    const next = order[(order.indexOf(track.visibility) + 1) % order.length];
    updateMutation.mutate({ id: track.id, visibility: next });
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="flex items-stretch">
              {/* Cover art / color bar + play button */}
              <div
                className={`w-20 flex-shrink-0 bg-gradient-to-b ${track.gradient || "from-pink-400 to-purple-500"} flex items-center justify-center cursor-pointer relative overflow-hidden`}
                onClick={() => {
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
                      coverArtUrl: track.coverArtUrl,
                    });
                  }
                }}
              >
                {track.coverArtUrl && (
                  <img src={track.coverArtUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full bg-white/30 backdrop-blur flex items-center justify-center relative z-10"
                >
                  {isCurrentTrack && isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </motion.div>
              </div>

              {/* Track info */}
              <div className="flex-1 p-4 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{track.title}</h3>
                    {track.artist && (
                      <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {track.visibility === "public" && (
                      <motion.button
                        onClick={handleShare}
                        animate={shareAnimating ? { scale: [1, 1.4, 0.85, 1.1, 1] } : {}}
                        transition={{ duration: 0.4 }}
                        className={`h-8 w-8 p-0 flex items-center justify-center rounded-md transition-colors ${shareAnimating ? "text-pink-500" : "text-gray-400 hover:text-pink-500"}`}
                        title="Copy track link"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </motion.button>
                    )}
                    <AddToPlaylistButton trackId={track.id} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setEditOpen(true)}
                    >
                      <Edit2 className="w-4 h-4 text-gray-400 hover:text-purple-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {/* Visibility badge — clickable to cycle */}
                  <button
                    onClick={cycleVisibility}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${visConfig.color} hover:opacity-80 transition-opacity`}
                    title="Click to change visibility"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <VisIcon className="w-3 h-3" />
                    )}
                    {visConfig.label}
                  </button>

                  {track.genre && (
                    <span className="text-xs text-muted-foreground">{track.genre}</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDuration(track.duration)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="w-3 h-3" />
                    {track.likes}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BarChart2 className="w-3 h-3" />
                    {track.plays}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDate(track.createdAt)}
                  </span>
                </div>

                {track.moodTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {track.moodTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs bg-purple-50 text-purple-600 border-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <EditDialog track={track} onClose={() => setEditOpen(false)} />
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Track?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete <strong>{track.title}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteMutation.mutate({ id: track.id });
                setConfirmDelete(false);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MyRiffs() {
  const { isAuthenticated } = useAuth();
  const tracksQuery = trpc.tracks.myTracks.useQuery(undefined, { enabled: isAuthenticated });
  const tracks = (tracksQuery.data ?? []) as Track[];

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mx-auto mb-6">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Sign in to see your Riffs</h2>
          <p className="text-muted-foreground mb-6">Your uploaded tracks will appear here.</p>
          <Button
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            My Riffs
          </h1>
          <p className="text-muted-foreground mt-1">
            {tracks.length} {tracks.length === 1 ? "track" : "tracks"} uploaded
          </p>
        </div>
        <Link href="/upload">
          <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0">
            <Plus className="w-4 h-4 mr-2" />
            Upload New
          </Button>
        </Link>
      </div>

      {tracksQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : tracks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
            <Music className="w-10 h-10 text-purple-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No riffs yet</h3>
          <p className="text-muted-foreground mb-6">Upload your first track and start sharing your music.</p>
          <Link href="/upload">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0">
              <Plus className="w-4 h-4 mr-2" />
              Upload Your First Riff
            </Button>
          </Link>
        </motion.div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
