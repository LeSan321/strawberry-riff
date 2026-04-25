import { useState, useCallback } from "react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pen,
  Pencil,
  Check,
  Loader2,
  Sparkles,
  Copy,
  Save,
  Trash2,
  ChevronDown,
  ChevronRight,
  Music,
  BookOpen,
  Wand2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { FUSIONS } from "@shared/fusionLibrary";
import { useLocation } from "wouter";

// ─── Constants ────────────────────────────────────────────────────────────────
const WRITING_TEAM_OPTIONS = [
  { value: "Hook Master", label: "Hook Master", desc: "Sticky choruses, multisyllabic rhymes, semantic surprise" },
  { value: "Story Weaver", label: "Story Weaver", desc: "Narrative verses, perspective shifts, callback setup" },
  { value: "Poet Visionary", label: "Poet Visionary", desc: "Sensory metaphors, vivid introspection, universal appeal" },
  { value: "Tone Shifter", label: "Tone Shifter", desc: "Dynamic contrast, emotional pivots, tension-release arc" },
  { value: "Polish Editor", label: "Polish Editor", desc: "Singability, flow, phonetic smoothness, kill forced rhymes" },
];

const STRUCTURE_OPTIONS = [
  { value: "[Verse 1] [Pre-Chorus] [Chorus] [Verse 2] [Pre-Chorus] [Chorus] [Bridge] [Chorus] [Outro]", label: "Standard Pop" },
  { value: "[Verse 1] [Chorus] [Verse 2] [Chorus] [Bridge] [Chorus] [Outro]", label: "Verse-Chorus-Bridge" },
  { value: "[Verse 1] [Verse 2] [Bridge] [Verse 3] [Outro]", label: "AABA (Tin Pan Alley)" },
  { value: "[Intro] [Build] [Drop] [Verse] [Build] [Drop] [Outro]", label: "Electronic / Dance" },
  { value: "[Verse 1] [Refrain] [Verse 2] [Refrain] [Bridge] [Verse 3] [Coda]", label: "Folk / Narrative" },
  { value: "[Intro] [Verse 1] [Chorus] [Verse 2] [Chorus] [Vamp] [Outro]", label: "Jazz / Soul" },
  { value: "[Verse 1] [Chorus] [Verse 2] [Chorus] [Bridge] [Chorus] [Outro]", label: "Ballad" },
  { value: "[Verse 1] [Verse 2] [Verse 3] [Bridge] [Verse 4] [Coda]", label: "Through-Composed" },
];

const MOOD_PRESETS = [
  "smoky introspective", "euphoric chaotic", "haunting melancholic",
  "defiant gritty", "tender vulnerable", "soulful resilient",
  "frenzied euphoric", "whimsical bittersweet", "atmospheric brooding",
  "nostalgic wistful",
];

const PERSPECTIVE_OPTIONS = [
  "first-person (I/me)", "second-person (you)", "third-person (he/she/they)",
  "collective (we/us)", "shifting (first to second)", "shifting (first to universal)",
];

// ─── Fusion grouped by tier ───────────────────────────────────────────────────
const TIER_LABELS: Record<string, string> = {
  safe: "Safe Starters",
  medium: "Medium-Wild",
  experimental: "Experimental",
  global: "Global Fusions",
  wildcard: "Wildcards",
};

const FUSIONS_BY_TIER = FUSIONS.reduce<Record<string, typeof FUSIONS>>((acc, f) => {
  if (!acc[f.tier]) acc[f.tier] = [];
  acc[f.tier].push(f);
  return acc;
}, {});

