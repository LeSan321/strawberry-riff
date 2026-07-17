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
  ImagePlus,
  Flame,
  Pencil,
  ChevronDown,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Download,
  Film,
} from "lucide-react";
import { useState, useRef } from "react";
import { MOOD_CATEGORIES } from "../../../shared/moodTags";
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
  lyrics?: string | null;
  audioUrl: string;
  audioKey?: string | null;
  duration?: number | null;
  moodTags: string[];
  visibility: Visibility;
  likes: number;
  plays: number;
  gradient?: string | null;
  coverArtUrl?: string | null;
  showLyricsOnShare?: boolean;
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
    lyrics: track.lyrics ?? "",
    visibility: track.visibility,
    moodTags: track.moodTags,
    coverArtUrl: track.coverArtUrl ?? "",
    showLyricsOnShare: track.showLyricsOnShare ?? true,
  });

  const toggleEditMood = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      moodTags: prev.moodTags.includes(tag)
        ? prev.moodTags.filter((t) => t !== tag)
        : prev.moodTags.length < 8 ? [...prev.moodTags, tag] : prev.moodTags,
    }));
  };
  const [coverPreview, setCoverPreview] = useState<string | null>(track.coverArtUrl ?? null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = trpc.tracks.update.useMutation({
    onSuccess: () => {
      utils.tracks.myTracks.invalidate();
      utils.tracks.publicFeed.invalidate();
      toast.success("Track updated!");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  const uploadCoverArt = trpc.tracks.uploadCoverArt.useMutation();
  const generateCoverArt = trpc.frequency.generateCoverArt.useMutation();
  // Note: userFrequency query is not used here, but generateCoverArt will use it if available on the server side

  const handleCoverArtChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    setUploadingCover(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const result = await uploadCoverArt.mutateAsync({ base64, mimeType: f.type, context: "track" });
        setCoverPreview(result.url);
        setForm((p) => ({ ...p, coverArtUrl: result.url }));
        setUploadingCover(false);
      };
      reader.readAsDataURL(f);
    } catch {
      toast.error("Failed to upload cover art");
      setUploadingCover(false);
    }
  };

  const handleGenerateCoverArt = async () => {
    setGeneratingCover(true);
    try {
      const result = await generateCoverArt.mutateAsync({
        trackId: track.id,
        genre: form.genre || "ambient",
        steeringNote: form.description?.trim() || undefined,
        lyrics: track.lyrics || form.lyrics || undefined,
        songTitle: form.title?.trim() || track.title || undefined,
      });
      if (result.coverArtUrl) {
        setCoverPreview(result.coverArtUrl);
        setForm((p) => ({ ...p, coverArtUrl: result.coverArtUrl }));
        toast.success("Cover art generated!");
      } else {
        toast.error("Cover art generation failed");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate cover art");
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: track.id,
      title: form.title,
      artist: form.artist || undefined,
      genre: form.genre || undefined,
      description: form.description || undefined,
      lyrics: form.lyrics || undefined,
      visibility: form.visibility as Visibility,
      moodTags: form.moodTags,
      coverArtUrl: form.coverArtUrl || undefined,
      showLyricsOnShare: form.showLyricsOnShare,
    });
  };

  return (
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Edit Track</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
        {/* Cover art */}
        <div>
          <Label>Cover Art</Label>
          <div className="flex items-center gap-3 mt-1">
            <div
              className={`w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br ${track.gradient || "from-pink-400 to-purple-500"} flex items-center justify-center flex-shrink-0 cursor-pointer relative group`}
              onClick={() => coverInputRef.current?.click()}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <Music className="w-6 h-6 text-white" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingCover ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <ImagePlus className="w-4 h-4 text-white" />}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="text-xs text-muted-foreground">
                <p>Click to {coverPreview ? "replace" : "upload"} cover art</p>
                <p className="mt-0.5">JPG, PNG, or WebP</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover || generatingCover}
                  className="text-xs"
                >
                  {uploadingCover ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ImagePlus className="w-3 h-3 mr-1" />}
                  Upload
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCoverArt}
                  disabled={uploadingCover || generatingCover}
                  className="text-xs"
                >
                  {generatingCover ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                  Generate
                </Button>
              </div>
              {coverPreview && (
                <button
                  className="text-red-400 hover:text-red-600 text-xs mt-1"
                  onClick={() => { setCoverPreview(null); setForm((p) => ({ ...p, coverArtUrl: "" })); }}
                >
                  Remove
                </button>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverArtChange} />
          </div>
        </div>
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
          <div className="flex items-center justify-between">
            <Label>Art Direction</Label>
            <span className={`text-xs ${
              (form.description?.length ?? 0) > 280 ? "text-red-500" : "text-muted-foreground"
            }`}>{form.description?.length ?? 0} / 300</span>
          </div>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value.slice(0, 300) }))}
            className="mt-1 resize-none"
            rows={2}
            placeholder="Describe the visual mood, color palette, or imagery you want for the cover art. This steers the AI generator — it won't appear on your track card."
          />
          <p className="text-xs text-muted-foreground mt-1">
            Guides cover art generation. Not shown publicly.
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>Tag the Vibe</Label>
            <span className="text-xs text-muted-foreground">{form.moodTags.length}/8</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {MOOD_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <p className="text-xs font-semibold text-muted-foreground mb-1">{cat.emoji} {cat.label}</p>
                <div className="flex flex-wrap gap-1">
                  {cat.tags.map((tag) => {
                    const selected = form.moodTags.includes(tag);
                    const atLimit = form.moodTags.length >= 8 && !selected;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleEditMood(tag)}
                        disabled={atLimit}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all border ${
                          selected
                            ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent"
                            : atLimit
                            ? "bg-card text-muted-foreground/40 border-border/40 cursor-not-allowed"
                            : "bg-card text-muted-foreground border-border hover:border-purple-400"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
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
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
          <input
            type="checkbox"
            id="showLyricsOnShare"
            checked={form.showLyricsOnShare}
            onChange={(e) => setForm((p) => ({ ...p, showLyricsOnShare: e.target.checked }))}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <label htmlFor="showLyricsOnShare" className="flex-1 cursor-pointer text-sm">
            <span className="font-medium">Show lyrics publicly</span>
            <p className="text-xs text-muted-foreground mt-0.5">Allow others to see lyrics when sharing this track</p>
          </label>
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

interface TrackCardProps {
  track: Track;
  queue?: Track[];  // full ordered list for auto-advance
  previewLinkStatus?: { playsRemaining: number; playsTotal: number; token: string };
  bulkMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
  isPlatinum?: boolean;
}

function TrackCard({ track, queue, previewLinkStatus, bulkMode, selected, onToggleSelect, isPlatinum }: TrackCardProps) {
  const utils = trpc.useUtils();
  const { currentTrack, isPlaying, play, pause } = useAudioPlayer();
  const isCurrentTrack = currentTrack?.id === track.id;
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareAnimating, setShareAnimating] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(track.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const visConfig = VISIBILITY_CONFIG[track.visibility];
  const VisIcon = visConfig.icon;

  const updateMutation = trpc.tracks.update.useMutation({
    onSuccess: () => {
      utils.tracks.myTracks.invalidate();
      utils.tracks.publicFeed.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.tracks.delete.useMutation({
    onSuccess: () => {
      utils.tracks.myTracks.invalidate();
      toast.success("Track deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const cycleVisibility = () => {
    const order: Visibility[] = ["private", "inner-circle", "public"];
    const next = order[(order.indexOf(track.visibility) + 1) % order.length];
    updateMutation.mutate({ id: track.id, visibility: next });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/track/${track.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareAnimating(true);
      toast.success("Link copied!");
      setTimeout(() => setShareAnimating(false), 600);
    });
  };

  const handleTitleSave = () => {
    if (titleDraft.trim() && titleDraft !== track.title) {
      updateMutation.mutate({ id: track.id, title: titleDraft.trim() });
    }
    setEditingTitle(false);
  };

  const handlePlay = () => {
    if (isCurrentTrack && isPlaying) {
      pause();
    } else {
      const playerTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist ?? undefined,
        audioUrl: track.audioUrl,
        audioKey: track.audioKey ?? undefined,
        gradient: track.gradient ?? undefined,
        coverArtUrl: track.coverArtUrl ?? undefined,
      };
      const playerQueue = queue?.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist ?? undefined,
        audioUrl: t.audioUrl,
        audioKey: t.audioKey ?? undefined,
        gradient: t.gradient ?? undefined,
        coverArtUrl: t.coverArtUrl ?? undefined,
      }));
      play(playerTrack, playerQueue);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={`transition-all duration-200 ${
            bulkMode
              ? selected
                ? "ring-2 ring-purple-500 bg-purple-50/30"
                : "hover:ring-1 hover:ring-purple-300"
              : ""
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {/* Bulk select checkbox */}
              {bulkMode && (
                <button
                  onClick={() => onToggleSelect?.(track.id)}
                  className="flex-shrink-0 text-purple-500 hover:text-purple-700 transition-colors"
                >
                  {selected ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              )}

              {/* Cover art thumbnail — no button overlay; play is in the actions row */}
              <div
                className={`w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br ${track.gradient || "from-pink-400 to-purple-500"} flex items-center justify-center flex-shrink-0 relative ${
                  bulkMode ? "cursor-pointer" : ""
                }`}
                onClick={bulkMode ? () => onToggleSelect?.(track.id) : undefined}
              >
                {track.coverArtUrl ? (
                  <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-contain" />
                ) : (
                  <Music className="w-5 h-5 text-white" />
                )}
                {isCurrentTrack && isPlaying && (
                  <div className="absolute inset-0 ring-2 ring-pink-400/60 rounded-xl pointer-events-none animate-pulse" />
                )}
              </div>

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {editingTitle ? (
                    <input
                      ref={titleInputRef}
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={handleTitleSave}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleTitleSave();
                        if (e.key === "Escape") { setTitleDraft(track.title); setEditingTitle(false); }
                      }}
                      className="text-sm font-semibold bg-transparent border-b border-purple-400 outline-none flex-1 min-w-0"
                      autoFocus
                    />
                  ) : (
                    <Link href={`/track/${track.id}`}>
                      <span className="text-sm font-semibold hover:text-purple-600 transition-colors truncate block">
                        {track.title}
                      </span>
                    </Link>
                  )}
                  {!bulkMode && (
                    <button
                      onClick={() => { setEditingTitle(true); setTimeout(() => titleInputRef.current?.focus(), 0); }}
                      className="text-muted-foreground hover:text-purple-500 transition-colors flex-shrink-0"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {track.artist && (
                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                )}
              </div>

              {/* Preview link badge */}
              {!bulkMode && previewLinkStatus && (
                <div className="flex-shrink-0">
                  <Link href={`/preview/${previewLinkStatus.token}`}>
                    <Badge
                      variant="outline"
                      className="text-xs border-amber-300 text-amber-600 bg-amber-50 hover:bg-amber-100 cursor-pointer"
                      title={`Preview link active — ${previewLinkStatus.playsRemaining}/${previewLinkStatus.playsTotal} plays remaining`}
                    >
                      {previewLinkStatus.playsRemaining}/{previewLinkStatus.playsTotal} plays
                    </Badge>
                  </Link>
                </div>
              )}

              {/* Actions */}
              {!bulkMode && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {isCurrentTrack && isPlaying ? (
                    <motion.button
                      onClick={pause}
                      className="h-8 w-8 p-0 flex items-center justify-center rounded-md text-purple-500 hover:bg-purple-50 transition-colors"
                    >
                      <Pause className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={handlePlay}
                      className="h-8 w-8 p-0 flex items-center justify-center rounded-md text-gray-400 hover:text-purple-500 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                    </motion.button>
                  )}
                  <motion.button
                    onClick={handleShare}
                    animate={shareAnimating ? { scale: [1, 1.4, 0.85, 1.1, 1] } : {}}
                    transition={{ duration: 0.4 }}
                    className={`h-8 w-8 p-0 flex items-center justify-center rounded-md transition-colors ${shareAnimating ? "text-pink-500" : "text-gray-400 hover:text-pink-500"}`}
                    title={track.visibility === "public" ? "Copy track link" : track.visibility === "inner-circle" ? "Copy link — Inner Circle only" : "Copy link — Private (only you can view)"}
                  >
                    <LinkIcon className="w-4 h-4" />
                  </motion.button>
                  <AddToPlaylistButton trackId={track.id} />
                  <motion.button
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = track.audioUrl;
                      a.download = `${track.title || "riff"}.mp3`;
                      a.target = "_blank";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      toast.success("Downloading track\u2026");
                    }}
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-md text-gray-400 hover:text-green-500 transition-colors"
                    title="Download MP3"
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>
                  {isPlatinum ? (
                    <motion.a
                      href={`https://www.strawberryriff.studio/music-videos?trackId=${track.id}&source=riff`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 w-8 p-0 flex items-center justify-center rounded-md text-gray-400 hover:text-fuchsia-400 transition-colors"
                      title="Create Music Video"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Film className="w-4 h-4" />
                    </motion.a>
                  ) : (
                    <motion.button
                      className="h-8 w-8 p-0 flex items-center justify-center rounded-md text-gray-600 cursor-not-allowed"
                      title="Upgrade to Platinum to create music videos"
                      disabled
                    >
                      <Film className="w-4 h-4" />
                    </motion.button>
                  )}
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
              )}
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {/* Visibility badge — clickable to cycle */}
              <button
                onClick={bulkMode ? undefined : cycleVisibility}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${visConfig.color} ${!bulkMode ? "hover:opacity-80 transition-opacity" : ""}`}
                title={bulkMode ? undefined : "Click to change visibility"}
                disabled={bulkMode}
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

            {/* description is art direction only — not shown on cards */}
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

function CreativeIdentityPanel({ tracks }: { tracks: Track[] }) {
  const allTags = tracks.flatMap((t) => t.moodTags);
  if (allTags.length === 0) return null;

  // Count frequency of each tag
  const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const topTags = sorted.slice(0, 10);
  const maxCount = topTags[0]?.[1] ?? 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      id="creative-identity"
      className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 border border-pink-100"
    >
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-pink-500" />
        <h3 className="text-lg font-bold text-gray-800">Your Creative Identity</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Based on your vibe tags, here's what defines your sound:
      </p>
      <div className="space-y-2">
        {topTags.map(([tag, count]) => (
          <div key={tag} className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 w-32 truncate">{tag}</span>
            <div className="flex-1 bg-pink-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full transition-all"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-12 text-right flex-shrink-0">
              {count} {count === 1 ? "track" : "tracks"}
            </span>
          </div>
        ))}
      </div>
      {sorted.length > 10 && (
        <p className="text-xs text-muted-foreground mt-4">
          +{sorted.length - 10} more vibes in your catalog
        </p>
      )}
    </motion.div>
  );
}

const VISIBILITY_FILTERS: { value: "all" | Visibility; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: Music },
  { value: "public", label: "Public", icon: Globe },
  { value: "inner-circle", label: "Inner Circle", icon: Users },
  { value: "private", label: "Private", icon: Lock },
];

export default function MyRiffs() {
  const { isAuthenticated, user } = useAuth();
  const isPlatinum = (user as { isPlatinum?: boolean } | null)?.isPlatinum ?? false;
  const utils = trpc.useUtils();
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | Visibility>("all");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const tracksQuery = trpc.tracks.myTracks.useQuery(undefined, { enabled: isAuthenticated });
  const tracks = (tracksQuery.data ?? []) as Track[];

  const bulkUpdateMutation = trpc.tracks.bulkUpdateVisibility.useMutation({
    onSuccess: (data) => {
      utils.tracks.myTracks.invalidate();
      utils.tracks.publicFeed.invalidate();
      toast.success(`Updated ${data.updated} track${data.updated !== 1 ? "s" : ""}`);
      setSelectedIds(new Set());
      setBulkMode(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const filteredTracks = tracks.filter((t) => {
    const matchesVisibility = visibilityFilter === "all" || t.visibility === visibilityFilter;
    if (!matchesVisibility) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.artist ?? "").toLowerCase().includes(q) ||
      (t.genre ?? "").toLowerCase().includes(q) ||
      t.moodTags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedIds(new Set(filteredTracks.map((t) => t.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const previewLinksQuery = trpc.previewLinks.myActiveLinks.useQuery(undefined, { enabled: isAuthenticated });
  // Build a map of trackId → most recent active link (for badge display)
  const previewLinkByTrack = (previewLinksQuery.data ?? []).reduce<Record<number, { playsRemaining: number; playsTotal: number; token: string }>>((acc, link) => {
    // Keep the most recently created link per track (array is ordered by createdAt desc)
    if (!acc[link.trackId]) {
      acc[link.trackId] = { playsRemaining: link.playsRemaining, playsTotal: link.playsTotal, token: link.token };
    }
    return acc;
  }, {});

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
      <div className="flex flex-col gap-4 mb-8">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              My Riffs
            </h1>
            <p className="text-muted-foreground mt-1">
              {searchQuery.trim() || visibilityFilter !== "all"
                ? `${filteredTracks.length} of ${tracks.length} ${tracks.length === 1 ? "track" : "tracks"}`
                : `${tracks.length} ${tracks.length === 1 ? "track" : "tracks"} uploaded`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => document.getElementById("creative-identity")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 font-medium px-3 py-1.5 rounded-full border border-purple-200 hover:bg-purple-50 transition-colors"
              title="Jump to Your Creative Identity"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My Vibe</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <Link href="/upload">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0">
                <Plus className="w-4 h-4 mr-2" />
                Upload New
              </Button>
            </Link>
          </div>
        </div>

        {/* Search bar */}
        {tracks.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, artist, genre, or vibe tag…"
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Visibility filter tabs */}
        {tracks.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {VISIBILITY_FILTERS.map(({ value, label, icon: Icon }) => {
              const count = value === "all" ? tracks.length : tracks.filter((t) => t.visibility === value).length;
              const isActive = visibilityFilter === value;
              return (
                <button
                  key={value}
                  onClick={() => setVisibilityFilter(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    isActive
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:border-purple-300 hover:text-purple-600"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-muted"}`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Bulk edit toggle */}
            <button
              onClick={() => {
                setBulkMode((v) => !v);
                clearSelection();
              }}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                bulkMode
                  ? "bg-purple-100 text-purple-700 border-purple-300"
                  : "bg-card text-muted-foreground border-border hover:border-purple-300 hover:text-purple-600"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {bulkMode ? "Cancel" : "Select"}
            </button>
          </div>
        )}

        {/* Bulk action bar */}
        {bulkMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-200"
          >
            <span className="text-sm font-medium text-purple-700">
              {selectedIds.size} selected
            </span>
            <button
              onClick={selectedIds.size === filteredTracks.length ? clearSelection : selectAll}
              className="text-xs text-purple-600 hover:text-purple-800 underline"
            >
              {selectedIds.size === filteredTracks.length ? "Deselect all" : "Select all"}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Change visibility to:</span>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.size === 0 || bulkUpdateMutation.isPending}
                onClick={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), visibility: "private" })}
                className="h-7 text-xs gap-1 border-gray-300"
              >
                <Lock className="w-3 h-3" /> Private
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.size === 0 || bulkUpdateMutation.isPending}
                onClick={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), visibility: "inner-circle" })}
                className="h-7 text-xs gap-1 border-blue-300 text-blue-600"
              >
                <Users className="w-3 h-3" /> Inner Circle
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.size === 0 || bulkUpdateMutation.isPending}
                onClick={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), visibility: "public" })}
                className="h-7 text-xs gap-1 border-green-300 text-green-600"
              >
                <Globe className="w-3 h-3" /> Public
              </Button>
              {bulkUpdateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
            </div>
          </motion.div>
        )}
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
      ) : filteredTracks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-purple-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {searchQuery.trim() ? `No riffs match "${searchQuery}"` : `No ${visibilityFilter} tracks`}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery.trim() ? "Try a different title, artist, genre, or vibe tag." : "You have no tracks with this visibility setting."}
          </p>
          <div className="flex items-center justify-center gap-2">
            {searchQuery.trim() && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            )}
            {visibilityFilter !== "all" && (
              <Button variant="outline" onClick={() => setVisibilityFilter("all")}>
                Show All
              </Button>
            )}
          </div>
        </motion.div>
      ) : (
        <>
          <AnimatePresence>
            <div className="space-y-3">
              {filteredTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  queue={filteredTracks}
                  previewLinkStatus={previewLinkByTrack[track.id]}
                  bulkMode={bulkMode}
                  selected={selectedIds.has(track.id)}
                  onToggleSelect={toggleSelect}
                  isPlatinum={isPlatinum}
                />
              ))}
            </div>
          </AnimatePresence>
          <CreativeIdentityPanel tracks={tracks} />
        </>
      )}
    </div>
  );
}
