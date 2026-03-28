import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload as UploadIcon,
  Music,
  Globe,
  Lock,
  Users,
  Tag,
  Plus,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useLocation } from "wouter";

const MOOD_PRESETS = [
  "Chill", "Energetic", "Melancholic", "Upbeat", "Dark", "Dreamy",
  "Aggressive", "Romantic", "Nostalgic", "Experimental", "Lo-fi", "Epic",
];

const GRADIENTS = [
  "from-pink-400 to-purple-500",
  "from-blue-400 to-purple-500",
  "from-green-400 to-teal-500",
  "from-orange-400 to-red-500",
  "from-yellow-400 to-orange-500",
  "from-indigo-400 to-blue-500",
];

const VISIBILITY_OPTIONS = [
  {
    id: "private" as const,
    label: "Private",
    description: "Only you can hear this",
    icon: Lock,
    color: "from-gray-400 to-gray-500",
  },
  {
    id: "inner-circle" as const,
    label: "Inner Circle",
    description: "Friends you follow can hear this",
    icon: Users,
    color: "from-blue-400 to-purple-500",
  },
  {
    id: "public" as const,
    label: "Public",
    description: "Everyone on Strawberry Riff",
    icon: Globe,
    color: "from-pink-400 to-purple-500",
  },
];

type UploadState = "idle" | "uploading" | "success" | "error";

