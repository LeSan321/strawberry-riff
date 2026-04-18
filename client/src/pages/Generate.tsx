import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Music, Loader2, CheckCircle2, AlertCircle, Upload, Clock, Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── Status polling hook ───────────────────────────────────────────────────────
function useGenerationPolling(
  generationId: number | null,
  onComplete: () => void
) {
  const utils = trpc.useUtils();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!generationId) return;

    const poll = async () => {
      const gen = await utils.musicGeneration.getById.fetch({ id: generationId });
      if (gen?.status === "complete" || gen?.status === "failed") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        await utils.musicGeneration.myGenerations.invalidate();
        onComplete();
      }
    };

    intervalRef.current = setInterval(poll, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generationId]);
}

// ─── Publish dialog ────────────────────────────────────────────────────────────
function PublishDialog({
  open,
  onClose,
  generationId,
}: {
  open: boolean;
  onClose: () => void;
  generationId: number;
}) {
  const [visibility, setVisibility] = useState<"private" | "inner-circle" | "public">("private");
  const publishMutation = trpc.musicGeneration.publish.useMutation();

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync({ generationId, visibility });
      toast.success("Published to My Riffs!");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish to My Riffs</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            This will add the generated track to your My Riffs library. You can edit the details there after publishing.
          </p>
          <div>
            <label className="mb-2 block text-sm font-medium">Visibility</label>
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as typeof visibility)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private — only you</SelectItem>
                <SelectItem value="inner-circle">Inner Circle — friends only</SelectItem>
                <SelectItem value="public">Public — everyone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={publishMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={publishMutation.isPending}>
            {publishMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publishing...</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" />Publish</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Generation card ───────────────────────────────────────────────────────────
function GenerationCard({ gen }: { gen: { id: number; title: string; duration: number; status: string; audioUrl: string | null; createdAt: Date } }) {
  const [publishOpen, setPublishOpen] = useState(false);

  const statusColor =
    gen.status === "complete"
      ? "bg-green-500/10 text-green-700 border-green-200"
      : gen.status === "failed"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-yellow-500/10 text-yellow-700 border-yellow-200";

  return (
    <div className="rounded-lg border p-3 text-sm hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium truncate">{gen.title}</p>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor}`}>
          {gen.status === "generating" ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              generating
            </span>
          ) : gen.status}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {gen.duration}s • {new Date(gen.createdAt).toLocaleDateString()}
      </p>
      {gen.status === "complete" && gen.audioUrl && (
        <div className="mt-2 space-y-2">
          <audio src={gen.audioUrl} controls className="w-full h-8" />
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => setPublishOpen(true)}
          >
            <Upload className="mr-1.5 h-3 w-3" />
            Publish to My Riffs
          </Button>
        </div>
      )}
      {gen.status === "failed" && (
        <p className="mt-1 text-xs text-destructive">Generation failed. Please try again.</p>
      )}
      {publishOpen && (
        <PublishDialog
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          generationId={gen.id}
        />
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function GeneratePage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [duration, setDuration] = useState("240");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingId, setPollingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const generateMutation = trpc.musicGeneration.generate.useMutation();
  const { data: myGenerations, isLoading: isLoadingGenerations } =
    trpc.musicGeneration.myGenerations.useQuery(undefined, { enabled: !!user });

  // Poll until the active generation completes
  useGenerationPolling(pollingId, () => {
    setPollingId(null);
    toast.success("Music generation complete! Ready to publish.");
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Title is required"); return; }
    if (!prompt.trim()) { setError("Prompt is required"); return; }
    if (!lyrics.trim()) { setError("Lyrics are required"); return; }

    setIsGenerating(true);
    try {
      const result = await generateMutation.mutateAsync({
        title: title.trim(),
        prompt: prompt.trim(),
        lyrics: lyrics.trim(),
        duration: parseInt(duration),
      });
      setPollingId(result.id);
      await utils.musicGeneration.myGenerations.invalidate();
      setTitle("");
      setPrompt("");
      setLyrics("");
      setDuration("240");
      toast.info("Generation started — this usually takes 1–3 minutes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <Music className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold">Sign in to Generate Music</h2>
          <p className="text-muted-foreground">
            Create beautiful AI-generated music with ACE-Step
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Generation Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-2.5">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Generate Music</h1>
                <p className="mt-1 text-muted-foreground">
                  Create AI-generated music using ACE-Step. Provide a prompt, lyrics, and duration.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium">Title</label>
                <Input
                  placeholder="e.g., Jazz Noir Session"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isGenerating}
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-muted-foreground">{title.length}/200</p>
              </div>

              {/* Prompt */}
              <div>
                <label className="mb-2 block text-sm font-medium">Music Prompt</label>
                <Textarea
                  placeholder="e.g., jazz, noir, 95 BPM, piano, drums, smoky atmosphere, intimate, melancholic"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                  maxLength={1000}
                  rows={4}
                />
                <p className="mt-1 text-xs text-muted-foreground">{prompt.length}/1000 characters</p>
              </div>

              {/* Lyrics */}
              <div>
                <label className="mb-2 block text-sm font-medium">Lyrics</label>
                <Textarea
                  placeholder={`[verse]\nSing your heart out\n\n[chorus]\nThis is the chorus\n\n[verse]\nSecond verse here\n\n[chorus]\nRepeat the chorus`}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  disabled={isGenerating}
                  rows={8}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use [verse], [chorus], [bridge] tags to structure your lyrics
                </p>
              </div>

              {/* Duration */}
              <div>
                <label className="mb-2 block text-sm font-medium">Duration</label>
                <Select value={duration} onValueChange={setDuration} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                    <SelectItem value="240">4 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Active polling indicator */}
              {pollingId && (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-700 border border-yellow-200">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  Generating your track — checking for updates every 5 seconds...
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={isGenerating || !!pollingId || !title.trim() || !prompt.trim() || !lyrics.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting generation...</>
                ) : pollingId ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generation in progress...</>
                ) : (
                  <><Music className="mr-2 h-4 w-4" />Generate Music</>
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Recent Generations */}
        <div>
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Recent Generations</h2>
              {myGenerations && myGenerations.length > 0 && (
                <Badge variant="secondary">{myGenerations.length}</Badge>
              )}
            </div>
            {isLoadingGenerations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : myGenerations && myGenerations.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {myGenerations.map((gen) => (
                  <GenerationCard key={gen.id} gen={gen} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No generations yet. Fill in the form and hit Generate!
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
