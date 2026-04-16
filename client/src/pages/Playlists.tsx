import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListMusic,
  Plus,
  Trash2,
  Edit2,
  Play,
  Pause,
  Music,
  Loader2,
  ChevronDown,
  ChevronRight,
  X,
  ImagePlus,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link } from "wouter";

const GRADIENTS = [
  "from-purple-400 to-pink-400",
  "from-blue-400 to-purple-500",
  "from-green-400 to-teal-500",
  "from-orange-400 to-red-500",
  "from-yellow-400 to-orange-500",
  "from-indigo-400 to-blue-500",
];

interface Playlist {
  id: number;
  title: string;
  description?: string | null;
  gradient?: string | null;
  coverArtUrl?: string | null;
  trackCount: number;
  createdAt: Date;
}

interface Track {
  id: number;
  title: string;
  artist?: string | null;
  audioUrl: string;
  gradient?: string | null;
  moodTags: string[];
}

function CreatePlaylistDialog({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ title: "", description: "", gradient: GRADIENTS[0] });
  const createMutation = trpc.playlists.create.useMutation({
    onSuccess: () => {
      utils.playlists.list.invalidate();
      toast.success("Playlist created!");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Create Playlist</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div>
          <Label>Title *</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="My Playlist"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="What's this playlist about?"
            className="mt-1 resize-none"
            rows={2}
          />
        </div>
        <div>
          <Label>Color</Label>
          <div className="flex gap-2 mt-2">
            {GRADIENTS.map((g) => (
              <button
                key={g}
                onClick={() => setForm((p) => ({ ...p, gradient: g }))}
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${g} ${
                  form.gradient === g ? "ring-2 ring-offset-1 ring-purple-500 scale-110" : ""
                } transition-all`}
              />
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => createMutation.mutate(form)}
          disabled={!form.title.trim() || createMutation.isPending}
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0"
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Create
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const utils = trpc.useUtils();
  const { play, pause, currentTrack, isPlaying } = useAudioPlayer();
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editForm, setEditForm] = useState({
    title: playlist.title,
    description: playlist.description ?? "",
    gradient: playlist.gradient ?? GRADIENTS[0],
    coverArtUrl: playlist.coverArtUrl ?? "",
  });
  const [coverPreview, setCoverPreview] = useState<string | null>(playlist.coverArtUrl ?? null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const uploadCoverArtMutation = trpc.tracks.uploadCoverArt.useMutation();

  const handleCoverArtChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const result = await uploadCoverArtMutation.mutateAsync({ base64, mimeType: file.type, context: "playlist" });
        setCoverPreview(result.url);
        setEditForm((p) => ({ ...p, coverArtUrl: result.url }));
        setUploadingCover(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to upload cover art");
      setUploadingCover(false);
    }
  };

  const tracksQuery = trpc.playlists.getTracks.useQuery(
    { playlistId: playlist.id },
    { enabled: expanded }
  );
  const tracks = (tracksQuery.data ?? []) as Track[];

  const deleteMutation = trpc.playlists.delete.useMutation({
    onSuccess: () => {
      utils.playlists.list.invalidate();
      toast.success("Playlist deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.playlists.update.useMutation({
    onSuccess: () => {
      utils.playlists.list.invalidate();
      toast.success("Playlist updated");
      setEditOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const removeTrackMutation = trpc.playlists.removeTrack.useMutation({
    onSuccess: () => {
      utils.playlists.getTracks.invalidate({ playlistId: playlist.id });
      utils.playlists.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="p-0">
            <div
              className={`h-16 bg-gradient-to-r ${playlist.gradient || GRADIENTS[0]} flex items-center px-4 cursor-pointer relative overflow-hidden`}
              onClick={() => setExpanded(!expanded)}
            >
              {playlist.coverArtUrl && (
                <img
                  src={playlist.coverArtUrl}
                  alt="cover"
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
              )}
              <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                  {playlist.coverArtUrl ? (
                    <img src={playlist.coverArtUrl} alt="cover" className="w-full h-full object-cover" />
                  ) : (
                    <ListMusic className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{playlist.title}</p>
                  <p className="text-xs text-white/70">
                    {playlist.trackCount} {playlist.trackCount === 1 ? "track" : "tracks"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/20"
                  onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/20"
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expanded ? (
                  <ChevronDown className="w-5 h-5 text-white/70" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-white/70" />
                )}
              </div>
            </div>
          </CardHeader>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <CardContent className="p-4">
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground mb-3">{playlist.description}</p>
                  )}
                  {tracksQuery.isLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                    </div>
                  ) : tracks.length === 0 ? (
                    <div className="text-center py-6">
                      <Music className="w-8 h-8 text-purple-200 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No tracks yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add tracks from your{" "}
                        <Link href="/my-riffs" className="text-purple-500 hover:underline">
                          My Riffs
                        </Link>{" "}
                        page.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tracks.map((track) => {
                        const isCurrentTrack = currentTrack?.id === track.id;
                        return (
                          <div
                            key={track.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 group"
                          >
                            <button
                              className={`w-8 h-8 rounded-full bg-gradient-to-br ${track.gradient || "from-pink-400 to-purple-500"} flex items-center justify-center flex-shrink-0`}
                              onClick={() => {
                                if (isCurrentTrack && isPlaying) {
                                  pause();
                                } else {
                                  play(
                                    {
                                      id: track.id,
                                      title: track.title,
                                      artist: track.artist,
                                      audioUrl: track.audioUrl,
                                      gradient: track.gradient,
                                      moodTags: track.moodTags,
                                    },
                                    tracks.map((t) => ({
                                      id: t.id,
                                      title: t.title,
                                      artist: t.artist,
                                      audioUrl: t.audioUrl,
                                      gradient: t.gradient,
                                      moodTags: t.moodTags,
                                    }))
                                  );
                                }
                              }}
                            >
                              {isCurrentTrack && isPlaying ? (
                                <Pause className="w-3.5 h-3.5 text-white" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{track.title}</p>
                              {track.artist && (
                                <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                              )}
                            </div>
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                              onClick={() =>
                                removeTrackMutation.mutate({
                                  playlistId: playlist.id,
                                  trackId: track.id,
                                })
                              }
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

        {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                className="mt-1 resize-none"
                rows={2}
              />
            </div>
            <div>
              <Label>Cover Art</Label>
              <div className="mt-2 flex items-center gap-3">
                <div
                  className={`w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br ${editForm.gradient || GRADIENTS[0]} flex items-center justify-center flex-shrink-0 cursor-pointer relative group`}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverPreview ? (
                    <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                  ) : (
                    <ListMusic className="w-6 h-6 text-white" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadingCover ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <ImagePlus className="w-4 h-4 text-white" />}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Click to upload a cover image</p>
                  <p className="text-xs mt-0.5">JPG, PNG, or WebP</p>
                  {coverPreview && (
                    <button
                      className="text-xs text-red-400 hover:text-red-600 mt-1"
                      onClick={() => { setCoverPreview(null); setEditForm((p) => ({ ...p, coverArtUrl: "" })); }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverArtChange} />
              </div>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {GRADIENTS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setEditForm((p) => ({ ...p, gradient: g }))}
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${g} ${
                      editForm.gradient === g ? "ring-2 ring-offset-1 ring-purple-500 scale-110" : ""
                    } transition-all`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate({ id: playlist.id, ...editForm })}
              disabled={updateMutation.isPending || uploadingCover}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Playlist?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will delete <strong>{playlist.title}</strong> and all its track associations.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { deleteMutation.mutate({ id: playlist.id }); setConfirmDelete(false); }}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Playlists() {
  const { isAuthenticated } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);

  const playlistsQuery = trpc.playlists.list.useQuery(undefined, { enabled: isAuthenticated });
  const playlists = (playlistsQuery.data ?? []) as Playlist[];

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mx-auto mb-6">
            <ListMusic className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Sign in to create playlists</h2>
          <p className="text-muted-foreground mb-6">Organize your favorite tracks into playlists.</p>
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
            Playlists
          </h1>
          <p className="text-muted-foreground mt-1">
            {playlists.length} {playlists.length === 1 ? "playlist" : "playlists"}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Playlist
        </Button>
      </div>

      {playlistsQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : playlists.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
            <ListMusic className="w-10 h-10 text-purple-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No playlists yet</h3>
          <p className="text-muted-foreground mb-6">Create your first playlist to organize your tracks.</p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Playlist
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {playlists.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <CreatePlaylistDialog onClose={() => setCreateOpen(false)} />
      </Dialog>
    </div>
  );
}