// ─── Draft Card ───────────────────────────────────────────────────────────────
function DraftCard({
  draft,
  onLoad,
  onDelete,
}: {
  draft: {
    id: number;
    title: string;
    fusion: string | null;
    mood: string | null;
    generatedLyrics: string | null;
    createdAt: Date;
  };
  onLoad: (lyrics: string) => void;
  onDelete: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border p-3 text-sm hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{draft.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {draft.fusion && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 truncate max-w-[120px]">
                {draft.fusion}
              </Badge>
            )}
            {draft.mood && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {draft.mood}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(draft.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {draft.generatedLyrics && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => onLoad(draft.generatedLyrics!)}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              Load
            </Button>
          )}
          <button
            onClick={() => onDelete(draft.id)}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {draft.generatedLyrics && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <button className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {open ? "Hide" : "Preview"}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 rounded p-2 max-h-40 overflow-y-auto">
              {draft.generatedLyrics.slice(0, 400)}{draft.generatedLyrics.length > 400 ? "…" : ""}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function LyricsGeneratorPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Layer 1
  const [fusion, setFusion] = useState("");
  const [topic, setTopic] = useState("");

  // Layer 2
  const [mood, setMood] = useState("");
  const [emotionalFeeling, setEmotionalFeeling] = useState("");

  // Layer 3
  const [structure, setStructure] = useState("[Verse 1] [Chorus] [Verse 2] [Chorus] [Bridge] [Chorus] [Outro]");
  const [flowStyle, setFlowStyle] = useState("");

  // Layer 4
  const [writingTeam, setWritingTeam] = useState<string>("");
  const [craftNotes, setCraftNotes] = useState("");

  // Layer 5
  const [perspective, setPerspective] = useState("");
  const [hookSeed, setHookSeed] = useState("");
  const [constraints, setConstraints] = useState("");

  // Output
  const [generatedLyrics, setGeneratedLyrics] = useState("");
  const [stickinessAnalysis, setStickinessAnalysis] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Edit mode
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [editBuffer, setEditBuffer] = useState("");

  // Save draft dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  // Copy to Generate page state
  const [copyToGenerateOpen, setCopyToGenerateOpen] = useState(false);

  const utils = trpc.useUtils();
  const generateMutation = trpc.lyrics.generate.useMutation();
  const saveDraftMutation = trpc.lyrics.saveDraft.useMutation({
    onSuccess: () => {
      utils.lyrics.myDrafts.invalidate();
      setSaveDialogOpen(false);
      toast.success("Draft saved!");
    },
    onError: (err) => toast.error(err.message || "Failed to save draft"),
  });
  const deleteDraftMutation = trpc.lyrics.deleteDraft.useMutation({
    onMutate: async ({ id }) => {
      await utils.lyrics.myDrafts.cancel();
      const prev = utils.lyrics.myDrafts.getData();
      utils.lyrics.myDrafts.setData(undefined, (old) =>
        old ? old.filter((d) => d.id !== id) : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.lyrics.myDrafts.setData(undefined, ctx.prev);
      toast.error("Could not delete draft");
    },
    onSettled: () => utils.lyrics.myDrafts.invalidate(),
  });

  const { data: myDrafts, isLoading: isLoadingDrafts } =
    trpc.lyrics.myDrafts.useQuery(undefined, { enabled: !!user });

  const handleGenerate = useCallback(async () => {
    if (!fusion.trim()) { toast.error("Please select a fusion"); return; }
    if (!topic.trim()) { toast.error("Topic / theme is required"); return; }
    if (!mood.trim()) { toast.error("Mood is required"); return; }

    setIsGenerating(true);
    setGeneratedLyrics("");
    setStickinessAnalysis("");

    try {
      const result = await generateMutation.mutateAsync({
        fusion: fusion.trim(),
        topic: topic.trim(),
        mood: mood.trim(),
        emotionalFeeling: emotionalFeeling.trim() || undefined,
        structure: structure.trim(),
        flowStyle: flowStyle.trim() || undefined,
        writingTeam: writingTeam as any || undefined,
        craftNotes: craftNotes.trim() || undefined,
        perspective: perspective.trim() || undefined,
        hookSeed: hookSeed.trim() || undefined,
        constraints: constraints.trim() || undefined,
        saveDraft: false,
      });
      setGeneratedLyrics(result.lyrics);
      setStickinessAnalysis(result.stickinessAnalysis);
      toast.success("Lyrics generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [fusion, topic, mood, emotionalFeeling, structure, flowStyle, writingTeam, craftNotes, perspective, hookSeed, constraints]);

  const handleCopyLyrics = useCallback(() => {
    if (!generatedLyrics) return;
    navigator.clipboard.writeText(generatedLyrics);
    toast.success("Lyrics copied to clipboard!");
  }, [generatedLyrics]);

  const handleCopyToGenerate = useCallback(() => {
    if (!generatedLyrics) return;
    sessionStorage.setItem("prefill_lyrics", generatedLyrics);
    // Also carry over the music style prompt (fusion) and title (from hookSeed or topic)
    if (fusion.trim()) {
      sessionStorage.setItem("prefill_prompt", fusion.trim());
    }
    const titleGuess = hookSeed.trim() || topic.trim().slice(0, 60);
    if (titleGuess) {
      sessionStorage.setItem("prefill_title", titleGuess);
    }
    navigate("/generate");
    toast.success("Lyrics, style prompt, and title loaded into Generate!");
  }, [generatedLyrics, fusion, hookSeed, topic, navigate]);

  const handleStartEdit = useCallback(() => {
    setEditBuffer(generatedLyrics);
    setIsEditingLyrics(true);
  }, [generatedLyrics]);

  const handleSaveEdit = useCallback(() => {
    setGeneratedLyrics(editBuffer);
    setIsEditingLyrics(false);
    toast.success("Lyrics updated!");
  }, [editBuffer]);

  const handleCancelEdit = useCallback(() => {
    setEditBuffer("");
    setIsEditingLyrics(false);
  }, []);

  const handleSaveDraft = useCallback(() => {
    if (!generatedLyrics) return;
    setDraftTitle(topic.slice(0, 60) || "Untitled");
    setSaveDialogOpen(true);
  }, [generatedLyrics, topic]);

  const handleConfirmSave = useCallback(() => {
    saveDraftMutation.mutate({
      title: draftTitle || "Untitled",
      fusion: fusion || undefined,
      mood: mood || undefined,
      topic: topic || undefined,
      perspective: perspective || undefined,
      hookSeed: hookSeed || undefined,
      structure: structure || undefined,
      writingTeam: writingTeam || undefined,
      generatedLyrics,
      stickinessAnalysis: stickinessAnalysis || undefined,
    });
  }, [draftTitle, fusion, mood, topic, perspective, hookSeed, structure, writingTeam, generatedLyrics, stickinessAnalysis]);

  const handleLoadDraft = useCallback((lyrics: string) => {
    setGeneratedLyrics(lyrics);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info("Draft loaded into output panel");
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <Pen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold">Sign in to Write Lyrics</h2>
          <p className="text-muted-foreground">
            Use the AI Lyrics Generator powered by the Strawberry Riff Writer's Bible
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* ── Left: Form ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card className="p-6">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 p-2.5">
                <Pen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Lyrics Generator</h1>
                <p className="mt-1 text-muted-foreground">
                  Powered by the Strawberry Riff Writer's Bible — 5-Layer Formula
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Layer 1 — Fusion & Theme */}
              <div className="rounded-lg border border-pink-200/50 bg-pink-500/5 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-xs font-bold text-white">1</span>
                  <h3 className="font-semibold text-sm">Fusion &amp; Theme</h3>
                  <span className="text-xs text-muted-foreground">— the creative DNA</span>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Fusion Style</label>
                  <Select value={fusion} onValueChange={setFusion} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a fusion from the library…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {Object.entries(TIER_LABELS).map(([tier, label]) =>
                        FUSIONS_BY_TIER[tier]?.map((f) => (
                          <SelectItem key={f.name} value={f.name}>
                            <span className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs px-1 py-0 capitalize shrink-0">{tier}</Badge>
                              {f.name}
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">Or type a custom fusion below</p>
                  <Input
                    className="mt-1.5"
                    placeholder="e.g., Velvet Strawberry Club (Jazz + Lo-fi + Soul)"
                    value={fusion}
                    onChange={(e) => setFusion(e.target.value)}
                    disabled={isGenerating}
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Topic / Theme <span className="text-destructive">*</span></label>
                  <Input
                    placeholder="e.g., midnight longing, self-discovery after heartbreak, euphoric escape"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isGenerating}
                    maxLength={500}
                  />
                </div>
              </div>

              {/* Layer 2 — Mood & Emotion */}
              <div className="rounded-lg border border-purple-200/50 bg-purple-500/5 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white">2</span>
                  <h3 className="font-semibold text-sm">Mood &amp; Emotion</h3>
                  <span className="text-xs text-muted-foreground">— the emotional temperature</span>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Mood <span className="text-destructive">*</span></label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {MOOD_PRESETS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMood(m)}
                        className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                          mood === m
                            ? "bg-purple-500 border-purple-500 text-white"
                            : "border-border hover:border-purple-400 hover:bg-purple-500/10"
                        }`}
                        disabled={isGenerating}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Or type a custom mood…"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    disabled={isGenerating}
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Emotional Feeling <span className="text-xs text-muted-foreground">(optional)</span></label>
                  <Input
                    placeholder="e.g., sultry vulnerability, explosive joy, quiet resilience"
                    value={emotionalFeeling}
                    onChange={(e) => setEmotionalFeeling(e.target.value)}
                    disabled={isGenerating}
                    maxLength={200}
                  />
                </div>
              </div>

              {/* Layer 3 — Structure & Flow */}
              <div className="rounded-lg border border-blue-200/50 bg-blue-500/5 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">3</span>
                  <h3 className="font-semibold text-sm">Structure &amp; Flow</h3>
                  <span className="text-xs text-muted-foreground">— the architectural blueprint</span>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Song Structure</label>
                  <Select value={structure} onValueChange={setStructure} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STRUCTURE_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground font-mono text-muted-foreground/70">{structure}</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Flow Style <span className="text-xs text-muted-foreground">(optional)</span></label>
                  <Input
                    placeholder="e.g., melismatic glide, dense rhythmic, sparse introspective, elastic syncopated"
                    value={flowStyle}
                    onChange={(e) => setFlowStyle(e.target.value)}
                    disabled={isGenerating}
                    maxLength={200}
                  />
                </div>
              </div>

              {/* Layer 4 — Craft Technique */}
              <div className="rounded-lg border border-amber-200/50 bg-amber-500/5 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">4</span>
                  <h3 className="font-semibold text-sm">Craft Technique</h3>
                  <span className="text-xs text-muted-foreground">— the writing team and tools</span>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Writing Team Member <span className="text-xs text-muted-foreground">(optional)</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {WRITING_TEAM_OPTIONS.map((member) => (
                      <button
                        key={member.value}
                        onClick={() => setWritingTeam(writingTeam === member.value ? "" : member.value)}
                        disabled={isGenerating}
                        className={`rounded-lg border p-2.5 text-left transition-colors ${
                          writingTeam === member.value
                            ? "border-amber-400 bg-amber-500/10"
                            : "border-border hover:border-amber-300 hover:bg-amber-500/5"
                        }`}
                      >
                        <p className="text-xs font-semibold">{member.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{member.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Craft Notes <span className="text-xs text-muted-foreground">(optional)</span></label>
                  <Textarea
                    placeholder="e.g., motif development: transform 'winding road' from loss to hope; semantic surprise: pun on 'riff'; perspective shift: first to second in chorus"
                    value={craftNotes}
                    onChange={(e) => setCraftNotes(e.target.value)}
                    disabled={isGenerating}
                    maxLength={500}
                    rows={2}
                  />
                </div>
              </div>

              {/* Layer 5 — Constraints & Refinement */}
              <div className="rounded-lg border border-green-200/50 bg-green-500/5 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">5</span>
                  <h3 className="font-semibold text-sm">Constraints &amp; Refinement</h3>
                  <span className="text-xs text-muted-foreground">— precision tuning</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Narrative Perspective <span className="text-xs text-muted-foreground">(optional)</span></label>
                    <Select value={perspective} onValueChange={setPerspective} disabled={isGenerating}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose perspective…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No preference</SelectItem>
                        {PERSPECTIVE_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Hook Seed <span className="text-xs text-muted-foreground">(optional)</span></label>
                    <Input
                      placeholder="e.g., chasing neon lights, velvet dusk"
                      value={hookSeed}
                      onChange={(e) => setHookSeed(e.target.value)}
                      disabled={isGenerating}
                      maxLength={500}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Additional Constraints <span className="text-xs text-muted-foreground">(optional)</span></label>
                  <Input
                    placeholder="e.g., avoid 'blue moon'; more tender tone; 200 words; more like Bob Dylan"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    disabled={isGenerating}
                    maxLength={500}
                  />
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !fusion.trim() || !topic.trim() || !mood.trim()}
                size="lg"
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
              >
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Writing your lyrics…</>
                ) : (
                  <><Wand2 className="mr-2 h-5 w-5" />Generate Lyrics</>
                )}
              </Button>
            </div>
          </Card>

          {/* ── Output Panel ── */}
          {(generatedLyrics || isGenerating) && (
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-pink-500" />
                  <h2 className="font-semibold">Generated Lyrics</h2>
                </div>
                {generatedLyrics && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {isEditingLyrics ? (
                      <>
                        <Button size="sm" variant="default" onClick={handleSaveEdit}>
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="outline" onClick={handleStartEdit}>
                              <Pencil className="h-3.5 w-3.5 mr-1.5" />
                              Edit
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit lyrics directly</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="outline" onClick={handleCopyLyrics}>
                              <Copy className="h-3.5 w-3.5 mr-1.5" />
                              Copy
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy lyrics to clipboard</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="outline" onClick={handleCopyToGenerate}>
                              <Music className="h-3.5 w-3.5 mr-1.5" />
                              Use in Generate
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Load these lyrics into the Generate page</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="outline" onClick={handleSaveDraft}>
                              <Save className="h-3.5 w-3.5 mr-1.5" />
                              Save Draft
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Save to your drafts library</TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
                )}
              </div>

              {isGenerating && !generatedLyrics ? (
                <div className="flex items-center gap-3 py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>The Writing Team is crafting your lyrics…</span>
                </div>
              ) : (
                <>
                  {isEditingLyrics ? (
                    <Textarea
                      value={editBuffer}
                      onChange={(e) => setEditBuffer(e.target.value)}
                      className="font-mono text-sm leading-relaxed min-h-[400px] max-h-[600px] resize-y"
                      autoFocus
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed bg-muted/30 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                      {generatedLyrics}
                    </pre>
                  )}

                  {stickinessAnalysis && (
                    <div className="mt-4 rounded-lg border border-pink-200/50 bg-pink-500/5 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-pink-500" />
                        <h3 className="text-sm font-semibold text-pink-700">Stickiness Analysis</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{stickinessAnalysis}</p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCopyToGenerate}
                    >
                      <Music className="mr-2 h-4 w-4" />
                      Use These Lyrics in Generate
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                </>
              )}
            </Card>
          )}
        </div>

        {/* ── Right: Saved Drafts ── */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Save className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Saved Drafts</h2>
              {myDrafts && myDrafts.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {myDrafts.length}
                </Badge>
              )}
            </div>

            {isLoadingDrafts ? (
              <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading drafts…
              </div>
            ) : !myDrafts || myDrafts.length === 0 ? (
              <div className="py-6 text-center">
                <Pen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No saved drafts yet.</p>
                <p className="text-xs text-muted-foreground mt-0.5">Generate lyrics and save them here.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {myDrafts.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    onLoad={handleLoadDraft}
                    onDelete={(id) => deleteDraftMutation.mutate({ id })}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Quick Tips */}
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Writer's Tips</h2>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p><strong className="text-foreground">Hook Master</strong> — best for pop, R&amp;B, and anything chorus-driven</p>
              <p><strong className="text-foreground">Story Weaver</strong> — best for folk, country, and narrative songs</p>
              <p><strong className="text-foreground">Poet Visionary</strong> — best for indie, art pop, and lyric-forward songs</p>
              <p><strong className="text-foreground">Tone Shifter</strong> — best when you need emotional contrast</p>
              <p><strong className="text-foreground">Polish Editor</strong> — best for refining an existing draft</p>
              <hr className="my-2 border-border" />
              <p>Use <strong className="text-foreground">Hook Seed</strong> to anchor the AI to a specific phrase or image you want in the hook.</p>
              <p>Use <strong className="text-foreground">Craft Notes</strong> for advanced techniques like motif development or perspective shifts.</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Save Draft Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Draft</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Draft Title</label>
              <Input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="e.g., Midnight Velvet Club"
                maxLength={200}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)} disabled={saveDraftMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSave} disabled={saveDraftMutation.isPending || !draftTitle.trim()}>
              {saveDraftMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Save</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
