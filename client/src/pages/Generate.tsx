import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
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
import { Music, Loader2, AlertCircle, Upload, Clock, Sparkles, RefreshCw, Crown, Zap, Trash2, Dices, Mic2, X, FileAudio, Layers, GitFork, BookMarked, Pencil, Search } from "lucide-react";
import FusionRecipesDrawer from "@/components/FusionRecipesDrawer";
import { VisualBriefPanel } from "@/components/VisualBriefPanel";
import { StemSplitButton } from "@/components/StemSplitButton";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { getRandomFusion } from "@shared/fusionLibrary";
import { MOOD_CATEGORIES } from "../../../shared/moodTags";
import { Tag } from "lucide-react";

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
        await utils.musicGeneration.monthlyUsage.invalidate();
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
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const publishMutation = trpc.musicGeneration.publish.useMutation();

  const toggleMood = (tag: string) => {
    setSelectedMoods((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 8 ? [...prev, tag] : prev
    );
  };

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync({ generationId, visibility, moodTags: selectedMoods });
      toast.success("Published to My Riffs!");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish to My Riffs</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <p className="text-sm text-muted-foreground">
            This will add the generated track to your My Riffs library. You can edit the details there after publishing.
          </p>

          {/* Visibility */}
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

          {/* Mood Tags */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-purple-400" /> Tag the Vibe
              </label>
              <span className="text-xs text-muted-foreground">{selectedMoods.length}/8 selected</span>
            </div>
            <div className="space-y-3">
              {MOOD_CATEGORIES.map((cat) => (
                <div key={cat.label}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">{cat.emoji} {cat.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.tags.map((tag) => {
                      const selected = selectedMoods.includes(tag);
                      const atLimit = selectedMoods.length >= 8 && !selected;
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleMood(tag)}
                          disabled={atLimit}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                            selected
                              ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-sm"
                              : atLimit
                              ? "bg-card text-muted-foreground/40 border-border/40 cursor-not-allowed"
                              : "bg-card text-muted-foreground border-border hover:border-purple-400 hover:text-foreground"
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
            {selectedMoods.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                {selectedMoods.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  >
                    {tag}
                    <button onClick={() => toggleMood(tag)} className="hover:text-red-400 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
function GenerationCard({
  gen,
  onRegenerate,
  onDelete,
  onRefine,
  onToggleFavorite,
  isPremium,
}: {
  gen: { id: number; title: string; prompt: string; lyrics: string; status: string; audioUrl: string | null; errorMessage?: string | null; createdAt: Date; isFavorited?: boolean; visualBrief?: string | null; isSplit?: boolean };
  onRegenerate: (settings: { title: string; prompt: string; lyrics: string }) => void;
  onDelete: (id: number) => void;
  onRefine: (generationId: number, refinement: "more_aggressive" | "less_busy" | "different_vibe") => void;
  onToggleFavorite: (id: number) => void;
  isPremium?: boolean;
}) {
  const [, navigate] = useLocation();
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saveLibraryOpen, setSaveLibraryOpen] = useState(false);
  const [libraryStyleName, setLibraryStyleName] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(gen.title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const renameMutation = trpc.musicGeneration.rename.useMutation({
    onSuccess: (data) => {
      setTitleDraft(data.title);
      utils.musicGeneration.myGenerations.invalidate();
      toast.success("Title updated!");
    },
    onError: () => toast.error("Failed to update title"),
  });

  const handleTitleSave = () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === gen.title) { setEditingTitle(false); return; }
    renameMutation.mutate({ generationId: gen.id, title: trimmed });
    setEditingTitle(false);
  };
  const saveStyleMutation = trpc.styleLibrary.save.useMutation({
    onSuccess: () => {
      toast.success("Style saved to your library!");
      setSaveLibraryOpen(false);
      setLibraryStyleName("");
    },
    onError: () => toast.error("Failed to save style"),
  });

  const statusColor =
    gen.status === "complete"
      ? "bg-green-500/10 text-green-700 border-green-200"
      : gen.status === "failed"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-yellow-500/10 text-yellow-700 border-yellow-200";

  return (
    <div className="rounded-lg border p-3 text-sm hover:bg-accent/50 transition-colors w-full overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
              if (e.key === "Escape") { setTitleDraft(gen.title); setEditingTitle(false); }
            }}
            className="flex-1 font-medium text-sm bg-transparent border-b border-pink-400 outline-none px-0 py-0 min-w-0"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-1 flex-1 min-w-0 group">
            <button
              className="font-medium truncate text-left hover:text-pink-600 transition-colors flex-1 min-w-0"
              onClick={() => navigate(`/track-detail/${gen.id}`)}
              title="View track details"
            >
              <span className="truncate block">{titleDraft !== gen.title ? titleDraft : gen.title}</span>
            </button>
            <button
              className="p-0.5 rounded hover:bg-pink-500/10 text-muted-foreground hover:text-pink-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              onClick={() => { setTitleDraft(gen.title); setEditingTitle(true); }}
              title="Rename track"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-1 shrink-0">
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor}`}>
          {gen.status === "generating" ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              generating
            </span>
          ) : gen.status}
        </span>
        <button
          onClick={() => onToggleFavorite(gen.id)}
          className="p-1 rounded hover:bg-pink-500/10 transition-colors"
          title="Mark as favorite"
        >
          <span className={`text-lg transition-all ${gen.isFavorited ? "drop-shadow-md" : "opacity-50"}`}>
            🍓
          </span>
        </button>
        <button
          onClick={() => setDeleteConfirmOpen(true)}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Delete generation"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {new Date(gen.createdAt).toLocaleDateString()}
      </p>
      {gen.status === "complete" && gen.audioUrl && (
        <div className="mt-2 space-y-2">
          <audio src={gen.audioUrl} controls className="w-full h-8" />
          <div className="space-y-1.5">
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => setPublishOpen(true)}
            >
              <Upload className="mr-1.5 h-3 w-3" />
              Publish
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 text-xs"
              onClick={() => onRegenerate({ title: gen.title, prompt: gen.prompt, lyrics: gen.lyrics })}
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Re-generate
            </Button>
          </div>
          <div className="flex gap-1.5">
            {isPremium ? (
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                onClick={() => {
                  const riffPrompt = `${gen.prompt} — Complementary variation: same energy, different mood. Push the contrast.`;
                  sessionStorage.setItem("prefill_lyrics", "");
                  sessionStorage.setItem("prefill_prompt", riffPrompt);
                  sessionStorage.setItem("prefill_title", `Riff on: ${gen.title}`);
                  window.location.href = "/generate";
                }}
                title="Pre-fill Generate with a variation of this style"
              >
                <GitFork className="mr-1.5 h-3 w-3" />
                Riff
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 text-xs text-gray-400 hover:text-purple-600 hover:bg-purple-50 relative"
                onClick={() => {
                  toast(
                    <div className="flex items-start gap-2">
                      <Crown className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Riff Mode is Premium</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Generate variations on your tracks with one click.</p>
                        <a href="/pricing" className="text-xs text-purple-600 font-medium mt-1 inline-block hover:underline">Upgrade →</a>
                      </div>
                    </div>,
                    { duration: 5000 }
                  );
                }}
                title="Riff Mode — Premium feature"
              >
                <Crown className="mr-1 h-3 w-3 text-amber-400" />
                Riff
              </Button>
            )}
            {isPremium ? (
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                onClick={() => {
                  setLibraryStyleName(gen.title);
                  setSaveLibraryOpen(true);
                }}
                title="Save this music style to your Style Library"
              >
                <BookMarked className="mr-1.5 h-3 w-3" />
                Save Style
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 text-xs text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                onClick={() => {
                  toast(
                    <div className="flex items-start gap-2">
                      <Crown className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Style Library is Premium</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Save and reuse your best music styles.</p>
                        <a href="/pricing" className="text-xs text-purple-600 font-medium mt-1 inline-block hover:underline">Upgrade →</a>
                      </div>
                    </div>,
                    { duration: 5000 }
                  );
                }}
                title="Style Library — Premium feature"
              >
                <Crown className="mr-1 h-3 w-3 text-amber-400" />
                Save Style
              </Button>
            )}
          </div>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onRefine(gen.id, "more_aggressive")}
              title="Make the arrangement bolder and more energetic"
            >
              ⚡ More
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onRefine(gen.id, "less_busy")}
              title="Simplify the arrangement, focus on vocals"
            >
              🎯 Less
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onRefine(gen.id, "different_vibe")}
              title="Try a completely different style"
            >
              🔄 Vibe
            </Button>
            <StemSplitButton generationId={gen.id} isSplit={gen.isSplit ?? false} className="text-xs" />
          </div>
          {gen.visualBrief ? (
            isPremium ? (
              <VisualBriefPanel
                visualBriefJson={gen.visualBrief}
                className="mt-2"
              />
            ) : (
              <div
                className="mt-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/50 p-3 cursor-pointer"
                onClick={() => {
                  toast(
                    <div className="flex items-start gap-2">
                      <Crown className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Visual Brief is Premium</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Unlock AI-generated visual direction for your tracks — camera, lighting, color palette, and scene.</p>
                        <a href="/pricing" className="text-xs text-purple-600 font-medium mt-1 inline-block hover:underline">Upgrade →</a>
                      </div>
                    </div>,
                    { duration: 5000 }
                  );
                }}
              >
                <div className="flex items-center gap-2">
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-amber-700">Visual Brief available — Premium unlocks it</span>
                </div>
                <p className="text-xs text-amber-600/70 mt-1">Camera direction, lighting, color palette &amp; scene for your track.</p>
              </div>
            )
          ) : null}
        </div>
      )}
      {gen.status === "failed" && (
        <div className="mt-2">
          <p className="mb-1.5 text-xs text-destructive">
            {gen.errorMessage
              ? gen.errorMessage.length > 120
                ? gen.errorMessage.substring(0, 120) + "..."
                : gen.errorMessage
              : "Generation failed — the AI service may be busy. Please try again."}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => onRegenerate({ title: gen.title, prompt: gen.prompt, lyrics: gen.lyrics })}
          >
            <RefreshCw className="mr-1.5 h-3 w-3" />
            Try Again
          </Button>
        </div>
      )}
      {publishOpen && (
        <PublishDialog
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          generationId={gen.id}
        />
      )}
      {deleteConfirmOpen && (
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this generation?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(gen.id);
                  setDeleteConfirmOpen(false);
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {saveLibraryOpen && (
        <Dialog open={saveLibraryOpen} onOpenChange={(v) => !v && setSaveLibraryOpen(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-amber-500" />
                Save to Style Library
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Style Name</label>
                <Input
                  value={libraryStyleName}
                  onChange={(e) => setLibraryStyleName(e.target.value)}
                  placeholder="e.g. Funky Lo-Fi Groove"
                  autoFocus
                />
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Style Prompt</p>
                <p className="text-xs font-mono text-foreground/80 line-clamp-4">{gen.prompt}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveLibraryOpen(false)}>Cancel</Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-white"
                disabled={!libraryStyleName.trim() || saveStyleMutation.isPending}
                onClick={() => saveStyleMutation.mutate({
                  name: libraryStyleName.trim(),
                  prompt: gen.prompt,
                  sourceGenerationId: gen.id,
                  sourceTitle: gen.title,
                })}
              >
                <BookMarked className="w-4 h-4 mr-1.5" />
                Save to Library
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Monthly usage banner ──────────────────────────────────────────────────────
function MonthlyUsageBanner({ used, limit, isPremium }: { used: number; limit: number | null; isPremium: boolean }) {
  if (isPremium) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-300/30 p-3 text-sm text-yellow-700">
        <Crown className="h-4 w-4 shrink-0" />
        <span>Premium — unlimited AI generations</span>
      </div>
    );
  }

  const remaining = (limit ?? 5) - used;
  const pct = Math.min((used / (limit ?? 5)) * 100, 100);
  const isNearLimit = remaining <= 1;
  const isAtLimit = remaining <= 0;

  return (
    <div className={`rounded-lg border p-3 text-sm ${isAtLimit ? "bg-destructive/10 border-destructive/30 text-destructive" : isNearLimit ? "bg-yellow-500/10 border-yellow-300/30 text-yellow-700" : "bg-muted/50 border-border text-muted-foreground"}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          {isAtLimit
            ? "Monthly limit reached — upgrade to Premium for unlimited generations"
            : `${used} of ${limit} free generations used this month`}
        </span>
        {!isAtLimit && <span className="font-medium">{remaining} left</span>}
      </div>
      <div className="h-1.5 w-full rounded-full bg-current/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-current transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function GeneratePage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [intensity, setIntensity] = useState<"subtle" | "balanced" | "aggressive">("balanced");
  const [vocalArchetype, setVocalArchetype] = useState<"intimate-bedroom" | "raw-emotional" | "soulful-belter" | "gritty-rock" | "confident-pop" | "lo-fi-whisper" | "powerful-anthem" | "storyteller-folk">("intimate-bedroom");
  const [vocalGender, setVocalGender] = useState<"male" | "female" | "neutral">("neutral");
  const [vocalSpectrumValue, setVocalSpectrumValue] = useState<number>(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingId, setPollingId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [fusionsOpen, setFusionsOpen] = useState(false);
  // Reference audio state
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(null);
  const [referenceAudioName, setReferenceAudioName] = useState<string | null>(null);
  const [isUploadingRef, setIsUploadingRef] = useState(false);
  const refAudioInputRef = useRef<HTMLInputElement>(null);
  // Voice reference state
  const [voiceReferenceUrl, setVoiceReferenceUrl] = useState<string | null>(null);
  const [voiceReferenceName, setVoiceReferenceName] = useState<string | null>(null);
  const [isUploadingVoiceRef, setIsUploadingVoiceRef] = useState(false);
  const voiceRefAudioInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill lyrics from Lyrics Generator page (via sessionStorage)
  useEffect(() => {
    const prefill = sessionStorage.getItem("prefill_lyrics");
    const prefillPrompt = sessionStorage.getItem("prefill_prompt");
    const prefillTitle = sessionStorage.getItem("prefill_title");
    if (prefill) {
      setLyrics(prefill);
      sessionStorage.removeItem("prefill_lyrics");
    }
    if (prefillPrompt) {
      setPrompt(prefillPrompt);
      sessionStorage.removeItem("prefill_prompt");
    }
    if (prefillTitle) {
      setTitle(prefillTitle);
      sessionStorage.removeItem("prefill_title");
    }
    if (prefill || prefillPrompt) {
      toast.success("Lyrics and style loaded from Lyrics Generator!");
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    // Pre-fill prompt from Fusion Recipes Drawer (via sessionStorage)
    const fusionPrompt = sessionStorage.getItem("fusionPrompt");
    const fusionName = sessionStorage.getItem("fusionName");
    if (fusionPrompt) {
      setPrompt(fusionPrompt);
      sessionStorage.removeItem("fusionPrompt");
      sessionStorage.removeItem("fusionName");
      toast.success(`Fusion recipe "${fusionName || "Fusion"}" loaded!`);
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, []);

  // Auto-fill prompt with reference audio URL when uploaded
  useEffect(() => {
    if (referenceAudioUrl) {
      setPrompt(referenceAudioUrl);
    }
  }, [referenceAudioUrl]);

  const utils = trpc.useUtils();
  const generateMutation = trpc.musicGeneration.generate.useMutation();
  const regenerateMutation = trpc.musicGeneration.regenerate.useMutation({
    onMutate: async ({ generationId }) => {
      await utils.musicGeneration.myGenerations.cancel();
      const prev = utils.musicGeneration.myGenerations.getData();
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.musicGeneration.myGenerations.setData(undefined, ctx.prev);
      toast.error("Could not regenerate — please try again.");
    },
    onSettled: () => {
      utils.musicGeneration.myGenerations.invalidate();
      utils.musicGeneration.monthlyUsage.invalidate();
    },
  });
  const deleteMutation = trpc.musicGeneration.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.musicGeneration.myGenerations.cancel();
      const prev = utils.musicGeneration.myGenerations.getData();
      utils.musicGeneration.myGenerations.setData(undefined, (old) =>
        old ? old.filter((g) => g.id !== id) : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.musicGeneration.myGenerations.setData(undefined, ctx.prev);
      toast.error("Could not delete — please try again.");
    },
    onSettled: () => {
      utils.musicGeneration.myGenerations.invalidate();
    },
  });
  const { data: myGenerations, isLoading: isLoadingGenerations } =
    trpc.musicGeneration.myGenerations.useQuery(undefined, { enabled: !!user });
  const { data: monthlyUsage } =
    trpc.musicGeneration.monthlyUsage.useQuery(undefined, { enabled: !!user });

  // Search/filter state for Recent Generations
  const [genSearchQuery, setGenSearchQuery] = useState("");
  const [genStatusFilter, setGenStatusFilter] = useState<"all" | "complete" | "generating" | "failed">("all");

  const filteredGenerations = useMemo(() => {
    if (!myGenerations) return [];
    let results = myGenerations;
    if (genSearchQuery.trim()) {
      const q = genSearchQuery.toLowerCase();
      results = results.filter((g) => (g.title || "").toLowerCase().includes(q));
    }
    if (genStatusFilter !== "all") {
      results = results.filter((g) => g.status === genStatusFilter);
    }
    return results;
  }, [myGenerations, genSearchQuery, genStatusFilter]);

  const handleDelete = useCallback((id: number) => {
    deleteMutation.mutate({ id });
  }, [deleteMutation]);

  const handleRefine = useCallback(
    (generationId: number, refinement: "more_aggressive" | "less_busy" | "different_vibe") => {
      regenerateMutation.mutate({ generationId, refinement });
      toast.info(`Regenerating with ${refinement.replace(/_/g, " ")} — this usually takes 1–3 minutes.`);
    },
    [regenerateMutation]
  );

  const toggleFavoriteMutation = trpc.musicGeneration.toggleFavorite.useMutation({
    onMutate: async ({ generationId }) => {
      await utils.musicGeneration.myGenerations.cancel();
      const prev = utils.musicGeneration.myGenerations.getData();
      utils.musicGeneration.myGenerations.setData(undefined, (old) =>
        old
          ? old.map((g) =>
              g.id === generationId ? { ...g, isFavorited: !g.isFavorited } : g
            )
          : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.musicGeneration.myGenerations.setData(undefined, ctx.prev);
      toast.error("Could not update favorite — please try again.");
    },
  });

  const handleToggleFavorite = useCallback((id: number) => {
    toggleFavoriteMutation.mutate({ generationId: id });
  }, [toggleFavoriteMutation]);

  // Poll until the active generation completes
  useGenerationPolling(pollingId, () => {
    setPollingId(null);
    toast.success("Music generation complete! Ready to publish.");
  });

  const handleRegenerate = useCallback(
    (settings: { title: string; prompt: string; lyrics: string }) => {
      setTitle(settings.title);
      setPrompt(settings.prompt);
      setLyrics(settings.lyrics);
      setError(null);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      toast.info("Settings loaded — review and hit Generate when ready.");
    },
    []
  );

  const handleSurpriseMe = useCallback(() => {
    const fusion = getRandomFusion();
    setPrompt(fusion.promptCore);
    setIntensity("balanced");
    setError(null);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    toast.success(`🎲 ${fusion.name} — ready to generate!`);
  }, []);

  const uploadAudioMutation = trpc.tracks.getUploadUrl.useMutation();

  const handleReferenceAudioSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Please select an audio file (MP3, WAV, etc.)");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Reference audio must be under 50MB");
      return;
    }
    setIsUploadingRef(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await uploadAudioMutation.mutateAsync({
        base64,
        mimeType: file.type,
        fileName: file.name,
      });
      setReferenceAudioUrl(res.url);
      setReferenceAudioName(file.name);
      toast.success("Reference audio uploaded — style will guide your generation!");
    } catch (err) {
      toast.error("Failed to upload reference audio — please try again");
      console.error(err);
    } finally {
      setIsUploadingRef(false);
    }
  }, [uploadAudioMutation]);

  const handleVoiceReferenceSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Please select an audio file (MP3, WAV, etc.)");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Voice reference must be under 50MB");
      return;
    }
    setIsUploadingVoiceRef(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await uploadAudioMutation.mutateAsync({
        base64,
        mimeType: file.type,
        fileName: file.name,
      });
      setVoiceReferenceUrl(res.url);
      setVoiceReferenceName(file.name);
      toast.success("Voice reference uploaded — the AI will match the vocal style!");
    } catch (err) {
      toast.error("Failed to upload voice reference — please try again");
      console.error(err);
    } finally {
      setIsUploadingVoiceRef(false);
    }
  }, [uploadAudioMutation]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Title is required"); return; }
    if (!referenceAudioUrl && !prompt.trim()) { setError("Prompt or reference audio is required"); return; }
    if (!lyrics.trim()) { setError("Lyrics are required"); return; }

    setIsGenerating(true);
    try {
      console.log("[Generate] About to send:", { vocalGender, vocalArchetype, vocalSpectrumValue });
      const result = await generateMutation.mutateAsync({
        title: title.trim(),
        prompt: prompt.trim(),
        lyrics: lyrics.trim(),
        intensity,
        vocalArchetype,
        vocalGender,
        vocalSpectrumValue,
        referenceAudioUrl: referenceAudioUrl ?? undefined,
        voiceReferenceUrl: voiceReferenceUrl ?? undefined,
      });
      setPollingId(result.id);
      await utils.musicGeneration.myGenerations.invalidate();
      await utils.musicGeneration.monthlyUsage.invalidate();
      setTitle("");
      setPrompt("");
      setLyrics("");
      setIntensity("balanced");
      toast.info("Generation started — this usually takes 1–3 minutes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const isAtLimit = monthlyUsage && !monthlyUsage.isPremium && monthlyUsage.limit !== null && monthlyUsage.used >= monthlyUsage.limit;

  if (!user) {
    return (
      <div className="w-full max-w-full px-4 py-6">
        <Card className="p-8 text-center">
          <Music className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold">Sign in to Generate Music</h2>
          <p className="text-muted-foreground">
            Create full-length AI-generated songs with Strawberry Riff
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full px-4 py-6 pb-24 overflow-x-hidden">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Generation Form */}
        <div className="lg:col-span-2" ref={formRef}>
          <Card className="p-6 w-full overflow-hidden">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-2.5">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Generate Music</h1>
                <p className="mt-1 text-muted-foreground">
                  Create full-length AI songs with vocals — just add a prompt and lyrics.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium">Title</label>
                <Input
                  placeholder="e.g., Midnight Blues"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isGenerating}
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-muted-foreground">{title.length}/200</p>
              </div>

              {/* Prompt */}
              <div>
                <label className="mb-2 block text-sm font-medium">Music Style Prompt</label>
                <Textarea
                  placeholder="e.g., Acoustic folk-blues, fingerpicked guitar, harmonica, melancholic, 90 BPM, warm and intimate"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                  maxLength={1000}
                  rows={4}
                />
                <p className="mt-1 text-xs text-muted-foreground">{prompt.length}/1000 characters — describe genre, instruments, mood, and tempo</p>
              </div>

              {/* Intensity Level */}
              <div>
                <label className="mb-2 block text-sm font-medium">Intensity Level</label>
                <Select value={intensity} onValueChange={(v) => setIntensity(v as typeof intensity)} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subtle">Subtle — Gentle, minimal, intimate</SelectItem>
                    <SelectItem value="balanced">Balanced — Clear, steady, well-structured</SelectItem>
                    <SelectItem value="aggressive">Aggressive — Bold, energetic, dynamic</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">Guides how the AI interprets your prompt</p>
              </div>

              {/* Vocal Archetype */}
              <div>
                <label className="mb-2 block text-sm font-medium">Vocal Character</label>
                <Select value={vocalArchetype} onValueChange={(v) => setVocalArchetype(v as typeof vocalArchetype)} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intimate-bedroom">Intimate Bedroom — Vulnerable, close-mic'd, breathy</SelectItem>
                    <SelectItem value="raw-emotional">Raw Emotional — Unpolished, honest, imperfect</SelectItem>
                    <SelectItem value="soulful-belter">Soulful Belter — Powerful, controlled, expressive runs</SelectItem>
                    <SelectItem value="gritty-rock">Gritty Rock — Strained, energetic, live-feeling</SelectItem>
                    <SelectItem value="confident-pop">Confident Modern Pop — Polished, produced, layered</SelectItem>
                    <SelectItem value="lofi-whisper">Lo-Fi Whisper — Intimate, textured, imperfect pitch</SelectItem>
                    <SelectItem value="powerful-anthem">Powerful Anthem — Soaring, confident, stadium-ready</SelectItem>
                    <SelectItem value="storyteller-folk">Storyteller Folk — Conversational, natural phrasing, acoustic</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">Shapes the vocal's tone, delivery, and production style</p>
              </div>

              {/* Vocal Gender */}
              <div>
                <label className="mb-2 block text-sm font-medium">Vocal Gender</label>
                <Select value={vocalGender} onValueChange={(val) => setVocalGender(val as "male" | "female" | "neutral")} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">Neutral — Let AI decide</SelectItem>
                    <SelectItem value="male">Male Vocals</SelectItem>
                    <SelectItem value="female">Female Vocals</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">Controls the gender of the generated vocals</p>
              </div>

              {/* Vocal Spectrum Slider — Fine-tune the vocal character within the selected archetype */}
              <div>
                <label className="mb-3 block text-sm font-medium">Vocal Spectrum</label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={vocalSpectrumValue}
                    onChange={(e) => setVocalSpectrumValue(Number(e.target.value))}
                    disabled={isGenerating}
                    className="w-full h-2 bg-gradient-to-r from-purple-300 to-pink-300 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Smooth Soaring</span>
                    <span>{vocalSpectrumValue}</span>
                    <span>Gritty Belting</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Fine-tune the vocal character within your selected archetype</p>
              </div>

              {/* Reference Audio Panel — Premium only (visible-but-locked for free users) */}
              {!monthlyUsage?.isPremium ? (
                <div
                  className="rounded-lg border border-dashed border-pink-200 bg-pink-50/50 p-4 cursor-pointer"
                  onClick={() => {
                    toast(
                      <div className="flex items-start gap-2">
                        <Crown className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">Style Reference Audio is Premium</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Upload a reference track to influence the style. The AI captures the general vibe rather than exact matching — think of it as inspiration rather than duplication.</p>
                          <a href="/pricing" className="text-xs text-purple-600 font-medium mt-1 inline-block hover:underline">Upgrade →</a>
                        </div>
                      </div>,
                      { duration: 5000 }
                    );
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <p className="text-sm font-medium text-pink-700">Style Reference Audio <span className="text-xs font-normal text-pink-500 ml-1">Premium</span></p>
                  </div>
                  <p className="text-xs text-muted-foreground">Upload a reference track for style inspiration. The AI captures the general vibe rather than exact matching — think of it as inspiration rather than duplication.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-pink-300 bg-pink-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic2 className="h-4 w-4 text-pink-600" />
                    <p className="text-sm font-medium text-pink-900">Style Reference Audio <span className="text-xs font-normal text-pink-600 ml-1">(optional)</span></p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upload a reference track for style inspiration. The AI captures the general vibe rather than exact matching — think of it as inspiration rather than duplication.
                  </p>
                  {referenceAudioUrl ? (
                    <div className="flex items-center gap-2 rounded-md bg-pink-500/10 border border-pink-200 px-3 py-2">
                      <FileAudio className="h-4 w-4 text-pink-600 shrink-0" />
                      <span className="text-xs text-pink-800 truncate flex-1">{referenceAudioName}</span>
                      <button
                        type="button"
                        onClick={() => { setReferenceAudioUrl(null); setReferenceAudioName(null); }}
                        className="text-pink-500 hover:text-pink-700 transition-colors"
                        title="Remove reference audio"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-pink-300 text-pink-700 hover:bg-pink-500/10"
                      onClick={() => refAudioInputRef.current?.click()}
                      disabled={isUploadingRef || isGenerating}
                    >
                      {isUploadingRef ? (
                        <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Uploading...</>
                      ) : (
                        <><Upload className="mr-2 h-3.5 w-3.5" />Upload Reference Song</>  
                      )}
                    </Button>
                  )}
                  <input
                    ref={refAudioInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleReferenceAudioSelect(file);
                      e.target.value = "";
                    }}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Supported: MP3, WAV, FLAC, M4A — max 50MB — min 15 seconds
                  </p>
                </div>
              )}

              {/* Voice Reference Audio Panel — Premium only (visible-but-locked for free users) */}
              {!monthlyUsage?.isPremium ? (
                <div
                  className="rounded-lg border border-dashed border-teal-200 bg-teal-50/50 p-4 cursor-pointer"
                  onClick={() => {
                    toast(
                      <div className="flex items-start gap-2">
                        <Crown className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">Voice Reference is Premium</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Upload a vocal sample and the AI will generate your song in that voice style.</p>
                          <a href="/pricing" className="text-xs text-purple-600 font-medium mt-1 inline-block hover:underline">Upgrade →</a>
                        </div>
                      </div>,
                      { duration: 5000 }
                    );
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <p className="text-sm font-medium text-teal-700">Voice Reference <span className="text-xs font-normal text-teal-500 ml-1">Premium</span></p>
                  </div>
                  <p className="text-xs text-muted-foreground">Upload a vocal sample and the AI will generate your song in that voice style.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-teal-300 bg-teal-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic2 className="h-4 w-4 text-teal-600" />
                    <p className="text-sm font-medium text-teal-900">Voice Reference <span className="text-xs font-normal text-teal-600 ml-1">(optional)</span></p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upload a vocal sample and the AI will generate your song sung in that voice style — your voice, a character, or any singer.
                  </p>
                  {voiceReferenceUrl ? (
                    <div className="flex items-center gap-2 rounded-md bg-teal-500/10 border border-teal-200 px-3 py-2">
                      <FileAudio className="h-4 w-4 text-teal-600 shrink-0" />
                      <span className="text-xs text-teal-800 truncate flex-1">{voiceReferenceName}</span>
                      <button
                        type="button"
                        onClick={() => { setVoiceReferenceUrl(null); setVoiceReferenceName(null); }}
                        className="text-teal-500 hover:text-teal-700 transition-colors"
                        title="Remove voice reference"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-teal-300 text-teal-700 hover:bg-teal-500/10"
                      onClick={() => voiceRefAudioInputRef.current?.click()}
                      disabled={isUploadingVoiceRef || isGenerating}
                    >
                      {isUploadingVoiceRef ? (
                        <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Uploading...</>
                      ) : (
                        <><Upload className="mr-2 h-3.5 w-3.5" />Upload Voice Sample</>
                      )}
                    </Button>
                  )}
                  <input
                    ref={voiceRefAudioInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVoiceReferenceSelect(file);
                      e.target.value = "";
                    }}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Supported: MP3, WAV, FLAC, M4A — max 50MB — min 15 seconds of clear vocals
                  </p>
                </div>
              )}

              {/* Surprise Me + Fusion Recipes Buttons */}
              <div className="rounded-lg border border-dashed border-purple-300 bg-purple-500/5 p-4">
                <p className="mb-3 text-sm font-medium text-purple-900">Not sure what to create?</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-500/10"
                    onClick={handleSurpriseMe}
                    disabled={isGenerating || !!pollingId}
                  >
                    <Dices className="mr-2 h-4 w-4" />
                    Surprise Me 🎲
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-500/10"
                    onClick={() => setFusionsOpen(true)}
                    disabled={isGenerating || !!pollingId}
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    Browse Fusions
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Random fusion or browse all 47 recipes by tier.
                </p>
              </div>
              <FusionRecipesDrawer
                open={fusionsOpen}
                onClose={() => setFusionsOpen(false)}
                onUsePrompt={(p) => { setPrompt(p); setFusionsOpen(false); }}
              />

              {/* Lyrics */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium">Lyrics</label>
                  <span className={`text-xs ${
                    lyrics.length > 3500 ? 'text-destructive font-semibold' :
                    lyrics.length > 3000 ? 'text-yellow-400' :
                    'text-muted-foreground'
                  }`}>
                    {lyrics.length} / 3500 characters
                  </span>
                </div>
                <Textarea
                  placeholder={`[Verse]\nSing your heart out\nUnder the midnight sky\n\n[Chorus]\nThis is the chorus\nWhere the music flies\n\n[Verse]\nSecond verse here\nAnother line to rhyme\n\n[Chorus]\nThis is the chorus\nWhere the music flies`}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  disabled={isGenerating}
                  rows={10}
                  className={lyrics.length > 3500 ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Use [Verse], [Chorus], [Bridge], [Outro] tags to structure your lyrics
                  </p>
                  {lyrics.length > 3000 && lyrics.length <= 3500 && (
                    <p className="text-xs text-yellow-400">Approaching limit — keep under 3500 characters</p>
                  )}
                  {lyrics.length > 3500 && (
                    <p className="text-xs text-destructive font-medium">Too long — trim {lyrics.length - 3500} characters</p>
                  )}
                </div>
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
                disabled={isGenerating || !!pollingId || !title.trim() || (!prompt.trim() && !referenceAudioUrl) || !lyrics.trim() || !!isAtLimit}
                className="w-full"
              >
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting generation...</>
                ) : pollingId ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generation in progress...</>
                ) : isAtLimit ? (
                  <><Crown className="mr-2 h-4 w-4" />Upgrade to Premium to Generate More</>
                ) : (
                  <><Music className="mr-2 h-4 w-4" />Generate Music</>
                )}
              </Button>

              {/* Compact counter badge for free users */}
              {monthlyUsage && !monthlyUsage.isPremium && monthlyUsage.limit !== null && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <div className="flex gap-0.5">
                    {Array.from({ length: monthlyUsage.limit }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i < monthlyUsage.used
                            ? monthlyUsage.used >= monthlyUsage.limit!
                              ? "bg-destructive"
                              : "bg-pink-400"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span>
                    {monthlyUsage.used} of {monthlyUsage.limit} generations used this month
                    {monthlyUsage.used < monthlyUsage.limit && (
                      <span className="ml-1 text-pink-500 font-medium">
                        · {monthlyUsage.limit - monthlyUsage.used} remaining
                      </span>
                    )}
                  </span>
                </div>
              )}
            </form>
          </Card>
        </div>

        {/* Recent Generations */}
        <div className="w-full overflow-hidden">
          <Card className="p-6 w-full overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Recent Generations</h2>
              {myGenerations && myGenerations.length > 0 && (
                <Badge variant="secondary">{myGenerations.length}</Badge>
              )}
            </div>

            {/* Search + Status filter */}
            {myGenerations && myGenerations.length > 0 && (
              <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={genSearchQuery}
                    onChange={(e) => setGenSearchQuery(e.target.value)}
                    placeholder="Search by title…"
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-pink-400/40 transition-all"
                  />
                  {genSearchQuery && (
                    <button
                      onClick={() => setGenSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <select
                  value={genStatusFilter}
                  onChange={(e) => setGenStatusFilter(e.target.value as typeof genStatusFilter)}
                  className="px-2.5 py-1.5 text-xs rounded-md bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-pink-400/40 transition-all cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="complete">Complete</option>
                  <option value="generating">Generating</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            )}

            {isLoadingGenerations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : myGenerations && myGenerations.length > 0 ? (
              filteredGenerations.length > 0 ? (
                <div className="space-y-3 pr-1">
                  {(genSearchQuery || genStatusFilter !== "all") && (
                    <p className="text-xs text-muted-foreground">
                      {filteredGenerations.length} of {myGenerations.length} result{filteredGenerations.length !== 1 ? "s" : ""}
                    </p>
                  )}
                  {filteredGenerations.map((gen) => (
                    <GenerationCard key={gen.id} gen={gen} onRegenerate={handleRegenerate} onDelete={handleDelete} onRefine={handleRefine} onToggleFavorite={handleToggleFavorite} isPremium={user?.isPremium ?? monthlyUsage?.isPremium} />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No generations match your search.
                  </p>
                  <button
                    onClick={() => { setGenSearchQuery(""); setGenStatusFilter("all"); }}
                    className="mt-2 text-xs text-pink-500 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )
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