export default function Upload() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [form, setForm] = useState({
    title: "",
    artist: "",
    genre: "",
    description: "",
    visibility: "private" as "private" | "inner-circle" | "public",
    moodTags: [] as string[],
    customMood: "",
    gradient: GRADIENTS[0],
  });

  const getUploadUrl = trpc.tracks.getUploadUrl.useMutation();
  const createTrack = trpc.tracks.create.useMutation();
  const utils = trpc.useUtils();

  const handleFile = (f: File) => {
    if (!f.type.startsWith("audio/")) {
      toast.error("Please select an audio file (MP3, WAV, AAC, FLAC, etc.)");
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      toast.error("File must be under 100MB");
      return;
    }
    setFile(f);
    if (!form.title) {
      setForm((prev) => ({ ...prev, title: f.name.replace(/\.[^/.]+$/, "") }));
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [form.title]
  );

  const addMoodTag = (tag: string) => {
    if (!form.moodTags.includes(tag) && form.moodTags.length < 8) {
      setForm((prev) => ({ ...prev, moodTags: [...prev.moodTags, tag] }));
    }
  };

  const removeMoodTag = (tag: string) => {
    setForm((prev) => ({ ...prev, moodTags: prev.moodTags.filter((t) => t !== tag) }));
  };

  const addCustomMood = () => {
    const tag = form.customMood.trim();
    if (tag && !form.moodTags.includes(tag) && form.moodTags.length < 8) {
      setForm((prev) => ({ ...prev, moodTags: [...prev.moodTags, tag], customMood: "" }));
    }
  };

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]); // strip data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleSubmit = async () => {
    if (!file || !form.title.trim()) {
      toast.error("Please add a file and title");
      return;
    }
    setUploadState("uploading");
    setUploadProgress(20);

    try {
      const base64 = await fileToBase64(file);
      setUploadProgress(40);

      const { url: audioUrl, key: audioKey } = await getUploadUrl.mutateAsync({
        fileName: file.name,
        mimeType: file.type,
        base64,
      });
      setUploadProgress(80);

      // Get audio duration
      let duration: number | undefined;
      try {
        const audioEl = document.createElement("audio");
        audioEl.src = URL.createObjectURL(file);
        await new Promise<void>((res) => {
          audioEl.onloadedmetadata = () => {
            duration = Math.round(audioEl.duration);
            res();
          };
          setTimeout(res, 2000);
        });
      } catch {}

      await createTrack.mutateAsync({
        title: form.title.trim(),
        artist: form.artist.trim() || undefined,
        genre: form.genre.trim() || undefined,
        description: form.description.trim() || undefined,
        audioUrl,
        audioKey,
        duration,
        moodTags: form.moodTags,
        visibility: form.visibility,
        gradient: form.gradient,
      });

      setUploadProgress(100);
      setUploadState("success");
      utils.tracks.myTracks.invalidate();
      utils.tracks.publicFeed.invalidate();
      toast.success("Your riff has been uploaded!");
    } catch (err: any) {
      console.error(err);
      setUploadState("error");
      toast.error(err?.message || "Upload failed. Please try again.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mx-auto mb-6">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Sign in to Upload</h2>
          <p className="text-muted-foreground mb-6">
            Join Strawberry Riff to share your music with the world.
          </p>
          <Button
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Sign In to Upload
          </Button>
        </div>
      </div>
    );
  }

  if (uploadState === "success") {
    return (
      <div className="container py-20 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md mx-auto"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Riff Uploaded!</h2>
          <p className="text-muted-foreground mb-8">Your track is live and ready to be heard.</p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setUploadState("idle");
                setUploadProgress(0);
                setForm({
                  title: "", artist: "", genre: "", description: "",
                  visibility: "private", moodTags: [], customMood: "", gradient: GRADIENTS[0],
                });
              }}
            >
              Upload Another
            </Button>
            <Button
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
              onClick={() => navigate("/my-riffs")}
            >
              View My Riffs
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Upload Your Riff
          </h1>
          <p className="text-muted-foreground">Share your music with the Strawberry Riff community</p>
        </div>

        <div className="space-y-6">
          {/* Drop Zone */}
          <Card>
            <CardContent className="p-0">
              <div
                className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                  dragOver
                    ? "border-purple-400 bg-purple-50"
                    : file
                    ? "border-green-400 bg-green-50"
                    : "border-pink-200 hover:border-purple-300 hover:bg-purple-50/30"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB · Click to change
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mx-auto mb-4">
                      <UploadIcon className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700 mb-1">
                      Drop your audio file here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      MP3, WAV, AAC, FLAC, OGG — up to 100MB
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Track Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Give your riff a name"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="artist">Artist Name</Label>
                  <Input
                    id="artist"
                    placeholder="Your artist name"
                    value={form.artist}
                    onChange={(e) => setForm((p) => ({ ...p, artist: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  placeholder="e.g. Electronic, Indie, Hip-Hop"
                  value={form.genre}
                  onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell the story behind this riff..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mood Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-500" /> Tag the Mood
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {MOOD_PRESETS.map((tag) => {
                  const selected = form.moodTags.includes(tag);
                  return (
                    <motion.button
                      key={tag}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => selected ? removeMoodTag(tag) : addMoodTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        selected
                          ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-md"
                          : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      {tag}
                    </motion.button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom mood tag..."
                  value={form.customMood}
                  onChange={(e) => setForm((p) => ({ ...p, customMood: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addCustomMood()}
                  className="flex-1"
                />
                <Button variant="outline" onClick={addCustomMood} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {form.moodTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.moodTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1 bg-purple-100 text-purple-700"
                    >
                      {tag}
                      <button onClick={() => removeMoodTag(tag)} className="ml-1 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gradient Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Track Color</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {GRADIENTS.map((g) => (
                  <motion.button
                    key={g}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setForm((p) => ({ ...p, gradient: g }))}
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g} transition-all ${
                      form.gradient === g ? "ring-2 ring-offset-2 ring-purple-500 scale-110" : ""
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Who Can Hear This?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {VISIBILITY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = form.visibility === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setForm((p) => ({ ...p, visibility: opt.id }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? "border-purple-400 bg-purple-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${opt.color} flex items-center justify-center mb-3`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                      {selected && (
                        <Badge className="mt-2 text-xs bg-purple-100 text-purple-700 border-0">
                          Selected
                        </Badge>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upload Button */}
          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {uploadState === "uploading" && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
                {uploadState === "error" && (
                  <div className="flex items-center gap-2 text-red-600 text-sm mb-3 p-3 bg-red-50 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    Upload failed. Please try again.
                  </div>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={uploadState === "uploading"}
                  className="w-full py-6 text-base bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg"
                  size="lg"
                >
                  {uploadState === "uploading" ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-5 h-5 mr-2" />
                      Upload & Share Your Riff
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
